from rest_framework import serializers

from events.models import Event
from .models import EventRegistration

from .models import EventRegistration, SavedEvent

from registrations.models import EventRegistration
from .models import Event


class EventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(
        source="event.title",
        read_only=True,
    )

    event_start_datetime = serializers.DateTimeField(
        source="event.start_datetime",
        read_only=True,
    )

    event_end_datetime = serializers.DateTimeField(
        source="event.end_datetime",
        read_only=True,
    )

    event_city = serializers.CharField(
        source="event.city",
        read_only=True,
    )

    event_venue_name = serializers.CharField(
        source="event.venue_name",
        read_only=True,
    )

    event_mode = serializers.CharField(
        source="event.mode",
        read_only=True,
    )

    event_banner = serializers.ImageField(
        source="event.banner_image",
        read_only=True,
        allow_null=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration

        fields = [
            "id",
            "ticket_code",
            "user",
            "username",
            "user_full_name",
            "event",
            "event_title",
            "event_start_datetime",
            "event_end_datetime",
            "event_city",
            "event_venue_name",
            "event_mode",
            "event_banner",
            "status",
            "registered_at",
            "cancelled_at",
        ]

        read_only_fields = fields

    def get_user_full_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name or obj.user.username


class RegisterForEventSerializer(serializers.Serializer):
    event_id = serializers.IntegerField()

    def validate_event_id(self, value):
        try:
            event = Event.objects.get(id=value)
        except Event.DoesNotExist:
            raise serializers.ValidationError(
                "Event not found."
            )

        self.context["event"] = event
        return value

class SavedEventSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(
        source="event.title",
        read_only=True,
    )

    event_banner = serializers.ImageField(
        source="event.banner_image",
        read_only=True,
    )

    event_city = serializers.CharField(
        source="event.city",
        read_only=True,
    )

    event_start_datetime = serializers.DateTimeField(
        source="event.start_datetime",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="event.category.name",
        read_only=True,
    )

    class Meta:
        model = SavedEvent

        fields = [
            "id",
            "event",
            "event_title",
            "event_banner",
            "event_city",
            "event_start_datetime",
            "category_name",
            "saved_at",
        ]

        read_only_fields = [
            "id",
            "saved_at",
        ]

class OrganizerEventSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    registration_count = serializers.SerializerMethodField()

    available_slots = serializers.SerializerMethodField()

    class Meta:
        model = Event

        fields = [
            "id",
            "title",
            "short_description",
            "category",
            "category_name",
            "banner_image",
            "mode",
            "venue_name",
            "city",
            "state",
            "start_datetime",
            "end_datetime",
            "registration_deadline",
            "capacity",
            "price",
            "status",
            "rejection_reason",
            "is_featured",
            "registration_count",
            "available_slots",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "rejection_reason",
            "is_featured",
            "created_at",
            "updated_at",
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(
            status=EventRegistration.Status.REGISTERED
        ).count()

    def get_available_slots(self, obj):
        if obj.capacity is None:
            return None

        registration_count = obj.registrations.filter(
            status=EventRegistration.Status.REGISTERED
        ).count()

        return max(obj.capacity - registration_count, 0)


class EventParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration

        fields = [
            "id",
            "user",
            "username",
            "email",
            "full_name",
            "status",
            "registered_at",
            "cancelled_at",
        ]

    def get_full_name(self, obj):
        full_name = obj.user.get_full_name()

        if full_name:
            return full_name

        return obj.user.username