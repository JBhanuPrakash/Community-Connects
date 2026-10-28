import threading

from datetime import timedelta

from django.db import connections
from django.test import TransactionTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from events.models import Category, Event
from notifications.models import Notification
from registrations.models import EventRegistration, SavedEvent


class RegisterForEventCapacityTestCase(TransactionTestCase):
    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def setUp(self):
        self.category = Category.objects.create(
            name="Community"
        )

        self.organizer = User.objects.create_user(
            username="org",
            email="org@example.com",
            password="testpass123",
        )

        self.event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Limited Event",
            description="Capacity one.",
            mode=Event.Mode.ONLINE,
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            capacity=1,
            status=Event.Status.APPROVED,
        )

        self.first_user = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="testpass123",
        )
        self.first_user.is_email_verified = True
        self.first_user.save(update_fields=["is_email_verified"])

        self.second_user = User.objects.create_user(
            username="blocked",
            email="blocked@example.com",
            password="testpass123",
        )
        self.second_user.is_email_verified = True
        self.second_user.save(update_fields=["is_email_verified"])

        EventRegistration.objects.create(
            user=self.first_user,
            event=self.event,
            status=EventRegistration.Status.REGISTERED,
        )

        self.cancelled_registration = (
            EventRegistration.objects.create(
                user=self.second_user,
                event=self.event,
                status=EventRegistration.Status.CANCELLED,
                cancelled_at=timezone.now(),
            )
        )

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_cancelled_registration_cannot_reactivate_full_event(self):
        client = APIClient()
        client.force_authenticate(user=self.second_user)

        response = client.post(
            reverse("register-for-event"),
            {"event_id": self.event.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["detail"],
            "This event has reached its maximum capacity.",
        )

        self.cancelled_registration.refresh_from_db()
        self.assertEqual(
            self.cancelled_registration.status,
            EventRegistration.Status.CANCELLED,
        )

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_concurrent_registrations_do_not_exceed_capacity(self):
        concurrent_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Concurrent Capacity Event",
            description="Capacity one.",
            mode=Event.Mode.ONLINE,
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            capacity=1,
            status=Event.Status.APPROVED,
        )

        barrier = threading.Barrier(2)
        results = []
        exceptions = []

        def attempt_registration(username):
            from accounts.models import User

            user = User.objects.create_user(
                username=username,
                email=f"{username}@example.com",
                password="testpass123",
            )
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])

            client = APIClient()
            client.force_authenticate(user=user)

            barrier.wait()

            try:
                response = client.post(
                    reverse("register-for-event"),
                    {"event_id": concurrent_event.id},
                    format="json",
                )

                results.append(response.status_code)
            except Exception as exception:
                exceptions.append(exception)
            finally:
                connections.close_all()

        threads = [
            threading.Thread(
                target=attempt_registration,
                args=(f"user{index}",),
            )
            for index in range(2)
        ]

        for thread in threads:
            thread.start()

        for thread in threads:
            thread.join()

        self.assertEqual(exceptions, [])
        self.assertEqual(sorted(results), [201, 400])

        registered_count = EventRegistration.objects.filter(
            event=concurrent_event,
            status=EventRegistration.Status.REGISTERED,
        ).count()

        self.assertEqual(registered_count, 1)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_paid_event_cannot_be_joined(self):
        paid_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Paid Gathering",
            description="Not allowed in free-only mode.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            capacity=10,
            price=100,
            status=Event.Status.APPROVED,
        )

        client = APIClient()
        client.force_authenticate(user=self.second_user)

        response = client.post(
            reverse("register-for-event"),
            {"event_id": paid_event.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            EventRegistration.objects.filter(
                user=self.second_user,
                event=paid_event,
                status=EventRegistration.Status.REGISTERED,
            ).exists()
        )

    def test_attendance_cannot_be_marked_outside_event_window(self):
        future_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Future Window Event",
            description="Not open yet.",
            mode=Event.Mode.ONLINE,
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            capacity=10,
            status=Event.Status.APPROVED,
        )

        registration = EventRegistration.objects.create(
            user=self.first_user,
            event=future_event,
            status=EventRegistration.Status.REGISTERED,
        )

        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.post(
            reverse(
                "mark-attendance",
                kwargs={"ticket_code": registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 400)
        registration.refresh_from_db()
        self.assertEqual(
            registration.status,
            EventRegistration.Status.REGISTERED,
        )

    def test_attendance_marked_inside_event_window(self):
        in_progress_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Live Window Event",
            description="Happening now.",
            mode=Event.Mode.ONLINE,
            start_datetime=timezone.now() - timedelta(hours=1),
            end_datetime=timezone.now() + timedelta(hours=1),
            capacity=10,
            status=Event.Status.APPROVED,
        )

        registration = EventRegistration.objects.create(
            user=self.first_user,
            event=in_progress_event,
            status=EventRegistration.Status.REGISTERED,
        )

        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.post(
            reverse(
                "mark-attendance",
                kwargs={"ticket_code": registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 200)

        registration.refresh_from_db()
        self.assertEqual(
            registration.status,
            EventRegistration.Status.ATTENDED,
        )

    def test_unverified_user_cannot_register(self):
        unverified_user = User.objects.create_user(
            username="unverified",
            email="unverified@example.com",
            password="testpass123",
        )

        upcoming_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Gate Event",
            description="Requires verified email.",
            mode=Event.Mode.ONLINE,
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            capacity=10,
            status=Event.Status.APPROVED,
        )

        client = APIClient()
        client.force_authenticate(user=unverified_user)

        response = client.post(
            reverse("register-for-event"),
            {"event_id": upcoming_event.id},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(
            EventRegistration.objects.filter(
                user=unverified_user,
                event=upcoming_event,
            ).exists()
        )


class RegistrationFixtureTestCase(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            username="org_reg",
            email="org_reg@example.com",
            password="testpass123",
        )
        self.organizer.role = User.Role.ORGANIZER
        self.organizer.save(update_fields=["role"])

        self.category = Category.objects.create(
            name="Community"
        )

        self.event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Registerable Event",
            description="A free, open event.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() + timedelta(days=2),
            end_datetime=timezone.now() + timedelta(days=3),
            capacity=10,
            status=Event.Status.APPROVED,
        )

        self.user = User.objects.create_user(
            username="joiner",
            email="joiner@example.com",
            password="testpass123",
        )
        self.user.is_email_verified = True
        self.user.save(update_fields=["is_email_verified"])


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
)
class RegisterForEventGuardTests(RegistrationFixtureTestCase):
    def _register(self, user, event):
        client = APIClient()
        client.force_authenticate(user=user)

        return client.post(
            reverse("register-for-event"),
            {"event_id": event.id},
            format="json",
        )

    def test_organizer_role_cannot_register(self):
        response = self._register(self.organizer, self.event)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.data["detail"],
            "Only regular users can register for events.",
        )

    def test_duplicate_registration_is_rejected(self):
        EventRegistration.objects.create(
            user=self.user,
            event=self.event,
            status=EventRegistration.Status.REGISTERED,
        )

        response = self._register(self.user, self.event)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["detail"],
            "You have already registered for this event.",
        )

    def test_cancelled_registration_reactivates_when_capacity_available(self):
        registration = EventRegistration.objects.create(
            user=self.user,
            event=self.event,
            status=EventRegistration.Status.CANCELLED,
            cancelled_at=timezone.now(),
        )

        response = self._register(self.user, self.event)

        self.assertEqual(response.status_code, 200)

        registration.refresh_from_db()
        self.assertEqual(
            registration.status,
            EventRegistration.Status.REGISTERED,
        )
        self.assertIsNone(registration.cancelled_at)

    def test_started_event_cannot_be_registered(self):
        started_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Already Started",
            description="Too late.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() - timedelta(hours=1),
            end_datetime=timezone.now() + timedelta(hours=1),
            capacity=10,
            status=Event.Status.APPROVED,
        )

        response = self._register(self.user, started_event)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["detail"],
            "This event has already started.",
        )

    def test_registration_after_deadline_is_rejected(self):
        deadline_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Deadline Passed",
            description="Closed.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() + timedelta(days=2),
            end_datetime=timezone.now() + timedelta(days=3),
            registration_deadline=timezone.now() - timedelta(days=1),
            capacity=10,
            status=Event.Status.APPROVED,
        )

        response = self._register(self.user, deadline_event)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["detail"],
            "The registration deadline has passed.",
        )

    def test_non_approved_event_cannot_be_registered(self):
        pending_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Pending Event",
            description="Not approved.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            capacity=10,
            status=Event.Status.PENDING,
        )

        response = self._register(self.user, pending_event)

        self.assertEqual(response.status_code, 400)

    def test_successful_registration_creates_notification(self):
        response = self._register(self.user, self.event)

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user,
                notification_type=Notification.Type.REGISTRATION,
            ).exists()
        )


class CancelRegistrationTests(RegistrationFixtureTestCase):
    def test_cannot_cancel_other_users_registration(self):
        registration = EventRegistration.objects.create(
            user=self.user,
            event=self.event,
            status=EventRegistration.Status.REGISTERED,
        )

        other_user = User.objects.create_user(
            username="other_reg",
            email="other_reg@example.com",
            password="testpass123",
        )
        other_user.is_email_verified = True
        other_user.save(update_fields=["is_email_verified"])

        client = APIClient()
        client.force_authenticate(user=other_user)

        response = client.post(
            reverse(
                "cancel-registration",
                kwargs={"pk": registration.id},
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_cancelling_an_already_cancelled_registration_returns_400(self):
        registration = EventRegistration.objects.create(
            user=self.user,
            event=self.event,
            status=EventRegistration.Status.CANCELLED,
            cancelled_at=timezone.now(),
        )

        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.post(
            reverse(
                "cancel-registration",
                kwargs={"pk": registration.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_cannot_cancel_after_event_started(self):
        started_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Started Event",
            description="Already going.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() - timedelta(hours=1),
            end_datetime=timezone.now() + timedelta(hours=1),
            capacity=10,
            status=Event.Status.APPROVED,
        )

        registration = EventRegistration.objects.create(
            user=self.user,
            event=started_event,
            status=EventRegistration.Status.REGISTERED,
        )

        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.post(
            reverse(
                "cancel-registration",
                kwargs={"pk": registration.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_cancel_registration_succeeds(self):
        registration = EventRegistration.objects.create(
            user=self.user,
            event=self.event,
            status=EventRegistration.Status.REGISTERED,
        )

        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.post(
            reverse(
                "cancel-registration",
                kwargs={"pk": registration.id},
            )
        )

        self.assertEqual(response.status_code, 200)

        registration.refresh_from_db()
        self.assertEqual(
            registration.status,
            EventRegistration.Status.CANCELLED,
        )
        self.assertIsNotNone(registration.cancelled_at)

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user,
                notification_type=(
                    Notification.Type.REGISTRATION_CANCELLED
                ),
            ).exists()
        )


class SavedEventTests(RegistrationFixtureTestCase):
    def _save(self, event):
        client = APIClient()
        client.force_authenticate(user=self.user)

        return client.post(
            reverse(
                "save-event",
                kwargs={"event_id": event.id},
            )
        )

    def test_save_event_succeeds(self):
        response = self._save(self.event)

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            SavedEvent.objects.filter(
                user=self.user,
                event=self.event,
            ).exists()
        )

    def test_save_event_twice_is_rejected(self):
        self._save(self.event)

        response = self._save(self.event)

        self.assertEqual(response.status_code, 400)

    def test_cannot_save_non_approved_event(self):
        pending_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Pending for Save",
            description="Not approved.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            capacity=10,
            status=Event.Status.PENDING,
        )

        response = self._save(pending_event)

        self.assertEqual(response.status_code, 404)

    def test_remove_saved_event_succeeds(self):
        SavedEvent.objects.create(
            user=self.user,
            event=self.event,
        )

        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.delete(
            reverse(
                "remove-saved-event",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            SavedEvent.objects.filter(
                user=self.user,
                event=self.event,
            ).exists()
        )

    def test_remove_unsaved_event_returns_404(self):
        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.delete(
            reverse(
                "remove-saved-event",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_saved_events_list_only_returns_approved(self):
        pending_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Pending in List",
            description="Not approved.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            capacity=10,
            status=Event.Status.PENDING,
        )

        SavedEvent.objects.create(
            user=self.user,
            event=self.event,
        )
        SavedEvent.objects.create(
            user=self.user,
            event=pending_event,
        )

        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.get(reverse("my-saved-events"))

        self.assertEqual(response.status_code, 200)
        event_ids = {
            item["event"]
            for item in response.data
        }
        self.assertIn(self.event.id, event_ids)
        self.assertNotIn(pending_event.id, event_ids)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
)
class TicketAndAttendanceTests(RegistrationFixtureTestCase):
    def setUp(self):
        super().setUp()

        self.registration = EventRegistration.objects.create(
            user=self.user,
            event=self.event,
            status=EventRegistration.Status.REGISTERED,
        )

        self.other_user = User.objects.create_user(
            username="curious_bystander",
            email="curious_bystander@example.com",
            password="testpass123",
        )
        self.other_user.is_email_verified = True
        self.other_user.save(update_fields=["is_email_verified"])

    def test_ticket_detail_succeeds(self):
        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.get(
            reverse(
                "ticket-detail",
                kwargs={"pk": self.registration.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["ticket_code"],
            str(self.registration.ticket_code),
        )

    def test_ticket_detail_hidden_from_other_users(self):
        client = APIClient()
        client.force_authenticate(user=self.other_user)

        response = client.get(
            reverse(
                "ticket-detail",
                kwargs={"pk": self.registration.id},
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_cancelled_registration_has_no_ticket(self):
        self.registration.status = EventRegistration.Status.CANCELLED
        self.registration.cancelled_at = timezone.now()
        self.registration.save()

        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.get(
            reverse(
                "ticket-detail",
                kwargs={"pk": self.registration.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_qr_code_is_generated(self):
        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.get(
            reverse(
                "ticket-qr",
                kwargs={"pk": self.registration.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response["Content-Type"],
            "image/png",
        )

    def test_qr_code_rejected_for_cancelled_registration(self):
        self.registration.status = EventRegistration.Status.CANCELLED
        self.registration.save()

        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.get(
            reverse(
                "ticket-qr",
                kwargs={"pk": self.registration.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_pdf_ticket_is_downloaded(self):
        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.get(
            reverse(
                "ticket-pdf",
                kwargs={"pk": self.registration.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response["Content-Type"],
            "application/pdf",
        )

    def test_verify_ticket_by_organizer(self):
        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.get(
            reverse(
                "verify-ticket",
                kwargs={"ticket_code": self.registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["valid"])

    def test_verify_ticket_by_unrelated_user_is_forbidden(self):
        client = APIClient()
        client.force_authenticate(user=self.other_user)

        response = client.get(
            reverse(
                "verify-ticket",
                kwargs={"ticket_code": self.registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 403)

    def test_verify_invalid_ticket_returns_404(self):
        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.get(
            reverse(
                "verify-ticket",
                kwargs={
                    "ticket_code": "00000000-0000-0000-0000-000000000000"
                },
            )
        )

        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.data["valid"])

    def test_verify_cancelled_ticket_reports_invalid(self):
        self.registration.status = EventRegistration.Status.CANCELLED
        self.registration.save()

        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.get(
            reverse(
                "verify-ticket",
                kwargs={"ticket_code": self.registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["valid"])

    def _in_progress_registration(self):
        in_progress_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Live Window Event",
            description="Happening now.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/join",
            start_datetime=timezone.now() - timedelta(hours=1),
            end_datetime=timezone.now() + timedelta(hours=1),
            capacity=10,
            status=Event.Status.APPROVED,
        )

        return EventRegistration.objects.create(
            user=self.user,
            event=in_progress_event,
            status=EventRegistration.Status.REGISTERED,
        )

    def test_mark_attendance_succeeds(self):
        registration = self._in_progress_registration()

        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.post(
            reverse(
                "mark-attendance",
                kwargs={"ticket_code": registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 200)

        registration.refresh_from_db()
        self.assertEqual(
            registration.status,
            EventRegistration.Status.ATTENDED,
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user,
                notification_type=Notification.Type.ATTENDANCE,
            ).exists()
        )

    def test_mark_attendance_is_idempotent(self):
        registration = self._in_progress_registration()
        registration.status = EventRegistration.Status.ATTENDED
        registration.save()

        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.post(
            reverse(
                "mark-attendance",
                kwargs={"ticket_code": registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 200)

    def test_mark_attendance_rejected_for_cancelled_registration(self):
        self.registration.status = EventRegistration.Status.CANCELLED
        self.registration.save()

        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.post(
            reverse(
                "mark-attendance",
                kwargs={"ticket_code": self.registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_mark_attendance_by_unrelated_user_is_forbidden(self):
        client = APIClient()
        client.force_authenticate(user=self.other_user)

        response = client.post(
            reverse(
                "mark-attendance",
                kwargs={"ticket_code": self.registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 403)

    def test_mark_attendance_before_event_start_is_rejected(self):
        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.post(
            reverse(
                "mark-attendance",
                kwargs={"ticket_code": self.registration.ticket_code},
            )
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["detail"],
            "This event has not started yet.",
        )

    def test_mark_attendance_for_invalid_ticket_returns_404(self):
        client = APIClient()
        client.force_authenticate(user=self.organizer)

        response = client.post(
            reverse(
                "mark-attendance",
                kwargs={
                    "ticket_code": "00000000-0000-0000-0000-000000000000"
                },
            )
        )

        self.assertEqual(response.status_code, 404)