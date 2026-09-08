from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import ArticleMetadata
from .serializers import ArticleSerializer
from preferences.models import UserProfile

class FeedListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            return ArticleMetadata.objects.prefetch_related('sources').all()[:50]

        freshness_limit = timezone.now() - timedelta(days=profile.freshness_days)
        queryset = ArticleMetadata.objects.filter(publication_date__gte=freshness_limit)

        # Because an article can have multiple sources now, we check if it overlaps 
        # with ANY of the user's enabled sources.
        user_sources = profile.sources.all()
        if user_sources.exists():
            queryset = queryset.filter(sources__in=user_sources).distinct()

        user_categories = profile.categories.all()
        if user_categories.exists():
            queryset = queryset.filter(category__in=user_categories)
            
        # Optimization for ManyToMany fields
        queryset = queryset.prefetch_related('sources').select_related('category')
            
        return queryset

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .tasks import fetch_latest_news

class SyncNowView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        # Trigger Celery task for this user specifically
        fetch_latest_news.delay(user_id=request.user.id)
        return Response({"status": "Sync triggered successfully"}, status=status.HTTP_202_ACCEPTED)
