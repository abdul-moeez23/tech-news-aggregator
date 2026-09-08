from rest_framework import serializers
from .models import UserProfile, Category, Source

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    categories = serializers.SlugRelatedField(
        many=True, 
        slug_field='name', 
        queryset=Category.objects.all()
    )
    sources = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Source.objects.all()
    )

    class Meta:
        model = UserProfile
        fields = ['freshness_days', 'categories', 'sources', 'auto_fetch', 'fetch_frequency']
