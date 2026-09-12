from rest_framework import serializers
from .models import ArticleMetadata

class ArticleSerializer(serializers.ModelSerializer):
    # Retrieve a list of source names instead of a single string
    source_names = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, default="Uncategorized")
    parent_category_name = serializers.SerializerMethodField()

    class Meta:
        model = ArticleMetadata
        fields = ['id', 'title', 'url', 'summary', 'publication_date', 'source_names', 'category_name', 'parent_category_name']
        
    def get_source_names(self, obj):
        return [source.name for source in obj.sources.all()]

    def get_parent_category_name(self, obj):
        if obj.category and obj.category.parent:
            return obj.category.parent.name
        return None
