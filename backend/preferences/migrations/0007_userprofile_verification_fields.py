from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('preferences', '0006_category_embedding'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='email_verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='verification_token',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='resend_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='resend_last_requested_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
