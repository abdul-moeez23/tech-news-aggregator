from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer, CategorySerializer, SourceSerializer
from .models import UserProfile, Category, Source

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

from django.db import models
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

class SourceViewSet(viewsets.ModelViewSet):
    serializer_class = SourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see global sources (user=null) and their own sources
        return Source.objects.filter(models.Q(user__isnull=True) | models.Q(user=self.request.user))

    def perform_create(self, serializer):
        source = serializer.save(user=self.request.user)
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        profile.sources.add(source)

    def perform_update(self, serializer):
        if serializer.instance.user != self.request.user:
            raise PermissionDenied("You can only edit your own custom sources.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied("You can only delete your own custom sources.")
        instance.delete()
