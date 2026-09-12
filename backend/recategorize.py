import os
import django
import sys

# Setup Django environment
sys.path.append('C:/project/tech-news-aggregator/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from feed.models import ArticleMetadata
from feed.utils.filtering import categorize_articles_batch

articles = ArticleMetadata.objects.filter(category__isnull=True)
print(f"Found {articles.count()} uncategorized articles.")

# Process in batches
batch_size = 32
articles_list = list(articles)
for i in range(0, len(articles_list), batch_size):
    batch = articles_list[i:i + batch_size]
    batch_data = [{'title': a.title, 'summary': a.summary} for a in batch]
    categories = categorize_articles_batch(batch_data)
    
    for a, cat in zip(batch, categories):
        if cat:
            a.category = cat
            a.save(update_fields=['category'])
    
    print(f"Processed batch {i // batch_size + 1} / {len(articles_list) // batch_size + 1}")

print("Done re-categorizing.")
