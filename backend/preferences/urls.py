from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileDetailView, CategoryListView, SourceViewSet

router = DefaultRouter()
router.register(r'sources', SourceViewSet, basename='source')

urlpatterns = [
    path('preferences/', UserProfileDetailView.as_view(), name='user-preferences'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('', include(router.urls)),
]
