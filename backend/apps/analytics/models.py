from django.db import models


class AnalyticsCache(models.Model):
    """Cache for computed analytics metrics"""
    metric_name = models.CharField(max_length=50, unique=True)
    metric_value = models.JSONField()
    period = models.CharField(max_length=20, blank=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analytics_cache'
        verbose_name = 'Analytics Cache'
        verbose_name_plural = 'Analytics Cache'

    def __str__(self):
        return f"{self.metric_name} ({self.updated_on})"
