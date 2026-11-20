from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet, CashRegisterViewSet

router = DefaultRouter()
router.register('registers', CashRegisterViewSet, basename='cash-registers')
router.register('', ExpenseViewSet, basename='expenses')

urlpatterns = [
    path('', include(router.urls)),
]
