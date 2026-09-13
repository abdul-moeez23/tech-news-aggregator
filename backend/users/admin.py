from django.contrib import admin
from preferences.models import UserProfile   # UserProfile lives in preferences


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_email_verified', 'email_verified_at', 'resend_count', 'resend_last_requested_at')
    list_filter = ('is_email_verified',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('email_verified_at', 'resend_last_requested_at')
