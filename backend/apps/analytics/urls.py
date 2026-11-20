from django.urls import path
from .views import (
    DashboardStatsView, SalesChartView, TopProductsView,
    RecentActivityView, AlertsView, SalesReportView, ProfitReportView,
    ProductPerformanceView, RepairIncomeView, ExpenseReportView,
    CustomerLoyaltyView, InventoryReportView, ReportExportView,
    FinancialStatementReportView, GSTReportView,
    # AI Views
    SalesForecastView, StockPredictionView, StockoutPredictionView,
    SmartAlertsView, ProfitPredictionView, AIInsightsView,
    # Advanced Intelligence Views (Order 6)
    AdvancedSalesForecastView, SmartReorderView, ABCClassificationView,
    AnomalyRadarView, AIAssistantView, CRMIntelligenceView, OperationalAuditTimelineView
)

urlpatterns = [
    # Dashboard
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/sales-chart/', SalesChartView.as_view(), name='sales-chart'),
    path('dashboard/top-products/', TopProductsView.as_view(), name='top-products'),
    path('dashboard/recent-activity/', RecentActivityView.as_view(), name='recent-activity'),
    path('alerts/', AlertsView.as_view(), name='alerts'),
    
    # Reports
    path('reports/sales/', SalesReportView.as_view(), name='sales-report'),
    path('reports/profit/', ProfitReportView.as_view(), name='profit-report'),
    path('reports/products/', ProductPerformanceView.as_view(), name='product-report'),
    path('reports/repairs/', RepairIncomeView.as_view(), name='repair-report'),
    path('reports/expenses/', ExpenseReportView.as_view(), name='expense-report'),
    path('reports/customers/', CustomerLoyaltyView.as_view(), name='customer-report'),
    path('reports/inventory/', InventoryReportView.as_view(), name='inventory-report'),
    path('reports/financial-statement/', FinancialStatementReportView.as_view(), name='financial-statement-report'),
    path('reports/gst/', GSTReportView.as_view(), name='gst-report'),
    
    # Export
    path('reports/<str:report_type>/export/<str:format_type>/', ReportExportView.as_view(), name='report-export'),
    
    # Standard AI / ML Endpoints
    path('ai/forecast/', AdvancedSalesForecastView.as_view(), name='sales-forecast'),
    path('ai/forecast/advanced/', AdvancedSalesForecastView.as_view(), name='advanced-sales-forecast'),
    path('ai/stock-prediction/', StockPredictionView.as_view(), name='stock-prediction'),
    path('ai/stock-prediction/<int:product_id>/', StockoutPredictionView.as_view(), name='stockout-prediction'),
    path('ai/alerts/', SmartAlertsView.as_view(), name='smart-alerts'),
    path('ai/profit/', ProfitPredictionView.as_view(), name='profit-prediction'),
    path('ai/insights/', AIInsightsView.as_view(), name='ai-insights'),

    # Advanced Intelligence Suite (Master Order 6)
    path('ai/reorder/', SmartReorderView.as_view(), name='smart-reorder'),
    path('ai/reorder/action/', SmartReorderView.as_view(), name='smart-reorder-action'),
    path('ai/abc-classification/', ABCClassificationView.as_view(), name='abc-classification'),
    path('ai/abc-classification/refresh/', ABCClassificationView.as_view(), name='abc-classification-refresh'),
    path('ai/anomalies/', AnomalyRadarView.as_view(), name='anomaly-radar'),
    path('ai/anomalies/action/', AnomalyRadarView.as_view(), name='anomaly-radar-action'),
    path('ai/assistant/', AIAssistantView.as_view(), name='ai-assistant'),
    path('ai/crm-intelligence/', CRMIntelligenceView.as_view(), name='crm-intelligence'),
    path('audit-timeline/', OperationalAuditTimelineView.as_view(), name='audit-timeline'),
]
