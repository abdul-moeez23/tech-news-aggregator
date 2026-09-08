from django.db import models
from preferences.models import Source, Category

class ArticleMetadata(models.Model):
    title = models.CharField(max_length=500)
    url = models.URLField(max_length=1000, unique=True)
    sources = models.ManyToManyField(Source, related_name='articles')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='articles')
    publication_date = models.DateTimeField()
    summary = models.TextField(blank=True)
    hash = models.CharField(max_length=256, blank=True, null=True) 
    first_detected_timestamp = models.DateTimeField(auto_now_add=True)
    last_updated_timestamp = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-publication_date']

    def __str__(self):
        return self.title
