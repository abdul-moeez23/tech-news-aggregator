from django.core.management.base import BaseCommand
from preferences.models import Source, Category

class Command(BaseCommand):
    help = 'Seed the database with default sources and categories'

    def handle(self, *args, **kwargs):
        categories = [
            'AI', 'Startups', 'Cybersecurity', 'Cloud', 'Programming', 
            'Developer Tools', 'Gadgets', 'Apple', 'Google', 'Microsoft', 
            'Open Source', 'FinTech', 'Robotics', 'Web3'
        ]
        for cat_name in categories:
            Category.objects.get_or_create(name=cat_name)
        
        sources = [
            {'name': 'Hacker News', 'url': 'https://news.ycombinator.com/rss'},
            {'name': 'TechCrunch', 'url': 'https://techcrunch.com/feed/'},
            {'name': 'The Verge', 'url': 'https://www.theverge.com/rss/index.xml'},
            {'name': 'WIRED', 'url': 'https://www.wired.com/feed/rss'},
            {'name': 'Ars Technica', 'url': 'https://feeds.arstechnica.com/arstechnica/index'},
            {'name': 'The New Stack', 'url': 'https://thenewstack.io/feed/'},
            {'name': 'Smashing Magazine', 'url': 'https://www.smashingmagazine.com/feed/'},
            {'name': 'MIT Tech Review', 'url': 'https://www.technologyreview.com/feed/'}
        ]
        
        for source_data in sources:
            Source.objects.get_or_create(
                name=source_data['name'],
                defaults={'url': source_data['url'], 'is_active': True}
            )
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded database with categories and sources!'))
