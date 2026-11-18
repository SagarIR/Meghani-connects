import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('meghani_connect')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    'birthday-wishes': {
        'task': 'apps.analytics.tasks.check_and_send_birthday_wishes',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
    'warranty-reminders': {
        'task': 'apps.analytics.tasks.check_warranty_expiry_notifications',
        'schedule': crontab(hour=10, minute=0),  # Daily at 10 AM
    },
    'daily-forecast': {
        'task': 'apps.analytics.tasks.generate_daily_forecast',
        'schedule': crontab(hour=0, minute=30),  # Daily at 12:30 AM
    },
    'daily-executive-summary': {
        'task': 'apps.analytics.tasks.dispatch_daily_executive_summary',
        'schedule': crontab(hour=21, minute=0),  # Daily at 9:00 PM
    },
    'reorder-stockout-check': {
        'task': 'apps.analytics.tasks.run_reorder_and_stockout_check_task',
        'schedule': crontab(hour=6, minute=0),  # Daily at 6:00 AM
    },
    'anomaly-detection-scan': {
        'task': 'apps.analytics.tasks.scan_and_alert_anomalies_task',
        'schedule': crontab(minute=0, hour='*/4'),  # Every 4 hours
    },
    'abc-classification-refresh': {
        'task': 'apps.analytics.tasks.refresh_abc_classification_task',
        'schedule': crontab(hour=1, minute=0, day_of_week=1),  # Weekly on Monday at 1 AM
    },
}
