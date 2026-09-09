import feedparser
import requests
from email.utils import parsedate_to_datetime

def parse_rss_feed(url):
    feed = feedparser.parse(url)
    articles = []
    for entry in feed.entries:
        published_str = entry.get('published', '')
        published_dt = None
        if published_str:
            try:
                published_dt = parsedate_to_datetime(published_str)
                from django.utils import timezone
                if timezone.is_naive(published_dt):
                    published_dt = timezone.make_aware(published_dt)
            except Exception:
                published_dt = None
                
        from django.utils.html import strip_tags
        import html
        
        raw_summary = entry.get('summary', '')
        # Unescape up to 3 times to handle double-escaped tags
        for _ in range(3):
            prev = raw_summary
            raw_summary = html.unescape(raw_summary)
            if raw_summary == prev:
                break
                
        articles.append({
            'title': entry.get('title', ''),
            'url': entry.get('link', ''),
            'summary': strip_tags(raw_summary),
            'published_at': published_dt
        })
    return articles

def parse_json_api(url, categories=None):
    params = {}
    if categories:
        params['tag'] = categories[0].name.replace(' ', '-').lower()
        
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        articles = []
        for item in data: 
            pub_date_str = item.get('published_at', '')
            pub_date_dt = None
            if pub_date_str:
                try:
                    # Basic ISO 8601 parsing fallback
                    from django.utils.dateparse import parse_datetime
                    from django.utils import timezone
                    pub_date_dt = parse_datetime(pub_date_str)
                    if pub_date_dt and timezone.is_naive(pub_date_dt):
                        pub_date_dt = timezone.make_aware(pub_date_dt)
                except Exception:
                    pub_date_dt = None
                    
            from django.utils.html import strip_tags
            import html
            
            raw_summary = item.get('description', '')
            for _ in range(3):
                prev = raw_summary
                raw_summary = html.unescape(raw_summary)
                if raw_summary == prev:
                    break
                    
            articles.append({
                'title': item.get('title', ''),
                'url': item.get('url', ''),
                'summary': strip_tags(raw_summary),
                'published_at': pub_date_dt
            })
        return articles
    except Exception as e:
        print(f"Error fetching JSON API {url}: {e}")
        return []
