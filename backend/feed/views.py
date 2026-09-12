from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import ArticleMetadata
from .serializers import ArticleSerializer
from .pagination import StandardResultsSetPagination
from preferences.models import UserProfile

class FeedListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            return ArticleMetadata.objects.prefetch_related('sources').all()

        freshness_limit = timezone.now() - timedelta(days=profile.freshness_days)
        queryset = ArticleMetadata.objects.filter(publication_date__gte=freshness_limit)

        user_sources = profile.sources.all()
        if user_sources.exists():
            queryset = queryset.filter(sources__in=user_sources).distinct()

        user_categories = profile.categories.all()
        muted_topics = profile.muted_topics.all()
        
        if user_categories.exists() or muted_topics.exists():
            from django.db.models import Case, When, Value, IntegerField, Q
            from preferences.models import Category
            
            # Expanded preference profile logic
            selected_main_ids = [c.id for c in user_categories if c.parent_id is None]
            selected_sub_ids = [c.id for c in user_categories if c.parent_id is not None]
            implicit_sub_ids = list(Category.objects.filter(parent_id__in=selected_main_ids).exclude(id__in=selected_sub_ids).values_list('id', flat=True))
            muted_ids = list(muted_topics.values_list('id', flat=True))
            
            # Step 9.3 & 9.4 Relevance Scoring
            queryset = queryset.annotate(
                relevance_score=Case(
                    When(category_id__in=muted_ids, then=Value(-100)), # Strong penalty for muted topics
                    When(category_id__in=selected_sub_ids, then=Value(3)),
                    When(category_id__in=selected_main_ids, then=Value(2)),
                    When(category_id__in=implicit_sub_ids, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
            # Filter out severely penalized articles
            queryset = queryset.filter(relevance_score__gte=0)
            
            # Sort by score then date
            queryset = queryset.order_by('-relevance_score', '-publication_date')
        else:
            queryset = queryset.order_by('-publication_date')
            
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
        
        # Synchronously recategorize old articles so it happens immediately
        try:
            from .models import ArticleMetadata
            from .utils.filtering import categorize_articles_batch
            uncategorized = ArticleMetadata.objects.filter(category__isnull=True)
            if uncategorized.exists():
                uncat_list = list(uncategorized[:100]) # Limit to 100 to avoid long request timeout
                batch_data = [{'title': a.title, 'summary': a.summary} for a in uncat_list]
                new_cats = categorize_articles_batch(batch_data)
                
                for a, cat in zip(uncat_list, new_cats):
                    if cat:
                        a.category = cat
                        a.save(update_fields=['category'])
        except Exception as e:
            print("Error recategorizing in SyncNow:", e)
            
        # Debug: dump category counts
        try:
            from django.db.models import Count
            from .models import ArticleMetadata
            counts = list(ArticleMetadata.objects.values('category__name').annotate(count=Count('id')))
            return Response({"status": "Sync triggered successfully", "counts": counts}, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            pass
            
        return Response({"status": "Sync triggered successfully"}, status=status.HTTP_202_ACCEPTED)
