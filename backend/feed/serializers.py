from rest_framework import serializers
from .models import ArticleMetadata

class ArticleSerializer(serializers.ModelSerializer):
    # Retrieve a list of source names instead of a single string
    source_names = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, default="Uncategorized")

    class Meta:
        model = ArticleMetadata
        fields = ['id', 'title', 'url', 'summary', 'publication_date', 'source_names', 'category_name']
        
    def get_source_names(self, obj):
        return [source.name for source in obj.sources.all()]
