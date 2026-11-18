from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, EnquiryViewSet, CustomerImportView, CustomerExportTemplateView

router = DefaultRouter()
router.register('enquiries', EnquiryViewSet, basename='enquiries')
router.register('', CustomerViewSet, basename='customers')

urlpatterns = [
    path('import/', CustomerImportView.as_view(), name='customer-import'),
    path('import/template/', CustomerExportTemplateView.as_view(), name='customer-import-template'),
    path('', include(router.urls)),
]
