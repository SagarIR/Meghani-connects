from rest_framework.exceptions import APIException


class InsufficientStockError(APIException):
    status_code = 400
    default_detail = 'Insufficient stock available'
    default_code = 'insufficient_stock'


class InvalidOperationError(APIException):
    status_code = 400
    default_detail = 'Operation is not valid'
    default_code = 'invalid_operation'


class NotificationError(APIException):
    status_code = 500
    default_detail = 'Failed to send notification'
    default_code = 'notification_error'
