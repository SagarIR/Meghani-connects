from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to admin users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsStaffOrAdmin(BasePermission):
    """Allow access to staff and admin users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'staff']


class IsOwnerOrAdmin(BasePermission):
    """Allow access to owner of object or admin"""
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        
        # Check for 'created_by' or 'user' field
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
