import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('tech_news_aggregator')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'fetch-all-active-sources-every-2-hours': {
        'task': 'feed.tasks.fetch_latest_news',
        'schedule': crontab(minute=0, hour='*/2'),
    },
    'cleanup-old-articles-nightly': {
        'task': 'feed.tasks.cleanup_old_articles',
        'schedule': crontab(minute=0, hour=3),
    },
}
