from django.db.models import Avg
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework import generics, permissions, serializers, status

from events.models import Event
from registrations.models import EventRegistration
from notifications.models import Notification
from notifications.utils import create_notification

from rest_framework import (
    generics,
    permissions,
    serializers,
    status,
)

from .models import Review
from .permissions import IsReviewOwner
from .serializers import (
    OrganizerReplySerializer,
    ReviewSerializer,
)


class EventReviewListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]

        return [permissions.AllowAny()]

    def get_queryset(self):
        return Review.objects.filter(
            event_id=self.kwargs["event_id"],
        ).select_related(
            "user",
            "event",
        )

    def perform_create(self, serializer):
        event_id = self.kwargs["event_id"]

        try:
            event = Event.objects.get(
                id=event_id,
                status=Event.Status.APPROVED,
            )
        except Event.DoesNotExist:
            raise serializers.ValidationError(
                {
                    "event":
                        "Approved event not found."
                }
            )

        user = self.request.user

        if user.role != "USER":
            raise serializers.ValidationError(
                {
                    "detail":
                        "Only regular users can review events."
                }
            )

        has_registration = (
            EventRegistration.objects.filter(
                user=user,
                event=event,
                status__in=[
                    EventRegistration.Status.REGISTERED,
                    EventRegistration.Status.ATTENDED,
                ],
            ).exists()
        )

        if not has_registration:
            raise serializers.ValidationError(
                {
                    "detail":
                        "You must register for this event before reviewing it."
                }
            )

        if event.start_datetime > timezone.now():
            raise serializers.ValidationError(
            {
                "detail":
                    "You can review this event only after it has started."
            }
        )

        if Review.objects.filter(
            user=user,
            event=event,
        ).exists():
            raise serializers.ValidationError(
                {
                    "detail":
                        "You have already reviewed this event."
                }
            )

        serializer.save(
            user=user,
            event=event,
        )


class ReviewDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = ReviewSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsReviewOwner,
    ]

    queryset = Review.objects.select_related(
        "user",
        "event",
    ).all()


class EventReviewSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, event_id):
        reviews = Review.objects.filter(
            event_id=event_id,
        )

        summary = reviews.aggregate(
            average_rating=Avg("rating"),
        )

        return Response(
            {
                "average_rating": round(
                    summary["average_rating"] or 0,
                    1,
                ),
                "review_count": reviews.count(),
                "rating_breakdown": {
                    str(rating): reviews.filter(
                        rating=rating
                    ).count()
                    for rating in range(5, 0, -1)
                },
            },
            status=status.HTTP_200_OK,
        )


class OrganizerReplyView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def post(self, request, review_id):
        try:
            review = Review.objects.select_related(
                "event",
            ).get(
                id=review_id,
                event__organizer=request.user,
            )
        except Review.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Review not found or you do not own the event."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrganizerReplySerializer(
            review,
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        create_notification(
            recipient=review.user,
            notification_type=Notification.Type.REVIEW_REPLY,
            title="Organizer replied to your review",
            message=(
                f"The organizer replied to your review "
                f"for '{review.event.title}'."
            ),
            target_url=f"/events/{review.event.id}",
        )

        return Response(
            {
                "message":
                    "Reply added successfully.",
                "review":
                    ReviewSerializer(
                        review,
                        context={"request": request},
                    ).data,
            },
            status=status.HTTP_200_OK,
        )