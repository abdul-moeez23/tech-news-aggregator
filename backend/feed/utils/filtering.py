import re
from preferences.models import Category

def categorize_article(title, summary):
    text_to_search = f"{title} {summary}".lower()
    
    categories = Category.objects.all()
    for category in categories:
        pattern = r'\b' + re.escape(category.name.lower()) + r'\b'
        if re.search(pattern, text_to_search):
            return category
            
    return None
