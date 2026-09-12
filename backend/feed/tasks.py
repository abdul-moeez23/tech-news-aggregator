from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from preferences.models import Source, UserProfile, UserSourceSync
from .models import ArticleMetadata
from .utils.parsers import parse_rss_feed, parse_json_api
from .utils.deduplication import generate_article_hash, is_title_similar
from .utils.filtering import categorize_articles_batch

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

            saved_count  = 0
            merged_count = 0

            # ------------------------------------------------------------------
            # Pass 1: separate new articles from duplicates
            # ------------------------------------------------------------------
            new_articles     = []   # dicts that need a fresh DB row
            duplicate_pairs  = []   # (existing_article, source) for merge-only

            for article_data in raw_articles:
                try:
                    # Incremental fetch check: skip articles older than last sync
                    pub_date = article_data.get('published_at')
                    if pub_date and min_sync_date and pub_date <= min_sync_date:
                        continue

                    article_hash     = generate_article_hash(article_data['url'])
                    existing_article = ArticleMetadata.objects.filter(hash=article_hash).first()

                    if not existing_article:
                        # Check title similarity against recent articles
                        recent_articles = ArticleMetadata.objects.filter(
                            publication_date__gte=now - timedelta(days=2)
                        )
                        for recent in recent_articles:
                            if is_title_similar(article_data['title'], recent.title, threshold=0.85):
                                existing_article = recent
                                break

                    if existing_article:
                        duplicate_pairs.append((existing_article, source))
                    else:
                        # Store the hash on the dict so Pass 3 can use it
                        article_data['_hash'] = article_hash
                        new_articles.append(article_data)

                except Exception as e:
                    print(f"Failed to classify article {article_data.get('url')}: {e}")

            # ------------------------------------------------------------------
            # Pass 2: batch-categorize all NEW articles in one forward pass (batch_size=32)
            # ------------------------------------------------------------------
            categories = categorize_articles_batch(new_articles)  # list[Category|None]

            # ------------------------------------------------------------------
            # Pass 3: save new articles and merge duplicates
            # ------------------------------------------------------------------
            for article_data, matched_category in zip(new_articles, categories):
                try:
                    new_article = ArticleMetadata.objects.create(
                        title=article_data['title'],
                        url=article_data['url'],
                        summary=article_data['summary'],
                        publication_date=article_data.get('published_at') or now,
                        hash=article_data['_hash'],
                        category=matched_category,
                    )
                    new_article.sources.add(source)
                    saved_count += 1
                except Exception as e:
                    print(f"Failed to save article {article_data.get('url')}: {e}")

            for existing_article, src in duplicate_pairs:
                try:
                    if not existing_article.sources.filter(id=src.id).exists():
                        existing_article.sources.add(src)
                        merged_count += 1
                except Exception as e:
                    print(f"Failed to merge duplicate article {existing_article.url}: {e}")

            print(f"Source {source.name}: Fetched {len(raw_articles)}, Saved {saved_count} new, Merged {merged_count} duplicates.")

            # 3. Update last_successful_sync for users who were due for this source
            for user in users_due:
                sync_record = UserSourceSync.objects.get(user=user, source=source)
                sync_record.last_successful_sync = now
                sync_record.save()
                
        except Exception as e:
            print(f"Source {source.name} failed to fetch: {e}")

    # 4. Also attempt to recategorize any existing articles that are uncategorized
    try:
        uncategorized = ArticleMetadata.objects.filter(category__isnull=True)
        if uncategorized.exists():
            print(f"Recategorizing {uncategorized.count()} uncategorized articles...")
            uncategorized_list = list(uncategorized[:200]) # Limit to 200 per run to avoid OOM
            batch_data = [{'title': a.title, 'summary': a.summary} for a in uncategorized_list]
            new_cats = categorize_articles_batch(batch_data)
            
            for a, cat in zip(uncategorized_list, new_cats):
                if cat:
                    a.category = cat
                    a.save(update_fields=['category'])
    except Exception as e:
        print(f"Failed to recategorize articles: {e}")


@shared_task
def cleanup_old_articles(days_to_keep=30):
    cutoff_date = timezone.now() - timedelta(days=days_to_keep)
    old_articles = ArticleMetadata.objects.filter(publication_date__lt=cutoff_date)
    count = old_articles.count()
    old_articles.delete()
    print(f"Cleanup Job: Deleted {count} articles older than {days_to_keep} days.")
