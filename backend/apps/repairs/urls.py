from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepairViewSet

router = DefaultRouter()
router.register('', RepairViewSet, basename='repairs')

urlpatterns = [
    path('', include(router.urls)),
]
