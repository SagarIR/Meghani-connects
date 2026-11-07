from django.contrib import admin
from .models import AnalyticsCache


@admin.register(AnalyticsCache)
class AnalyticsCacheAdmin(admin.ModelAdmin):
    list_display = ['metric_name', 'period', 'updated_on']
    readonly_fields = ['metric_name', 'metric_value', 'period', 'updated_on']
