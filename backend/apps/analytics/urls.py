from django.urls import path
from .views import (
    DashboardStatsView, SalesChartView, TopProductsView,
    RecentActivityView, AlertsView, SalesReportView, ProfitReportView,
    ProductPerformanceView, RepairIncomeView, ExpenseReportView,
    CustomerLoyaltyView, InventoryReportView, ReportExportView,
    # AI Views
    SalesForecastView, StockPredictionView, StockoutPredictionView,
    SmartAlertsView, ProfitPredictionView, AIInsightsView
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
    
    # Export
    path('reports/<str:report_type>/export/<str:format_type>/', ReportExportView.as_view(), name='report-export'),
    
    # AI / ML Endpoints
    path('ai/forecast/', SalesForecastView.as_view(), name='sales-forecast'),
    path('ai/stock-prediction/', StockPredictionView.as_view(), name='stock-prediction'),
    path('ai/stock-prediction/<int:product_id>/', StockoutPredictionView.as_view(), name='stockout-prediction'),
    path('ai/alerts/', SmartAlertsView.as_view(), name='smart-alerts'),
    path('ai/profit/', ProfitPredictionView.as_view(), name='profit-prediction'),
    path('ai/insights/', AIInsightsView.as_view(), name='ai-insights'),
]
