from django.core.management.base import BaseCommand
from feed.models import ArticleMetadata
from feed.utils.filtering import categorize_articles_batch

class Command(BaseCommand):
    help = "Retroactively applies the new AI semantic categorization to existing Uncategorized articles."

    def handle(self, *args, **options):
        # Find all articles that currently have no category
        uncategorized = ArticleMetadata.objects.filter(category__isnull=True)
        total = uncategorized.count()
        
        if total == 0:
            self.stdout.write(self.style.SUCCESS("No uncategorized articles found!"))
            return
            
        self.stdout.write(f"Found {total} uncategorized articles. Running AI categorization...")
        
        # Prepare data in the format expected by categorize_articles_batch
        articles_data = [
            {'title': a.title, 'summary': a.summary} 
            for a in uncategorized
        ]
        
        # Run batch categorization
        matched_categories = categorize_articles_batch(articles_data)
        
        # Save results
        updated_count = 0
        for article, new_category in zip(uncategorized, matched_categories):
            if new_category:
                article.category = new_category
                article.save(update_fields=['category'])
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f"Categorized: '{article.title[:50]}...' -> {new_category.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Still Uncategorized: '{article.title[:50]}...'"))
                
        self.stdout.write(self.style.SUCCESS(f"\nDone! Successfully categorized {updated_count} out of {total} articles."))
