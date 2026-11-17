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


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False)
    current_password = serializers.CharField(required=False)
    new_password = serializers.CharField(required=True, min_length=6)

    def validate(self, data):
        if not data.get('old_password') and not data.get('current_password'):
            raise serializers.ValidationError({'current_password': 'Current password is required.'})
        return data
