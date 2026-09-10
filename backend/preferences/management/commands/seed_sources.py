from django.core.management.base import BaseCommand
from preferences.models import Source, Category

class Command(BaseCommand):
    help = 'Seed the database with default sources and categories'

    def handle(self, *args, **kwargs):
        categories = {
            'AI': ['Generative AI', 'Machine Learning', 'Computer Vision', 'NLP'],
            'Cloud Computing': ['AWS', 'GCP', 'Azure', 'Serverless'],
            'Software Engineering': ['Frontend', 'Backend', 'Fullstack', 'DevOps'],
            'Cybersecurity': ['Network Security', 'Cryptography', 'Ethical Hacking'],
            'Startups': ['Venture Capital', 'Bootstrapping', 'Growth Hacking'],
            'Programming': ['Python', 'JavaScript', 'Rust', 'Go'],
            'Developer Tools': ['IDEs', 'Version Control', 'CI/CD'],
            'Web3': ['Blockchain', 'DeFi', 'NFTs', 'Smart Contracts']
        }
        for main_cat, sub_cats in categories.items():
            parent_cat, _ = Category.objects.get_or_create(name=main_cat)
            for sub_cat in sub_cats:
                Category.objects.get_or_create(name=sub_cat, defaults={'parent': parent_cat})
        
        sources = [
            {'name': 'Hacker News', 'url': 'https://news.ycombinator.com/rss'},
            {'name': 'The New Stack', 'url': 'https://thenewstack.io/feed/'},
            {'name': 'Smashing Magazine', 'url': 'https://www.smashingmagazine.com/feed/'},
            {'name': 'Dev.to', 'url': 'https://dev.to/feed'},
            {'name': 'freeCodeCamp', 'url': 'https://www.freecodecamp.org/news/rss/'},
            {'name': 'InfoQ', 'url': 'https://feed.infoq.com/'},
            {'name': 'Lobsters', 'url': 'https://lobste.rs/rss'},
            {'name': 'Netflix TechBlog', 'url': 'https://netflixtechblog.com/feed'},
            {'name': 'Uber Engineering', 'url': 'https://eng.uber.com/feed/'},
            {'name': 'React Blog', 'url': 'https://react.dev/rss.xml'},
            {'name': 'Python Insider', 'url': 'https://feeds.feedburner.com/PythonInsider'},
            {'name': 'Rust Blog', 'url': 'https://blog.rust-lang.org/feed.xml'},
            {'name': 'CSS-Tricks', 'url': 'https://css-tricks.com/feed/'},
            # AI & Computer Science specific sources
            {'name': 'Berkeley AI Research', 'url': 'https://bair.berkeley.edu/blog/feed.xml'},
            {'name': 'OpenAI Blog', 'url': 'https://openai.com/blog/rss.xml'},
            {'name': 'DeepMind Blog', 'url': 'https://deepmind.google/blog/rss.xml'},
            {'name': 'ACM Queue', 'url': 'https://queue.acm.org/rss/feeds/queuecontent.xml'},
            {'name': 'KDnuggets', 'url': 'https://www.kdnuggets.com/feed'},
            {'name': 'Towards Data Science', 'url': 'https://towardsdatascience.com/feed'},
            {'name': 'MIT CSAIL', 'url': 'https://www.csail.mit.edu/news/rss'}
        ]
        
        for source_data in sources:
            Source.objects.get_or_create(
                name=source_data['name'],
                defaults={'url': source_data['url'], 'is_active': True}
            )
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded database with categories and sources!'))
