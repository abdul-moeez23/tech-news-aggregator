from django.urls import path
from .views import FeedListView, SyncNowView

urlpatterns = [
    path('feed/', FeedListView.as_view(), name='personalized-feed'),
    path('feed/sync-now/', SyncNowView.as_view(), name='sync-now'),
]
