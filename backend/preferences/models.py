from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subcategories')
    # Phase 11: stores the sentence-transformer embedding vector as a float list.
    # null=True so existing rows are valid before the first worker startup populates them.
    embedding = models.JSONField(null=True, blank=True, default=None)

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
    muted_topics = models.ManyToManyField(Category, blank=True, related_name='muted_by_profiles')
    sources = models.ManyToManyField(Source, blank=True)

    # Phase 5 Additions
    auto_fetch = models.BooleanField(default=True, help_text="Automatically fetch news in the background")
    fetch_frequency = models.IntegerField(choices=FETCH_FREQUENCIES, default=60, help_text="Fetch frequency in minutes")

    # Email verification
    is_email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)

    # Active verification token — stored so old tokens can be invalidated
    verification_token = models.TextField(blank=True, default='')

    # Rate limiting for resend requests
    resend_count = models.PositiveIntegerField(default=0)
    resend_last_requested_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    # ------------------------------------------------------------------
    # Rate-limit helpers (max 5 resends/hour, 60 s cooldown between each)
    # ------------------------------------------------------------------
    RESEND_COOLDOWN_SECONDS = 60
    RESEND_MAX_PER_HOUR = 5

    def seconds_until_cooldown_ends(self) -> int:
        from django.utils import timezone
        if self.resend_last_requested_at is None:
            return 0
        elapsed = (timezone.now() - self.resend_last_requested_at).total_seconds()
        remaining = self.RESEND_COOLDOWN_SECONDS - elapsed
        return max(0, int(remaining))

    def can_resend_email(self) -> tuple:
        from django.utils import timezone
        if self.resend_last_requested_at is None:
            return True, ''
        now = timezone.now()
        elapsed_seconds = (now - self.resend_last_requested_at).total_seconds()

        # Layer 1: cooldown
        wait = self.RESEND_COOLDOWN_SECONDS - elapsed_seconds
        if wait > 0:
            secs = int(wait)
            return False, f"Please wait {secs} second{'s' if secs != 1 else ''} before requesting another email."

        # Layer 2: hourly cap
        if elapsed_seconds <= 3600 and self.resend_count >= self.RESEND_MAX_PER_HOUR:
            return False, "You have requested too many verification emails. Please wait before trying again."

        return True, ''

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

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        # Happens when a user was created directly in the DB without going through
        # the API (e.g. via Django admin or psql). Create the missing profile now.
        UserProfile.objects.create(user=instance)
