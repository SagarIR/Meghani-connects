from django.db import models
from django.conf import settings


class RoleRequiredMixin:
    """Mixin to specify required role for views."""
    
    required_role = 'staff'  # Default role required
    
    def get_permissions(self):
        """Add RoleBasedPermission to the view."""
        from .permissions import RoleBasedPermission
        permissions = super().get_permissions()
        permissions.append(RoleBasedPermission())
        return permissions


class AdminRequiredMixin(RoleRequiredMixin):
    """Mixin for admin-only views."""
    required_role = 'admin'


class ManagerRequiredMixin(RoleRequiredMixin):
    """Mixin for manager and above views."""
    required_role = 'manager'


class StaffRequiredMixin(RoleRequiredMixin):
    """Mixin for staff and above views."""
    required_role = 'staff'
