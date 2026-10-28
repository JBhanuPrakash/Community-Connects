from urllib import request

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from notifications.models import Notification
from notifications.utils import create_notification
from .emails import send_registration_confirmation_email 

from .models import EventRegistration, SavedEvent
from events.models import Event
from .models import EventRegistration
from .serializers import (
    EventRegistrationSerializer,
    RegisterForEventSerializer,
    SavedEventSerializer,
)

from django.http import FileResponse, HttpResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .ticket_utils import (
    generate_qr_image,
    generate_ticket_pdf,
)


class MyRegistrationsView(generics.ListAPIView):
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EventRegistration.objects.filter(
            user=self.request.user
        ).select_related(
            "event",
            "user",
        )


class RegisterForEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = RegisterForEventSerializer(
            data=request.data,
            context={},
        )

        serializer.is_valid(raise_exception=True)

        event = Event.objects.select_for_update().get(
            pk=serializer.context["event"].pk
        )
        user = request.user

        def has_capacity_available():
            if event.capacity is None:
                return True

            registered_count = (
                EventRegistration.objects.filter(
                    event=event,
                    status=EventRegistration.Status.REGISTERED,
                ).count()
            )

            return registered_count < event.capacity

        if user.role != "USER":
            return Response(
                {
                    "detail":
                        "Only regular users can register for events."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_email_verified:
            return Response(
                {
                    "detail":
                        "Verify your email address before "
                        "registering for events."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.status != Event.Status.APPROVED:
            return Response(
                {
                    "detail":
                        "Registration is available only for approved events."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.price > 0:
            return Response(
                {
                    "detail":
                        "Paid events are not supported yet. "
                        "Only free events can be joined."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_time = timezone.now()

        if event.start_datetime <= current_time:
            return Response(
                {
                    "detail": "This event has already started."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            event.registration_deadline
            and event.registration_deadline < current_time
        ):
            return Response(
                {
                    "detail":
                        "The registration deadline has passed."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_registration = EventRegistration.objects.filter(
            user=user,
            event=event,
        ).first()

        if existing_registration:
            if (
                existing_registration.status
                == EventRegistration.Status.CANCELLED
            ):
                if not has_capacity_available():
                    return Response(
                        {
                            "detail":
                                "This event has reached its maximum capacity."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                existing_registration.status = (
                    EventRegistration.Status.REGISTERED
                )
                existing_registration.cancelled_at = None
                existing_registration.save(
                    update_fields=["status", "cancelled_at"]
                )

                return Response(
                    EventRegistrationSerializer(
                        existing_registration
                    ).data,
                    status=status.HTTP_200_OK,
                )

            return Response(
                {
                    "detail":
                        "You have already registered for this event."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not has_capacity_available():
            return Response(
                {
                    "detail":
                        "This event has reached its maximum capacity."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        registration = EventRegistration.objects.create(
            user=user,
            event=event,
            status=EventRegistration.Status.REGISTERED,
        )

        create_notification(
            recipient=request.user,
            notification_type=Notification.Type.REGISTRATION,
            title="Registration successful",
            message=(
                f"You successfully registered for "
                f"'{event.title}'."
            ),
            target_url=f"/tickets/{registration.id}",
        )

        if request.user.email:
            send_registration_confirmation_email(
                registration
            )

        return Response(
            {
                "message": "Registered successfully.",
                "registration": EventRegistrationSerializer(
                    registration,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

class CancelRegistrationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            registration = EventRegistration.objects.get(
                pk=pk,
                user=request.user,
            )
        except EventRegistration.DoesNotExist:
            return Response(
                {
                    "detail": "Registration not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if registration.status == EventRegistration.Status.CANCELLED:
            return Response(
                {
                    "detail":
                        "This registration is already cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if registration.event.start_datetime <= timezone.now():
            return Response(
                {
                    "detail":
                        "You cannot cancel after the event has started."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        registration.status = EventRegistration.Status.CANCELLED
        registration.cancelled_at = timezone.now()

        registration.save(
            update_fields=["status", "cancelled_at"]
        )

        create_notification(
            recipient=request.user,
            notification_type=(
                Notification.Type.REGISTRATION_CANCELLED
            ),
            title="Registration cancelled",
            message=(
                f"Your registration for "
                f"'{registration.event.title}' "
                f"was cancelled."
            ),
            target_url="/dashboard",
        )

        return Response(
            {
                "message": "Registration cancelled successfully.",
                "registration": EventRegistrationSerializer(
                    registration,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

class MySavedEventsView(generics.ListAPIView):
    serializer_class = SavedEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedEvent.objects.filter(
            user=self.request.user,
            event__status=Event.Status.APPROVED,
        ).select_related(
            "event",
            "event__category",
        )


class SaveEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        try:
            event = Event.objects.get(
                id=event_id,
                status=Event.Status.APPROVED,
            )
        except Event.DoesNotExist:
            return Response(
                {
                    "detail": "Approved event not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_event, created = SavedEvent.objects.get_or_create(
            user=request.user,
            event=event,
        )

        if not created:
            return Response(
                {
                    "detail": "This event is already saved."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Event saved successfully.",
                "saved_event": SavedEventSerializer(saved_event).data,
            },
            status=status.HTTP_201_CREATED,
        )


class RemoveSavedEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, event_id):
        try:
            saved_event = SavedEvent.objects.get(
                user=request.user,
                event_id=event_id,
            )
        except SavedEvent.DoesNotExist:
            return Response(
                {
                    "detail": "Saved event not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_event.delete()

        return Response(
            {
                "message": "Event removed from saved events."
            },
            status=status.HTTP_200_OK,
        )

class TicketDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            registration = (
                EventRegistration.objects
                .select_related(
                    "user",
                    "event",
                    "event__category",
                )
                .get(
                    pk=pk,
                    user=request.user,
                )
            )
        except EventRegistration.DoesNotExist:
            return Response(
                {
                    "detail": "Ticket not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            registration.status
            == EventRegistration.Status.CANCELLED
        ):
            return Response(
                {
                    "detail":
                        "A cancelled registration does not have a valid ticket."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            EventRegistrationSerializer(
                registration,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )


class TicketQRCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            registration = EventRegistration.objects.get(
                pk=pk,
                user=request.user,
            )
        except EventRegistration.DoesNotExist:
            return Response(
                {
                    "detail": "Ticket not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            registration.status
            == EventRegistration.Status.CANCELLED
        ):
            return Response(
                {
                    "detail":
                        "A cancelled ticket cannot be displayed."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        qr_buffer = generate_qr_image(
            registration.ticket_code
        )

        response = HttpResponse(
            qr_buffer.getvalue(),
            content_type="image/png",
        )

        response[
            "Content-Disposition"
        ] = (
            f'inline; filename="ticket-{registration.id}.png"'
        )

        return response


class DownloadTicketPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            registration = (
                EventRegistration.objects
                .select_related(
                    "user",
                    "event",
                )
                .get(
                    pk=pk,
                    user=request.user,
                )
            )
        except EventRegistration.DoesNotExist:
            return Response(
                {
                    "detail": "Ticket not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            registration.status
            == EventRegistration.Status.CANCELLED
        ):
            return Response(
                {
                    "detail":
                        "A cancelled ticket cannot be downloaded."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pdf_buffer = generate_ticket_pdf(registration)

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=(
                f"communityconnect-ticket-"
                f"{registration.id}.pdf"
            ),
            content_type="application/pdf",
        )

class VerifyTicketView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ticket_code):
        try:
            registration = (
                EventRegistration.objects
                .select_related(
                    "user",
                    "event",
                )
                .get(ticket_code=ticket_code)
            )
        except EventRegistration.DoesNotExist:
            return Response(
                {
                    "valid": False,
                    "detail": "Invalid ticket."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        is_admin = (
            request.user.is_staff
            or request.user.is_superuser
            or request.user.role == "ADMIN"
        )

        is_event_organizer = (
            registration.event.organizer_id
            == request.user.id
        )

        if not is_admin and not is_event_organizer:
            return Response(
                {
                    "detail":
                        "You are not allowed to verify this ticket."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if (
            registration.status
            == EventRegistration.Status.CANCELLED
        ):
            return Response(
                {
                    "valid": False,
                    "detail":
                        "This registration was cancelled.",
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "valid": True,
                "ticket": EventRegistrationSerializer(
                    registration,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )   

class MarkAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ticket_code):
        try:
            registration = (
                EventRegistration.objects
                .select_related(
                    "user",
                    "event",
                )
                .get(ticket_code=ticket_code)
            )
        except EventRegistration.DoesNotExist:
            return Response(
                {
                    "detail": "Invalid ticket."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        is_admin = (
            request.user.is_staff
            or request.user.is_superuser
            or request.user.role == "ADMIN"
        )

        is_event_organizer = (
            registration.event.organizer_id
            == request.user.id
        )

        if not is_admin and not is_event_organizer:
            return Response(
                {
                    "detail":
                        "You are not allowed to mark attendance for this ticket."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if (
            registration.status
            == EventRegistration.Status.CANCELLED
        ):
            return Response(
                {
                    "detail":
                        "A cancelled registration cannot be marked as attended."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_time = timezone.now()

        if current_time < registration.event.start_datetime:
            return Response(
                {
                    "detail": "This event has not started yet."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            registration.event.end_datetime
            and current_time > registration.event.end_datetime
        ):
            return Response(
                {
                    "detail": "This event has already ended."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            registration.status
            == EventRegistration.Status.ATTENDED
        ):
            return Response(
                {
                    "message":
                        "This participant is already marked as attended.",
                    "registration":
                        EventRegistrationSerializer(
                            registration,
                            context={"request": request},
                        ).data,
                },
                status=status.HTTP_200_OK,
            )

        registration.status = (
            EventRegistration.Status.ATTENDED
        )

        registration.save(
            update_fields=["status"],
        )

        create_notification(
            recipient=registration.user,
            notification_type=Notification.Type.ATTENDANCE,
            title="Attendance confirmed",
            message=(
                f"Your attendance for "
                f"'{registration.event.title}' "
                f"has been confirmed."
            ),
            target_url=f"/tickets/{registration.id}",
        )
        return Response(
            {
                "message":
                    "Participant marked as attended successfully.",
                "registration":
                    EventRegistrationSerializer(
                        registration,
                        context={"request": request},
                    ).data,
            },
            status=status.HTTP_200_OK,
        )