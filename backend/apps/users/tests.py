from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User


class UserRbacAndSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create an admin user
        self.admin_user = User.objects.create_user(
            username='admin_boss',
            name='Store Owner',
            email='admin@meghani.com',
            password='AdminPassword123!',
            role='admin',
            is_staff=True
        )
        
        # Create a regular staff user
        self.staff_user = User.objects.create_user(
            username='staff_clerk',
            name='Counter Cashier',
            email='clerk@meghani.com',
            password='StaffPassword123!',
            role='staff'
        )

        # Create a store manager user
        self.manager_user = User.objects.create_user(
            username='manager_alex',
            name='Floor Manager',
            email='manager@meghani.com',
            password='ManagerPassword123!',
            role='manager'
        )

    def test_unauthenticated_cannot_access_users(self):
        """Unauthenticated requests to user management must be blocked with 401"""
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_cannot_list_users(self):
        """Staff user cannot list user accounts (must receive 403 Forbidden)"""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_cannot_create_admin_user(self):
        """Staff user cannot perform privilege escalation by creating an admin account"""
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            'username': 'rogue_admin',
            'name': 'Rogue Admin',
            'email': 'rogue@meghani.com',
            'password': 'RoguePassword123!',
            'role': 'admin'
        }
        response = self.client.post('/api/users/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(username='rogue_admin').exists())

    def test_staff_cannot_delete_users(self):
        """Staff user cannot delete other users"""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(f'/api/users/{self.admin_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(User.objects.filter(id=self.admin_user.id).exists())

    def test_admin_can_manage_users(self):
        """Admin user can list and create users"""
        self.client.force_authenticate(user=self.admin_user)
        # List users
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Create a new staff user
        payload = {
            'username': 'new_watchmaker',
            'name': 'Master Watchmaker',
            'email': 'artisan@meghani.com',
            'password': 'ArtisanPassword123!',
            'role': 'staff'
        }
        create_res = self.client.post('/api/users/', payload)
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='new_watchmaker').exists())

    def test_staff_can_view_and_update_own_profile(self):
        """Staff user can access /users/me/ and update their own name/language"""
        self.client.force_authenticate(user=self.staff_user)
        
        # View profile
        me_res = self.client.get('/api/users/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['username'], 'staff_clerk')
        
        # Update profile
        update_res = self.client.patch('/api/users/update_profile/', {'name': 'Senior Cashier', 'language': 'gu'})
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.staff_user.refresh_from_db()
        self.assertEqual(self.staff_user.name, 'Senior Cashier')
        self.assertEqual(self.staff_user.language, 'gu')

    def test_password_change_api_contract(self):
        """Staff can change password via /api/users/change-password/ using current_password"""
        self.client.force_authenticate(user=self.staff_user)
        
        # Valid password change
        payload = {
            'current_password': 'StaffPassword123!',
            'new_password': 'NewSecurePassword456!'
        }
        res = self.client.post('/api/users/change-password/', payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['message'], 'Password changed successfully')
        
        # Verify new password is set
        self.staff_user.refresh_from_db()
        self.assertTrue(self.staff_user.check_password('NewSecurePassword456!'))
        
        # Wrong old password returns 400
        fail_payload = {
            'current_password': 'WrongPassword!',
            'new_password': 'AnotherNewPassword789!'
        }
        fail_res = self.client.post('/api/users/change-password/', fail_payload)
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_staff_cannot_change_own_role_via_profile(self):
        """Staff user cannot escalate role via profile update"""
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.patch('/api/users/update_profile/', {'role': 'admin'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.staff_user.refresh_from_db()
        self.assertEqual(self.staff_user.role, 'staff')

    def test_admin_cannot_change_own_role(self):
        """Admin user cannot demote or modify their own role"""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(f'/api/users/{self.admin_user.id}/', {'role': 'staff'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin_user.refresh_from_db()
        self.assertEqual(self.admin_user.role, 'admin')

    def test_admin_cannot_delete_own_account(self):
        """Admin user cannot delete their own account"""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.delete(f'/api/users/{self.admin_user.id}/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(id=self.admin_user.id).exists())

    def test_admin_can_update_other_user_role(self):
        """Admin user can promote another user's role"""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(f'/api/users/{self.staff_user.id}/', {'role': 'manager'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.staff_user.refresh_from_db()
        self.assertEqual(self.staff_user.role, 'manager')

    def test_manager_cannot_manage_users(self):
        """Manager user receives 403 Forbidden on UserViewSet administrative CRUD"""
        self.client.force_authenticate(user=self.manager_user)
        # Cannot list users
        list_res = self.client.get('/api/users/')
        self.assertEqual(list_res.status_code, status.HTTP_403_FORBIDDEN)

        # Cannot create users
        create_res = self.client.post('/api/users/', {
            'username': 'temp_user',
            'name': 'Temp User',
            'email': 'temp@meghani.com',
            'password': 'TempPassword123!',
            'role': 'staff'
        })
        self.assertEqual(create_res.status_code, status.HTTP_403_FORBIDDEN)

        # Cannot delete users
        del_res = self.client.delete(f'/api/users/{self.staff_user.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_access_self_profile_and_change_password(self):
        """Manager user has full access to self profile and password update"""
        self.client.force_authenticate(user=self.manager_user)
        me_res = self.client.get('/api/users/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['username'], 'manager_alex')

        pw_res = self.client.post('/api/users/change-password/', {
            'current_password': 'ManagerPassword123!',
            'new_password': 'NewManagerPassword789!'
        })
        self.assertEqual(pw_res.status_code, status.HTTP_200_OK)
