from django.utils import timezone
from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    user_full_name = serializers.SerializerMethodField()

    user_profile_image = serializers.ImageField(
        source="user.profile_image",
        read_only=True,
    )

    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Review

        fields = [
            "id",
            "user",
            "username",
            "user_full_name",
            "user_profile_image",
            "event",
            "rating",
            "comment",
            "organizer_reply",
            "replied_at",
            "is_owner",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "event",
            "organizer_reply",
            "replied_at",
            "is_owner",
            "created_at",
            "updated_at",
        ]

    def get_user_full_name(self, obj):
        full_name = obj.user.get_full_name()

        return full_name or obj.user.username

    def get_is_owner(self, obj):
        request = self.context.get("request")

        return bool(
            request
            and request.user.is_authenticated
            and obj.user_id == request.user.id
        )

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )

        return value

    def validate_comment(self, value):
        value = value.strip()

        if len(value) < 5:
            raise serializers.ValidationError(
                "Review comment must contain at least 5 characters."
            )

        return value


class OrganizerReplySerializer(serializers.Serializer):
    reply = serializers.CharField(
        min_length=2,
        max_length=2000,
    )

    def update(self, instance, validated_data):
        instance.organizer_reply = validated_data["reply"].strip()
        instance.replied_at = timezone.now()

        instance.save(
            update_fields=[
                "organizer_reply",
                "replied_at",
                "updated_at",
            ]
        )

        return instance