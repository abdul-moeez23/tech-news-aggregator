from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Source(models.Model):
    name = models.CharField(max_length=100)
    url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='custom_sources')
    
    def __str__(self):
        return self.name

class UserProfile(models.Model):
    FETCH_FREQUENCIES = (
        (15, '15 Minutes'),
        (30, '30 Minutes'),
        (60, '1 Hour'),
        (360, '6 Hours'),
        (720, '12 Hours'),
        (1440, '24 Hours'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    freshness_days = models.IntegerField(default=3, help_text="Number of days to look back for articles")
    categories = models.ManyToManyField(Category, blank=True)
    sources = models.ManyToManyField(Source, blank=True)
    
    # Phase 5 Additions
    auto_fetch = models.BooleanField(default=True, help_text="Automatically fetch news in the background")
    fetch_frequency = models.IntegerField(choices=FETCH_FREQUENCIES, default=60, help_text="Fetch frequency in minutes")
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class UserSourceSync(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='source_syncs')
    source = models.ForeignKey(Source, on_delete=models.CASCADE)
    last_successful_sync = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'source')

    def __str__(self):
        return f"{self.user.username} - {self.source.name} Sync"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        profile = UserProfile.objects.create(user=instance)
        
        # Add default categories and sources so new users have a populated feed
        default_categories = Category.objects.all()
        if default_categories.exists():
            profile.categories.set(default_categories)
            
        default_sources = Source.objects.filter(is_active=True, user__isnull=True)
        if default_sources.exists():
            profile.sources.set(default_sources)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
