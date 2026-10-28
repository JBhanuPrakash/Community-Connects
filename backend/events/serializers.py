from rest_framework import serializers

from registrations.models import EventRegistration, SavedEvent

from .models import Category, Event
from django.db.models import Avg
from decimal import Decimal


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "icon",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class EventSerializer(serializers.ModelSerializer):

    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()  

    organizer_name = serializers.CharField(
        source="organizer.username",
        read_only=True,
    )

    organizer_full_name = serializers.SerializerMethodField()

    organizer_profile_image = serializers.ImageField(
        source="organizer.profile_image",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    registration_count = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Event

        fields = [
            "id",
            "organizer",
            "organizer_name",
            "organizer_full_name",
            "organizer_profile_image",
            "category",
            "category_name",
            "title",
            "short_description",
            "description",
            "banner_image",
            "mode",
            "venue_name",
            "address",
            "city",
            "state",
            "latitude",
            "longitude",
            "online_event_url",
            "start_datetime",
            "end_datetime",
            "registration_deadline",
            "capacity",
            "price",
            "average_rating",
            "review_count",
            "status",
            "rejection_reason",
            "is_featured",
            "registration_count",
            "available_slots",
            "is_full",
            "is_registered",
            "is_saved",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "organizer",
            "status",
            "rejection_reason",
            "is_featured",
            "registration_count",
            "available_slots",
            "average_rating",
            "review_count",
            "is_full",
            "is_registered",
            "is_saved",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        start_datetime = data.get(
            "start_datetime",
            getattr(self.instance, "start_datetime", None),
        )

        end_datetime = data.get(
            "end_datetime",
            getattr(self.instance, "end_datetime", None),
        )

        registration_deadline = data.get(
            "registration_deadline",
            getattr(self.instance, "registration_deadline", None),
        )

        mode = data.get(
            "mode",
            getattr(
                self.instance,
                "mode",
                Event.Mode.OFFLINE,
            ),
        )

        if (
            start_datetime
            and end_datetime
            and end_datetime <= start_datetime
        ):
            raise serializers.ValidationError(
                {
                    "end_datetime":
                        "Event end time must be after the start time."
                }
            )

        if (
            registration_deadline
            and start_datetime
            and registration_deadline > start_datetime
        ):
            raise serializers.ValidationError(
                {
                    "registration_deadline":
                        "Registration deadline must be before the event starts."
                }
            )

        online_event_url = data.get(
            "online_event_url",
            getattr(
                self.instance,
                "online_event_url",
                "",
            ),
        )

        if (
            mode == Event.Mode.ONLINE
            and not online_event_url
        ):
            raise serializers.ValidationError(
                {
                    "online_event_url":
                        "Online event URL is required for online events."
                }
            )

        venue_name = data.get(
            "venue_name",
            getattr(
                self.instance,
                "venue_name",
                "",
            ),
        )

        city = data.get(
            "city",
            getattr(
                self.instance,
                "city",
                "",
            ),
        )

        if mode in {
            Event.Mode.OFFLINE,
            Event.Mode.HYBRID,
        }:
            if not venue_name:
                raise serializers.ValidationError(
                    {
                        "venue_name":
                            "Venue name is required for offline and hybrid events."
                    }
                )

            if not city:
                raise serializers.ValidationError(
                    {
                        "city":
                            "City is required for offline and hybrid events."
                    }
                )

        return data

    def validate_price(self, value):
        if value is not None and value > Decimal("0"):
            raise serializers.ValidationError(
                "Paid events are not supported yet. "
                "Set the price to 0."
            )

        return value

    def get_organizer_full_name(self, obj):
        full_name = obj.organizer.get_full_name()

        return full_name or obj.organizer.username

    def get_registration_count(self, obj):
        annotated_count = getattr(
            obj,
            "active_registration_count",
            None,
        )

        if annotated_count is not None:
            return annotated_count

        return obj.registrations.filter(
            status=EventRegistration.Status.REGISTERED,
        ).count()

    def get_available_slots(self, obj):
        if obj.capacity is None:
            return None

        registration_count = self.get_registration_count(obj)

        return max(
            obj.capacity - registration_count,
            0,
        )

    def get_is_full(self, obj):
        if obj.capacity is None:
            return False

        return self.get_available_slots(obj) == 0

    def get_is_registered(self, obj):
        request = self.context.get("request")

        if (
            not request
            or not request.user.is_authenticated
        ):
            return False

        return EventRegistration.objects.filter(
            user=request.user,
            event=obj,
            status=EventRegistration.Status.REGISTERED,
        ).exists()

    def get_is_saved(self, obj):
        request = self.context.get("request")

        if (
            not request
            or not request.user.is_authenticated
        ):
            return False

        return SavedEvent.objects.filter(
            user=request.user,
            event=obj,
        ).exists()

    def get_average_rating(self, obj):
        average = obj.reviews.aggregate(
            average=Avg("rating")
        )["average"]

        return round(average or 0, 1)


    def get_review_count(self, obj):
        return obj.reviews.count()


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
            "description",
            "category",
            "category_name",
            "banner_image",
            "mode",
            "venue_name",
            "address",
            "city",
            "state",
            "latitude",
            "longitude",
            "online_event_url",
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
            "registration_count",
            "available_slots",
            "created_at",
            "updated_at",
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(
            status=EventRegistration.Status.REGISTERED,
        ).count()

    def get_available_slots(self, obj):
        if obj.capacity is None:
            return None

        registration_count = self.get_registration_count(obj)

        return max(
            obj.capacity - registration_count,
            0,
        )


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

    profile_image = serializers.ImageField(
        source="user.profile_image",
        read_only=True,
    )

    class Meta:
        model = EventRegistration

        fields = [
            "id",
            "user",
            "username",
            "email",
            "full_name",
            "profile_image",
            "status",
            "registered_at",
            "cancelled_at",
        ]

        read_only_fields = fields

    def get_full_name(self, obj):
        full_name = obj.user.get_full_name()

        return full_name or obj.user.username


class AdminEventSerializer(serializers.ModelSerializer):
    organizer_username = serializers.CharField(
        source="organizer.username",
        read_only=True,
    )

    organizer_email = serializers.EmailField(
        source="organizer.email",
        read_only=True,
    )

    organizer_full_name = serializers.SerializerMethodField()

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    registration_count = serializers.SerializerMethodField()

    class Meta:
        model = Event

        fields = [
            "id",
            "organizer",
            "organizer_username",
            "organizer_email",
            "organizer_full_name",
            "category",
            "category_name",
            "title",
            "short_description",
            "description",
            "banner_image",
            "mode",
            "venue_name",
            "address",
            "city",
            "state",
            "latitude",
            "longitude",
            "online_event_url",
            "start_datetime",
            "end_datetime",
            "registration_deadline",
            "capacity",
            "price",
            "status",
            "rejection_reason",
            "is_featured",
            "registration_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_organizer_full_name(self, obj):
        full_name = obj.organizer.get_full_name()

        return full_name or obj.organizer.username

    def get_registration_count(self, obj):
        return obj.registrations.filter(
            status=EventRegistration.Status.REGISTERED,
        ).count()