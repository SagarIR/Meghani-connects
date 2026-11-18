from rest_framework import permissions


class RoleBasedPermission(permissions.BasePermission):
    """
    Custom permission class for role-based access control.
    
    Roles:
    - admin: Full access to everything
    - manager: Can manage products, sales, repairs, customers, view reports
    - staff: Can create sales, repairs, view products (no edit/delete)
    - viewer: Read-only access
    """
    
    # Define role hierarchy
    ROLE_HIERARCHY = {
        'admin': 4,
        'manager': 3,
        'staff': 2,
        'viewer': 1,
    }
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusers always have access
        if request.user.is_superuser:
            return True
        
        user_role = getattr(request.user, 'role', 'viewer')
        
        # Read operations allowed for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Get required role for the view
        required_role = getattr(view, 'required_role', 'staff')
        
        return self._has_role_access(user_role, required_role)
    
    def _has_role_access(self, user_role: str, required_role: str) -> bool:
        """Check if user role meets the required role level."""
        user_level = self.ROLE_HIERARCHY.get(user_role, 0)
        required_level = self.ROLE_HIERARCHY.get(required_role, 0)
        return user_level >= required_level


class IsAdmin(permissions.BasePermission):
    """Only allow admin users."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'


class IsManagerOrAbove(permissions.BasePermission):
    """Allow managers and admins."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = getattr(request.user, 'role', '')
        return role in ['admin', 'manager']


class IsStaffOrAbove(permissions.BasePermission):
    """Allow staff, managers, and admins."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = getattr(request.user, 'role', '')
        return role in ['admin', 'manager', 'staff']


class CanManageProducts(permissions.BasePermission):
    """Permission to manage products (create, update, delete)."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Safe methods allowed for all
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_superuser:
            return True
            
        role = getattr(request.user, 'role', '')
        return role in ['admin', 'manager']


class CanManageSales(permissions.BasePermission):
    """Permission to manage sales."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_superuser:
            return True
            
        role = getattr(request.user, 'role', '')
        # Staff can create sales, managers can edit/delete
        if request.method == 'POST':
            return role in ['admin', 'manager', 'staff']
        return role in ['admin', 'manager']


class CanManageRepairs(permissions.BasePermission):
    """Permission to manage repairs."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_superuser:
            return True
            
        role = getattr(request.user, 'role', '')
        # Staff can create repairs and update status
        if request.method in ['POST', 'PATCH']:
            return role in ['admin', 'manager', 'staff']
        return role in ['admin', 'manager']


class CanViewReports(permissions.BasePermission):
    """Permission to view reports and analytics."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
            
        role = getattr(request.user, 'role', '')
        return role in ['admin', 'manager']


class CanManageUsers(permissions.BasePermission):
    """
    Permission to manage users (admin only for user management, self-access for profile/password).
    - Admins and superusers can perform full CRUD across all users.
    - Authenticated non-admin staff are strictly restricted to self actions:
      'me', 'update_profile', and 'change_password'.
    - Unauthorized access (such as staff listing/modifying other users) is denied.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin and superuser have unrestricted access
        if request.user.is_superuser or getattr(request.user, 'role', '') == 'admin':
            return True
        
        # Non-admins are strictly limited to self-service endpoints
        allowed_self_actions = ['me', 'update_profile', 'change_password']
        return getattr(view, 'action', None) in allowed_self_actions
    
    def has_object_permission(self, request, view, obj):
        # Admin and superuser can access any object
        if request.user.is_superuser or getattr(request.user, 'role', '') == 'admin':
            return True
        
        # Non-admins can only access their own user object on self-service actions
        if obj == request.user and getattr(view, 'action', None) in ['me', 'update_profile', 'change_password']:
            return True
            
        return False
