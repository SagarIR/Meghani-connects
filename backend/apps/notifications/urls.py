from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, MessageTemplateViewSet, TwilioConfigView, TestNotificationView

router = DefaultRouter()
router.register('templates', MessageTemplateViewSet, basename='templates')
router.register('', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('twilio/verify/', TwilioConfigView.as_view(), name='twilio-verify'),
    path('test/', TestNotificationView.as_view(), name='test-notification'),
    path('', include(router.urls)),
]
