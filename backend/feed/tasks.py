from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from preferences.models import Source, UserProfile, UserSourceSync
from .models import ArticleMetadata
from .utils.parsers import parse_rss_feed, parse_json_api
from .utils.deduplication import generate_article_hash, is_title_similar
from .utils.filtering import categorize_article

@shared_task
def fetch_latest_news(user_id=None):
    now = timezone.now()
    
    # 1. Evaluate user-centric schedules to determine which sources need fetching
    sources_to_fetch = {}  # source_id -> { 'source': Source, 'users': [user1, user2], 'min_sync_date': datetime }
    
    if user_id:
        profiles = UserProfile.objects.filter(user_id=user_id).select_related('user')
    else:
        profiles = UserProfile.objects.filter(auto_fetch=True).select_related('user')
        
    for profile in profiles:
        user = profile.user
        frequency_minutes = profile.fetch_frequency
        
        for source in profile.sources.filter(is_active=True):
            sync_record, _ = UserSourceSync.objects.get_or_create(user=user, source=source)
            
            is_due = False
            if user_id:
                is_due = True  # Force sync if triggered manually
            elif not sync_record.last_successful_sync:
                is_due = True
            else:
                next_sync_time = sync_record.last_successful_sync + timedelta(minutes=frequency_minutes)
                if now >= next_sync_time:
                    is_due = True
                    
            if is_due:
                if source.id not in sources_to_fetch:
                    sources_to_fetch[source.id] = {'source': source, 'users': [], 'min_sync_date': None}
                    # Initialize min_sync_date with current user's sync date to start tracking
                    if sync_record.last_successful_sync:
                        sources_to_fetch[source.id]['min_sync_date'] = sync_record.last_successful_sync
                        
                sources_to_fetch[source.id]['users'].append(user)
                
                # Update min_sync_date for incremental fetch (find earliest among all users)
                current_min = sources_to_fetch[source.id]['min_sync_date']
                if not sync_record.last_successful_sync:
                    sources_to_fetch[source.id]['min_sync_date'] = None # Can't filter if any user is new
                elif current_min and sync_record.last_successful_sync < current_min:
                    sources_to_fetch[source.id]['min_sync_date'] = sync_record.last_successful_sync

    # 2. Fetch and process the determined sources
    for source_id, data in sources_to_fetch.items():
        source = data['source']
        users_due = data['users']
        min_sync_date = data['min_sync_date']
        
        url = source.url.lower()
        
        try:
            if 'api' in url or 'json' in url:
                raw_articles = parse_json_api(source.url)
            else:
                raw_articles = parse_rss_feed(source.url)
                
            saved_count = 0
            merged_count = 0
            
            for article_data in raw_articles:
                try:
                    # Incremental fetch check: skip articles older than the last sync time
                    pub_date = article_data.get('published_at')
                    if pub_date and min_sync_date and pub_date <= min_sync_date:
                        continue

                    # Generate unique hash for the article URL
                    article_hash = generate_article_hash(article_data['url'])
                    
                    # Check for exact URL hash duplicate
                    existing_article = ArticleMetadata.objects.filter(hash=article_hash).first()
                    
                    if not existing_article:
                        # If no exact URL match, check for high title similarity in recent articles
                        recent_articles = ArticleMetadata.objects.filter(
                            publication_date__gte=now - timedelta(days=2)
                        )
                        for recent in recent_articles:
                            if is_title_similar(article_data['title'], recent.title, threshold=0.85):
                                existing_article = recent
                                break

                    if existing_article:
                        # Duplicate detected! Consolidate data by appending this source
                        if not existing_article.sources.filter(id=source.id).exists():
                            existing_article.sources.add(source)
                            merged_count += 1
                    else:
                        # Truly new article, create a new row
                        matched_category = categorize_article(article_data['title'], article_data['summary'])
                        
                        new_article = ArticleMetadata.objects.create(
                            title=article_data['title'],
                            url=article_data['url'],
                            summary=article_data['summary'],
                            publication_date=article_data.get('published_at') or now,
                            hash=article_hash,
                            category=matched_category
                        )
                        new_article.sources.add(source)
                        saved_count += 1
                except Exception as e:
                    print(f"Failed to process article {article_data.get('url')}: {e}")
                    
            print(f"Source {source.name}: Fetched {len(raw_articles)}, Saved {saved_count} new, Merged {merged_count} duplicates.")
            
            # 3. Update last_successful_sync for users who were due for this source
            for user in users_due:
                sync_record = UserSourceSync.objects.get(user=user, source=source)
                sync_record.last_successful_sync = now
                sync_record.save()
                
        except Exception as e:
            print(f"Source {source.name} failed to fetch: {e}")


@shared_task
def cleanup_old_articles(days_to_keep=30):
    cutoff_date = timezone.now() - timedelta(days=days_to_keep)
    old_articles = ArticleMetadata.objects.filter(publication_date__lt=cutoff_date)
    count = old_articles.count()
    old_articles.delete()
    print(f"Cleanup Job: Deleted {count} articles older than {days_to_keep} days.")
