from rest_framework import serializers
from .models import UserProfile, Category, Source

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'subcategories']

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
    muted_topics = serializers.SlugRelatedField(
        many=True, 
        slug_field='name', 
        queryset=Category.objects.all(),
        required=False
    )
    sources = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Source.objects.all()
    )

    class Meta:
        model = UserProfile
        fields = ['freshness_days', 'categories', 'muted_topics', 'sources', 'auto_fetch', 'fetch_frequency']
