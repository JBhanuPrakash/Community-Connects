from django.db.models import Q
from django.db import models, transaction

from .models import Category, Event
from .permissions import IsEventOwnerOrAdmin, IsOrganizer
from .serializers import CategorySerializer, EventSerializer
from django.db.models import Count, Q
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdminRole
from .serializers import AdminEventSerializer
from datetime import datetime, time

from django.utils.dateparse import parse_date

from rest_framework import generics, permissions

from .models import Category, Event
from .pagination import EventPagination
from .permissions import IsEventOwnerOrAdmin, IsOrganizer
from .serializers import CategorySerializer, EventSerializer

from notifications.models import Notification
from notifications.utils import create_notification
from math import asin, cos, radians, sin, sqrt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.contrib.auth import get_user_model
from django.db.models.functions import TruncMonth
from reviews.models import Review

from django.db.models import Avg, Count

from registrations.models import EventRegistration
from reviews.models import Review

from registrations.models import EventRegistration
from .permissions import IsOrganizer
from .serializers import (
    EventParticipantSerializer,
    OrganizerEventSerializer,
)  

from .emails import (
    send_event_approved_email,
    send_event_cancelled_email,
    send_event_rejected_email,
)

def calculate_distance_km(
    latitude_1,
    longitude_1,
    latitude_2,
    longitude_2,
):
    earth_radius_km = 6371

    latitude_difference = radians(
        latitude_2 - latitude_1
    )

    longitude_difference = radians(
        longitude_2 - longitude_1
    )

    first_latitude = radians(latitude_1)
    second_latitude = radians(latitude_2)

    haversine_value = (
        sin(latitude_difference / 2) ** 2
        + cos(first_latitude)
        * cos(second_latitude)
        * sin(longitude_difference / 2) ** 2
    )

    angular_distance = 2 * asin(
        sqrt(haversine_value)
    )

    return earth_radius_km * angular_distance


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Category.objects.filter(is_active=True)


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    pagination_class = EventPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsOrganizer()]

        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Event.objects.select_related(
            "organizer",
            "category",
        ).annotate(
            active_registration_count=Count(
                "registrations",
                filter=Q(
                    registrations__status="REGISTERED"
                ),
            )
        )

        user = self.request.user

        if not user.is_authenticated:
            queryset = queryset.filter(
                status=Event.Status.APPROVED
            )

        elif user.is_staff or user.is_superuser:
            pass

        elif user.role == "ORGANIZER":
            queryset = queryset.filter(
                Q(status=Event.Status.APPROVED)
                | Q(organizer=user)
            )

        else:
            queryset = queryset.filter(
                status=Event.Status.APPROVED
            )

        search = self.request.query_params.get(
            "search",
            "",
        ).strip()

        category = self.request.query_params.get(
            "category",
            "",
        ).strip()

        city = self.request.query_params.get(
            "city",
            "",
        ).strip()

        mode = self.request.query_params.get(
            "mode",
            "",
        ).strip().upper()

        price_type = self.request.query_params.get(
            "price_type",
            "",
        ).strip().lower()

        date_from = self.request.query_params.get(
            "date_from",
            "",
        ).strip()

        date_to = self.request.query_params.get(
            "date_to",
            "",
        ).strip()

        featured = self.request.query_params.get(
            "featured",
            "",
        ).strip().lower()

        ordering = self.request.query_params.get(
            "ordering",
            "upcoming",
        ).strip().lower()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(short_description__icontains=search)
                | Q(description__icontains=search)
                | Q(venue_name__icontains=search)
                | Q(city__icontains=search)
                | Q(state__icontains=search)
                | Q(category__name__icontains=search)
                | Q(organizer__username__icontains=search)
            )

        if category:
            if category.isdigit():
                queryset = queryset.filter(
                    category_id=category
                )
            else:
                queryset = queryset.filter(
                    category__name__iexact=category
                )

        if city:
            queryset = queryset.filter(
                city__icontains=city
            )

        if mode in {
            Event.Mode.ONLINE,
            Event.Mode.OFFLINE,
            Event.Mode.HYBRID,
        }:
            queryset = queryset.filter(mode=mode)

        if price_type == "free":
            queryset = queryset.filter(price=0)

        elif price_type == "paid":
            queryset = queryset.filter(price__gt=0)

        parsed_date_from = parse_date(date_from)

        if parsed_date_from:
            start_of_day = timezone.make_aware(
                datetime.combine(
                    parsed_date_from,
                    time.min,
                )
            )

            queryset = queryset.filter(
                start_datetime__gte=start_of_day
            )

        parsed_date_to = parse_date(date_to)

        if parsed_date_to:
            end_of_day = timezone.make_aware(
                datetime.combine(
                    parsed_date_to,
                    time.max,
                )
            )

            queryset = queryset.filter(
                start_datetime__lte=end_of_day
            )

        if featured in {"true", "1", "yes"}:
            queryset = queryset.filter(
                is_featured=True
            )

        ordering_options = {
            "upcoming": (
                "start_datetime",
                "id",
            ),
            "newest": (
                "-created_at",
                "-id",
            ),
            "oldest": (
                "created_at",
                "id",
            ),
            "price_low": (
                "price",
                "start_datetime",
                "id",
            ),
            "price_high": (
                "-price",
                "start_datetime",
                "id",
            ),
            "popular": (
                "-active_registration_count",
                "start_datetime",
                "id",
            ),
        }

        selected_ordering = ordering_options.get(
            ordering,
            ordering_options["upcoming"],
        )

        return queryset.order_by(*selected_ordering)

    def perform_create(self, serializer):
        serializer.save(
            organizer=self.request.user,
            status=Event.Status.PENDING,
        )

class EventDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = EventSerializer

    def get_queryset(self):
        queryset = Event.objects.select_related(
            "organizer",
            "category",
        )

        user = self.request.user

        if user.is_authenticated and (
            user.is_staff or user.is_superuser
        ):
            return queryset

        if user.is_authenticated and user.role == "ORGANIZER":
            return queryset.filter(
                Q(status=Event.Status.APPROVED)
                | Q(organizer=user)
            )

        return queryset.filter(status=Event.Status.APPROVED)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]

        return [
            permissions.IsAuthenticated(),
            IsEventOwnerOrAdmin(),
        ]

class OrganizerEventListView(generics.ListAPIView):
    serializer_class = OrganizerEventSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizer,
    ]

    def get_queryset(self):
        queryset = Event.objects.filter(
            organizer=self.request.user
        ).select_related(
            "category",
            "organizer",
        ).order_by("-created_at")

        event_status = self.request.query_params.get("status")

        if event_status:
            queryset = queryset.filter(
                status=event_status.upper()
            )

        return queryset


class OrganizerEventDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizerEventSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizer,
    ]

    def get_queryset(self):
        return Event.objects.filter(
            organizer=self.request.user
        ).select_related(
            "category",
            "organizer",
        )

    def perform_update(self, serializer):
        event = self.get_object()

        if event.status == Event.Status.APPROVED:
            serializer.save(
                status=Event.Status.PENDING
            )
        else:
            serializer.save()


class OrganizerEventParticipantsView(generics.ListAPIView):
    serializer_class = EventParticipantSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizer,
    ]

    def get_queryset(self):
        event_id = self.kwargs["event_id"]

        try:
            event = Event.objects.get(
                id=event_id,
                organizer=self.request.user,
            )
        except Event.DoesNotExist:
            return EventRegistration.objects.none()

        queryset = EventRegistration.objects.filter(
            event=event
        ).select_related(
            "user",
            "event",
        )

        registration_status = self.request.query_params.get(
            "status"
        )

        if registration_status:
            queryset = queryset.filter(
                status=registration_status.upper()
            )

        return queryset.order_by("-registered_at")

class OrganizerAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != "ORGANIZER":
            return Response(
                {
                    "detail":
                        "Only organizers can view organizer analytics."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        organizer_events = Event.objects.filter(
            organizer=user
        )

        total_events = organizer_events.count()

        approved_events = organizer_events.filter(
            status=Event.Status.APPROVED
        ).count()

        pending_events = organizer_events.filter(
            status=Event.Status.PENDING
        ).count()

        rejected_events = organizer_events.filter(
            status=Event.Status.REJECTED
        ).count()

        cancelled_events = organizer_events.filter(
            status=Event.Status.CANCELLED
        ).count()

        registrations = EventRegistration.objects.filter(
            event__organizer=user
        )

        total_registrations = registrations.count()

        active_registrations = registrations.filter(
            status=EventRegistration.Status.REGISTERED
        ).count()

        attended_registrations = registrations.filter(
            status=EventRegistration.Status.ATTENDED
        ).count()

        cancelled_registrations = registrations.filter(
            status=EventRegistration.Status.CANCELLED
        ).count()

        reviews = Review.objects.filter(
            event__organizer=user
        )

        total_reviews = reviews.count()

        average_rating = reviews.aggregate(
            average=Avg("rating")
        )["average"]

        rating_filter = models.Q(
            event__organizer=user
        )

        review_rating_counts = (
            Review.objects.filter(
                rating_filter
            )
            .values("rating")
            .annotate(count=Count("id"))
        )

        rating_buckets = {
            str(rating): 0
            for rating in range(1, 6)
        }

        for entry in review_rating_counts:
            rating_buckets[
                str(entry["rating"])
            ] = entry["count"]

        monthly_counts = (
            registrations
            .annotate(
                month=TruncMonth(
                    "registered_at"
                )
            )
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        registration_trend = [
            {
                "month": entry[
                    "month"
                ].strftime("%Y-%m"),
                "label": entry[
                    "month"
                ].strftime("%b"),
                "count": entry["count"],
            }
            for entry in monthly_counts
        ]

        event_registration_data = (
            organizer_events
            .annotate(
                registration_count=Count(
                    "registrations",
                    filter=models.Q(
                        registrations__status=(
                            EventRegistration.Status.REGISTERED
                        )
                    ),
                ),
                attended_count=Count(
                    "registrations",
                    filter=models.Q(
                        registrations__status=(
                            EventRegistration.Status.ATTENDED
                        )
                    ),
                ),
            )
            .values(
                "id",
                "title",
                "registration_count",
                "attended_count",
                "capacity",
                "status",
            )
            .order_by("-created_at")
        )

        formatted_event_registrations = []

        for item in event_registration_data:
            capacity = item.get("capacity")

            utilization = (
                round(
                    item["registration_count"]
                    / capacity
                    * 100,
                    1,
                )
                if capacity
                else None
            )

            formatted_event_registrations.append(
                {
                    **item,
                    "utilization": utilization,
                }
            )

        return Response(
            {
                "events": {
                    "total": total_events,
                    "approved": approved_events,
                    "pending": pending_events,
                    "rejected": rejected_events,
                    "cancelled": cancelled_events,
                },

                "registrations": {
                    "total": total_registrations,
                    "active": active_registrations,
                    "attended": attended_registrations,
                    "cancelled": cancelled_registrations,
                },

                "reviews": {
                    "total": total_reviews,
                    "average_rating": round(
                        average_rating or 0,
                        1,
                    ),
                    "rating_counts": rating_buckets,
                },

                "attendance_rate": round(
                    (
                        attended_registrations
                        / total_registrations
                        * 100
                    )
                    if total_registrations > 0
                    else 0,
                    1,
                ),

                "registration_trend": (
                    registration_trend
                ),

                "event_registrations": (
                    formatted_event_registrations
                ),
            },
            status=status.HTTP_200_OK,
        )


class CancelOrganizerEventView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizer,
    ]

    def post(self, request, event_id):
        try:
            event = Event.objects.get(
                id=event_id,
                organizer=request.user,
            )
        except Event.DoesNotExist:
            return Response(
                {
                    "detail": "Event not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if event.status == Event.Status.CANCELLED:
            return Response(
                {
                    "detail": "This event is already cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.end_datetime <= timezone.now():
            return Response(
                {
                    "detail":
                        "A completed event cannot be cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        registered_users = [
            registration.user
            for registration in event.registrations.filter(
                status=EventRegistration.Status.REGISTERED
            ).select_related("user")
        ]

        with transaction.atomic():
            event.status = Event.Status.CANCELLED
            event.registrations.filter(
                status=EventRegistration.Status.REGISTERED
            ).update(
                status=EventRegistration.Status.CANCELLED,
                cancelled_at=timezone.now(),
            )
            event.save(
                update_fields=["status", "updated_at"]
            )

        for registered_user in registered_users:
            create_notification(
                recipient=registered_user,
                notification_type=(
                    Notification.Type.EVENT_CANCELLED
                ),
                title="Event cancelled",
                message=(
                    f"The event '{event.title}' "
                    f"has been cancelled by the organizer."
                ),
                target_url=f"/events/{event.id}",
            )

            send_event_cancelled_email(
                event,
                registered_user,
            )

        return Response(
            {
                "message": "Event cancelled successfully.",
                "event": OrganizerEventSerializer(event).data,
            },
            status=status.HTTP_200_OK,
        )


class OrganizerDashboardStatsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        IsOrganizer,
    ]

    def get(self, request):
        events = Event.objects.filter(
            organizer=request.user
        )

        event_ids = events.values_list(
            "id",
            flat=True,
        )

        total_registrations = EventRegistration.objects.filter(
            event_id__in=event_ids,
            status=EventRegistration.Status.REGISTERED,
        ).count()

        upcoming_events = events.filter(
            start_datetime__gt=timezone.now(),
        ).exclude(
            status__in=[
                Event.Status.CANCELLED,
                Event.Status.REJECTED,
            ]
        ).count()

        data = {
            "total_events": events.count(),

            "draft_events": events.filter(
                status=Event.Status.DRAFT
            ).count(),

            "pending_events": events.filter(
                status=Event.Status.PENDING
            ).count(),

            "approved_events": events.filter(
                status=Event.Status.APPROVED
            ).count(),

            "rejected_events": events.filter(
                status=Event.Status.REJECTED
            ).count(),

            "cancelled_events": events.filter(
                status=Event.Status.CANCELLED
            ).count(),

            "upcoming_events": upcoming_events,

            "total_registrations": total_registrations,
        }

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

class AdminPendingEventListView(generics.ListAPIView):
    serializer_class = AdminEventSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    def get_queryset(self):
        return Event.objects.filter(
            status=Event.Status.PENDING
        ).select_related(
            "organizer",
            "category",
        ).order_by("created_at")


class AdminEventListView(generics.ListAPIView):
    serializer_class = AdminEventSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    def get_queryset(self):
        queryset = Event.objects.all().select_related(
            "organizer",
            "category",
        ).order_by("-created_at")

        event_status = self.request.query_params.get("status")
        city = self.request.query_params.get("city")
        featured = self.request.query_params.get("featured")

        if event_status:
            queryset = queryset.filter(
                status=event_status.upper()
            )

        if city:
            queryset = queryset.filter(
                city__icontains=city
            )

        if featured is not None:
            featured_value = featured.lower() in [
                "true",
                "1",
                "yes",
            ]

            queryset = queryset.filter(
                is_featured=featured_value
            )

        return queryset


class AdminEventDetailView(generics.RetrieveAPIView):
    serializer_class = AdminEventSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    queryset = Event.objects.select_related(
        "organizer",
        "category",
    ).all()


class ApproveEventView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    def post(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {
                    "detail": "Event not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if event.status == Event.Status.APPROVED:
            return Response(
                {
                    "detail": "This event is already approved."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.status == Event.Status.CANCELLED:
            return Response(
                {
                    "detail": "A cancelled event cannot be approved."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.end_datetime <= timezone.now():
            return Response(
                {
                    "detail": "A completed event cannot be approved."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        event.status = Event.Status.APPROVED
        event.rejection_reason = ""
        event.save(
            update_fields=[
                "status",
                "rejection_reason",
                "updated_at",
            ]
        )

        create_notification(
            recipient=event.organizer,
            notification_type=Notification.Type.EVENT_APPROVED,
            title="Event approved",
            message=(
                f"Your event '{event.title}' "
                f"has been approved."
            ),
            target_url=f"/events/{event.id}",
        )

        send_event_approved_email(event)

        return Response(
            {
                "message": "Event approved successfully."
            },
            status=status.HTTP_200_OK,
        )


class RejectEventView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    def post(self, request, event_id):
        rejection_reason = request.data.get(
            "rejection_reason",
            ""
        ).strip()

        if not rejection_reason:
            return Response(
                {
                    "rejection_reason":
                        "A rejection reason is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {
                    "detail": "Event not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if event.status == Event.Status.CANCELLED:
            return Response(
                {
                    "detail": "A cancelled event cannot be rejected."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.status == Event.Status.REJECTED:
            return Response(
                {
                    "detail": "This event is already rejected."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        event.status = Event.Status.REJECTED
        event.rejection_reason = rejection_reason
        event.is_featured = False

        event.save(
            update_fields=[
                "status",
                "rejection_reason",
                "is_featured",
                "updated_at",
            ]
        )

        create_notification(
            recipient=event.organizer,
            notification_type=Notification.Type.EVENT_REJECTED,
            title="Event rejected",
            message=(
                f"Your event '{event.title}' was rejected. "
                f"Reason: {event.rejection_reason}"
            ),
            target_url=f"/organizer/events/{event.id}/edit",
        )
        send_event_rejected_email(event)

        return Response(
            {
                "message": "Event rejected successfully.",
                "event": AdminEventSerializer(event).data,
            },
            status=status.HTTP_200_OK,
        )


class ToggleFeaturedEventView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    def post(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {
                    "detail": "Event not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if event.status != Event.Status.APPROVED:
            return Response(
                {
                    "detail":
                        "Only approved events can be featured."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        event.is_featured = not event.is_featured
        event.save(
            update_fields=[
                "is_featured",
                "updated_at",
            ]
        )

        message = (
            "Event marked as featured."
            if event.is_featured
            else "Event removed from featured events."
        )

        return Response(
            {
                "message": message,
                "is_featured": event.is_featured,
                "event": AdminEventSerializer(event).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminDashboardStatsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    def get(self, request):
        events = Event.objects.all()

        data = {
            "total_events": events.count(),

            "draft_events": events.filter(
                status=Event.Status.DRAFT
            ).count(),

            "pending_events": events.filter(
                status=Event.Status.PENDING
            ).count(),

            "approved_events": events.filter(
                status=Event.Status.APPROVED
            ).count(),

            "rejected_events": events.filter(
                status=Event.Status.REJECTED
            ).count(),

            "cancelled_events": events.filter(
                status=Event.Status.CANCELLED
            ).count(),

            "featured_events": events.filter(
                is_featured=True
            ).count(),

            "total_registrations":
                EventRegistration.objects.filter(
                    status=EventRegistration.Status.REGISTERED
                ).count(),
        }

        return Response(
            data,
            status=status.HTTP_200_OK,
        )

class NearbyEventListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        latitude_value = request.query_params.get(
            "latitude"
        )

        longitude_value = request.query_params.get(
            "longitude"
        )

        radius_value = request.query_params.get(
            "radius",
            "25",
        )

        if not latitude_value or not longitude_value:
            return Response(
                {
                    "detail":
                        "Latitude and longitude are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_latitude = float(latitude_value)
            user_longitude = float(longitude_value)
            radius_km = float(radius_value)
        except (TypeError, ValueError):
            return Response(
                {
                    "detail":
                        "Latitude, longitude and radius must be valid numbers."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not -90 <= user_latitude <= 90:
            return Response(
                {
                    "detail":
                        "Latitude must be between -90 and 90."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not -180 <= user_longitude <= 180:
            return Response(
                {
                    "detail":
                        "Longitude must be between -180 and 180."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if radius_km <= 0 or radius_km > 500:
            return Response(
                {
                    "detail":
                        "Radius must be between 1 and 500 kilometres."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        events = Event.objects.filter(
            status=Event.Status.APPROVED,
            latitude__isnull=False,
            longitude__isnull=False,
        ).select_related(
            "organizer",
            "category",
        )

        nearby_events = []

        for event in events:
            event_latitude = float(event.latitude)
            event_longitude = float(event.longitude)

            distance_km = calculate_distance_km(
                user_latitude,
                user_longitude,
                event_latitude,
                event_longitude,
            )

            if distance_km <= radius_km:
                event_data = EventSerializer(
                    event,
                    context={"request": request},
                ).data

                event_data["distance_km"] = round(
                    distance_km,
                    2,
                )

                nearby_events.append(event_data)

        nearby_events.sort(
            key=lambda item: item["distance_km"]
        )

        return Response(
            {
                "latitude": user_latitude,
                "longitude": user_longitude,
                "radius_km": radius_km,
                "count": len(nearby_events),
                "results": nearby_events,
            },
            status=status.HTTP_200_OK,
        )

User = get_user_model()

class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        is_admin = (
            user.is_staff
            or user.is_superuser
            or user.role == "ADMIN"
        )

        if not is_admin:
            return Response(
                {
                    "detail":
                        "Only administrators can view analytics."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        total_users = User.objects.filter(
            role="USER"
        ).count()

        total_organizers = User.objects.filter(
            role="ORGANIZER"
        ).count()

        total_events = Event.objects.count()

        approved_events = Event.objects.filter(
            status=Event.Status.APPROVED
        ).count()

        pending_events = Event.objects.filter(
            status=Event.Status.PENDING
        ).count()

        rejected_events = Event.objects.filter(
            status=Event.Status.REJECTED
        ).count()

        cancelled_events = Event.objects.filter(
            status=Event.Status.CANCELLED
        ).count()

        total_registrations = (
            EventRegistration.objects.count()
        )

        active_registrations = (
            EventRegistration.objects.filter(
                status=EventRegistration.Status.REGISTERED
            ).count()
        )

        attended_registrations = (
            EventRegistration.objects.filter(
                status=EventRegistration.Status.ATTENDED
            ).count()
        )

        cancelled_registrations = (
            EventRegistration.objects.filter(
                status=EventRegistration.Status.CANCELLED
            ).count()
        )

        total_categories = Category.objects.count()

        total_reviews = Review.objects.count()

        monthly_events = (
            Event.objects
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        monthly_registrations = (
            EventRegistration.objects
            .annotate(
                month=TruncMonth("registered_at")
            )
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        category_distribution = (
            Event.objects
            .filter(
                status=Event.Status.APPROVED
            )
            .values(
                "category__id",
                "category__name",
            )
            .annotate(
                event_count=Count("id")
            )
            .order_by("-event_count")
        )

        return Response(
            {
                "users": {
                    "total_users": total_users,
                    "total_organizers":
                        total_organizers,
                },

                "events": {
                    "total": total_events,
                    "approved": approved_events,
                    "pending": pending_events,
                    "rejected": rejected_events,
                    "cancelled": cancelled_events,
                },

                "registrations": {
                    "total": total_registrations,
                    "active":
                        active_registrations,
                    "attended":
                        attended_registrations,
                    "cancelled":
                        cancelled_registrations,
                },

                "categories": {
                    "total": total_categories,
                },

                "reviews": {
                    "total": total_reviews,
                },

                "monthly_events": [
                    {
                        "month":
                            item["month"].strftime(
                                "%Y-%m"
                            ),
                        "count": item["count"],
                    }
                    for item in monthly_events
                    if item["month"]
                ],

                "monthly_registrations": [
                    {
                        "month":
                            item["month"].strftime(
                                "%Y-%m"
                            ),
                        "count": item["count"],
                    }
                    for item in monthly_registrations
                    if item["month"]
                ],

                "category_distribution": [
                    {
                        "category_id":
                            item["category__id"],
                        "category_name":
                            item["category__name"]
                            or "Uncategorized",
                        "event_count":
                            item["event_count"],
                    }
                    for item
                    in category_distribution
                ],
            },
            status=status.HTTP_200_OK,
        )

class AdminCategoryListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = CategorySerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    queryset = Category.objects.all().order_by(
        "name"
    )


class AdminCategoryDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = CategorySerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminRole,
    ]

    queryset = Category.objects.all()