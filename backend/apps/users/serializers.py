from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'phone', 'role', 'language', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'phone', 'role', 'language', 'password']

    def create(self, validated_data):
        if validated_data.get('role') == 'admin':
            validated_data['is_staff'] = True
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'email', 'phone', 'language']

    def validate(self, attrs):
        # Strict protection against role tampering in profile updates
        if 'role' in self.initial_data:
            raise serializers.ValidationError({'role': 'Role modification is not permitted via profile update.'})
        return attrs


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer for administrative user management"""
    class Meta:
        model = User
        fields = ['name', 'email', 'phone', 'role', 'language', 'is_active']

    def validate(self, attrs):
        request = self.context.get('request')
        # Prevent self role-demotion or self-escalation
        if self.instance and request and request.user == self.instance:
            if 'role' in attrs and attrs['role'] != self.instance.role:
                raise serializers.ValidationError({'role': 'You cannot change your own role.'})
            if 'is_active' in attrs and not attrs['is_active']:
                raise serializers.ValidationError({'is_active': 'You cannot deactivate your own account.'})
        return attrs

    def update(self, instance, validated_data):
        if 'role' in validated_data:
            validated_data['is_staff'] = (validated_data['role'] == 'admin')
        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False)
    current_password = serializers.CharField(required=False)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate(self, data):
        if not data.get('old_password') and not data.get('current_password'):
            raise serializers.ValidationError({'current_password': 'Current password is required.'})
        return data
