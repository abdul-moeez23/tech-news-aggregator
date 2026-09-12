# Generated manually for Phase 11 — adds embedding storage to Category model.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('preferences', '0005_userprofile_is_email_verified'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='embedding',
            field=models.JSONField(blank=True, default=None, null=True),
        ),
    ]
