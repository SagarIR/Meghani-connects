from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, EnquiryViewSet

router = DefaultRouter()
router.register('enquiries', EnquiryViewSet, basename='enquiries')
router.register('', CustomerViewSet, basename='customers')

urlpatterns = [
    path('', include(router.urls)),
]
