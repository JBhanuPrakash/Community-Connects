from datetime import timedelta

from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from events.models import Category, Event
from events.views import calculate_distance_km
from notifications.models import Notification
from registrations.models import EventRegistration
from reviews.models import Review


class EventWorkflowTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass123",
        )
        self.admin.role = User.Role.ADMIN
        self.admin.save()

        self.organizer = User.objects.create_user(
            username="organizer",
            email="organizer@example.com",
            password="testpass123",
        )
        self.organizer.role = User.Role.ORGANIZER
        self.organizer.save()

        self.category = Category.objects.create(
            name="Technology"
        )

        self.event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Tech Meetup",
            description="A testing event.",
            mode=Event.Mode.ONLINE,
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            status=Event.Status.PENDING,
        )


class ApproveEventViewTests(EventWorkflowTestCase):
    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_approve_pending_event_returns_success_message(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-approve",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["message"],
            "Event approved successfully.",
        )

        self.event.refresh_from_db()
        self.assertEqual(self.event.status, Event.Status.APPROVED)

    def test_non_admin_cannot_approve_event(self):
        self.client.force_authenticate(user=self.organizer)

        response = self.client.post(
            reverse(
                "admin-event-approve",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 403)


class CancelOrganizerEventViewTests(EventWorkflowTestCase):
    def test_cancel_event_with_no_registrations_succeeds(self):
        self.client.force_authenticate(user=self.organizer)

        response = self.client.post(
            reverse(
                "organizer-event-cancel",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, Event.Status.CANCELLED)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_cancel_event_emails_every_registered_user(self):
        first_user = User.objects.create_user(
            username="first",
            email="first@example.com",
            password="testpass123",
        )
        second_user = User.objects.create_user(
            username="second",
            email="second@example.com",
            password="testpass123",
        )

        for user in (first_user, second_user):
            EventRegistration.objects.create(
                user=user,
                event=self.event,
                status=EventRegistration.Status.REGISTERED,
            )

        self.client.force_authenticate(user=self.organizer)

        response = self.client.post(
            reverse(
                "organizer-event-cancel",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 200)

        for registration in self.event.registrations.all():
            self.assertEqual(
                registration.status,
                EventRegistration.Status.CANCELLED,
            )


class EventDetailViewTests(EventWorkflowTestCase):
    def test_event_cannot_be_hard_deleted(self):
        self.event.status = Event.Status.APPROVED
        self.event.save()
        self.client.force_authenticate(user=self.organizer)

        response = self.client.delete(
            reverse(
                "event-detail",
                kwargs={"pk": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 405)
        self.assertTrue(
            Event.objects.filter(id=self.event.id).exists()
        )


class EventFilteringAndPricingTests(EventWorkflowTestCase):
    def test_events_can_be_filtered_by_category_name(self):
        music_category = Category.objects.create(
            name="Music"
        )

        music_event = Event.objects.create(
            organizer=self.organizer,
            category=music_category,
            title="Live Gig",
            description="A music event.",
            mode=Event.Mode.OFFLINE,
            venue_name="Main Stage",
            city="Mumbai",
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            status=Event.Status.APPROVED,
        )

        self.event.status = Event.Status.APPROVED
        self.event.save(update_fields=["status"])

        response = self.client.get(
            "/api/events/",
            {"category": "music"},
        )

        self.assertEqual(response.status_code, 200)

        result_ids = {
            event["id"]
            for event in response.data["results"]
        }

        self.assertIn(music_event.id, result_ids)
        self.assertNotIn(self.event.id, result_ids)

    def test_create_rejects_paid_event(self):
        self.client.force_authenticate(user=self.organizer)

        response = self.client.post(
            "/api/events/",
            {
                "title": "Paid Wave",
                "short_description": "",
                "description": "Should be free.",
                "category": self.category.id,
                "banner_image": "",
                "mode": "ONLINE",
                "venue_name": "",
                "address": "",
                "city": "",
                "state": "",
                "latitude": "",
                "longitude": "",
                "online_event_url": "https://example.com/join",
                "start_datetime": "2026-10-01T10:00:00Z",
                "end_datetime": "2026-10-01T12:00:00Z",
                "registration_deadline": "2026-09-30T10:00:00Z",
                "capacity": 20,
                "price": "100.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("price", response.data)


class AdminEventDecisionTests(EventWorkflowTestCase):
    def test_reject_event_requires_reason(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-reject",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("rejection_reason", response.data)

        self.event.refresh_from_db()
        self.assertEqual(self.event.status, Event.Status.PENDING)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    def test_reject_event_succeeds_and_clears_featured(self):
        self.event.status = Event.Status.APPROVED
        self.event.is_featured = True
        self.event.save()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-reject",
                kwargs={"event_id": self.event.id},
            ),
            {"rejection_reason": "Duplicate listing."},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.event.refresh_from_db()
        self.assertEqual(self.event.status, Event.Status.REJECTED)
        self.assertEqual(self.event.rejection_reason, "Duplicate listing.")
        self.assertFalse(self.event.is_featured)

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.organizer,
                notification_type=Notification.Type.EVENT_REJECTED,
            ).exists()
        )

    def test_reject_already_rejected_event_returns_400(self):
        self.event.status = Event.Status.REJECTED
        self.event.save()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-reject",
                kwargs={"event_id": self.event.id},
            ),
            {"rejection_reason": "Again."},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_reject_cancelled_event_returns_400(self):
        self.event.status = Event.Status.CANCELLED
        self.event.save()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-reject",
                kwargs={"event_id": self.event.id},
            ),
            {"rejection_reason": "Too late."},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_reject_missing_event_returns_404(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-reject",
                kwargs={"event_id": 999999},
            ),
            {"rejection_reason": "Gone."},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_approve_already_approved_event_returns_400(self):
        self.event.status = Event.Status.APPROVED
        self.event.save()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-approve",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_approve_cancelled_event_returns_400(self):
        self.event.status = Event.Status.CANCELLED
        self.event.save()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-approve",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_approve_completed_event_returns_400(self):
        self.event.status = Event.Status.PENDING
        self.event.start_datetime = timezone.now() - timedelta(days=5)
        self.event.end_datetime = timezone.now() - timedelta(days=4)
        self.event.save()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-approve",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_approve_missing_event_returns_404(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-approve",
                kwargs={"event_id": 999999},
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_approve_event_creates_notification_for_organizer(self):
        self.client.force_authenticate(user=self.admin)

        self.client.post(
            reverse(
                "admin-event-approve",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.organizer,
                notification_type=Notification.Type.EVENT_APPROVED,
            ).exists()
        )


class ToggleFeaturedEventTests(EventWorkflowTestCase):
    def test_non_approved_event_cannot_be_featured(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-featured",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_featured_toggle_turns_on_then_off(self):
        self.event.status = Event.Status.APPROVED
        self.event.save()

        self.client.force_authenticate(user=self.admin)

        first = self.client.post(
            reverse(
                "admin-event-featured",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(first.status_code, 200)
        self.assertTrue(first.data["is_featured"])

        second = self.client.post(
            reverse(
                "admin-event-featured",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(second.status_code, 200)
        self.assertFalse(second.data["is_featured"])

    def test_featured_toggle_on_missing_event_returns_404(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse(
                "admin-event-featured",
                kwargs={"event_id": 999999},
            )
        )

        self.assertEqual(response.status_code, 404)


class CancelOrganizerEventEdgeTests(EventWorkflowTestCase):
    def test_cancelling_already_cancelled_event_returns_400(self):
        self.event.status = Event.Status.CANCELLED
        self.event.save()

        self.client.force_authenticate(user=self.organizer)

        response = self.client.post(
            reverse(
                "organizer-event-cancel",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 400)

    def test_completed_event_cannot_be_cancelled(self):
        self.event.start_datetime = timezone.now() - timedelta(days=2)
        self.event.end_datetime = timezone.now() - timedelta(days=1)
        self.event.save()

        self.client.force_authenticate(user=self.organizer)

        response = self.client.post(
            reverse(
                "organizer-event-cancel",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 400)
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, Event.Status.PENDING)

    def test_other_organizer_cannot_cancel_event(self):
        other_organizer = User.objects.create_user(
            username="other_organizer",
            email="other_organizer@example.com",
            password="testpass123",
        )
        other_organizer.role = User.Role.ORGANIZER
        other_organizer.save()

        self.client.force_authenticate(user=other_organizer)

        response = self.client.post(
            reverse(
                "organizer-event-cancel",
                kwargs={"event_id": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 404)

    def test_cancelling_missing_event_returns_404(self):
        self.client.force_authenticate(user=self.organizer)

        response = self.client.post(
            reverse(
                "organizer-event-cancel",
                kwargs={"event_id": 999999},
            )
        )

        self.assertEqual(response.status_code, 404)


class EventVisibilityTests(EventWorkflowTestCase):
    def test_pending_event_hidden_from_regular_users(self):
        regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="testpass123",
        )

        self.client.force_authenticate(user=regular_user)

        list_response = self.client.get("/api/events/")

        self.assertEqual(list_response.status_code, 200)
        result_ids = {
            item["id"]
            for item in list_response.data["results"]
        }
        self.assertNotIn(self.event.id, result_ids)

        detail_response = self.client.get(
            reverse(
                "event-detail",
                kwargs={"pk": self.event.id},
            )
        )

        self.assertEqual(detail_response.status_code, 404)

    def test_organizer_sees_own_pending_event(self):
        self.client.force_authenticate(user=self.organizer)

        list_response = self.client.get("/api/events/")

        result_ids = {
            item["id"]
            for item in list_response.data["results"]
        }
        self.assertIn(self.event.id, result_ids)

        detail_response = self.client.get(
            reverse(
                "event-detail",
                kwargs={"pk": self.event.id},
            )
        )

        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["status"], "PENDING")

    def test_admin_sees_everything_including_pending(self):
        self.admin.is_staff = True
        self.admin.save(update_fields=["is_staff"])

        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            reverse(
                "event-detail",
                kwargs={"pk": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 200)

    def test_pending_event_hidden_from_role_only_admin(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            reverse(
                "event-detail",
                kwargs={"pk": self.event.id},
            )
        )

        self.assertEqual(response.status_code, 404)


class EventListFilterTests(EventWorkflowTestCase):
    def _make_approved_event(self, **overrides):
        defaults = {
            "organizer": self.organizer,
            "category": self.category,
            "title": "Filtered Event",
            "description": "Filterable.",
            "mode": Event.Mode.ONLINE,
            "start_datetime": timezone.now() + timedelta(days=1),
            "end_datetime": timezone.now() + timedelta(days=2),
            "status": Event.Status.APPROVED,
        }

        defaults.update(overrides)

        return Event.objects.create(**defaults)

    def test_events_can_be_searched_by_title(self):
        self.event.status = Event.Status.APPROVED
        self.event.save(update_fields=["status"])

        response = self.client.get(
            "/api/events/",
            {"search": "Tech"},
        )

        result_ids = {
            item["id"]
            for item in response.data["results"]
        }
        self.assertIn(self.event.id, result_ids)

    def test_events_can_be_filtered_by_city(self):
        offline_event = self._make_approved_event(
            mode=Event.Mode.OFFLINE,
            venue_name="Main Stage",
            city="Mumbai",
        )

        response = self.client.get(
            "/api/events/",
            {"city": "mumbai", "mode": "OFFLINE"},
        )

        result_ids = {
            item["id"]
            for item in response.data["results"]
        }
        self.assertIn(offline_event.id, result_ids)
        self.assertNotIn(self.event.id, result_ids)

    def test_price_type_filters_free_and_paid(self):
        free_event = self._make_approved_event(title="Free Talk")
        paid_event = self._make_approved_event(
            title="Paid Talk",
            price=100,
        )

        free_response = self.client.get(
            "/api/events/",
            {"price_type": "free"},
        )
        free_ids = {
            item["id"]
            for item in free_response.data["results"]
        }
        self.assertIn(free_event.id, free_ids)
        self.assertNotIn(paid_event.id, free_ids)

        paid_response = self.client.get(
            "/api/events/",
            {"price_type": "paid"},
        )
        paid_ids = {
            item["id"]
            for item in paid_response.data["results"]
        }
        self.assertIn(paid_event.id, paid_ids)
        self.assertNotIn(free_event.id, paid_ids)

    def test_events_can_be_filtered_by_featured(self):
        featured_event = self._make_approved_event(
            title="Featured Talk",
            is_featured=True,
        )

        response = self.client.get(
            "/api/events/",
            {"featured": "true"},
        )

        result_ids = {
            item["id"]
            for item in response.data["results"]
        }
        self.assertIn(featured_event.id, result_ids)
        self.assertNotIn(self.event.id, result_ids)

    def test_events_can_be_ordered_by_popularity(self):
        active_event = self._make_approved_event(title="Busy Event")
        quiet_event = self._make_approved_event(title="Quiet Event")

        first_user = User.objects.create_user(
            username="participant_a",
            email="participant_a@example.com",
            password="testpass123",
        )
        second_user = User.objects.create_user(
            username="participant_b",
            email="participant_b@example.com",
            password="testpass123",
        )

        EventRegistration.objects.create(
            user=first_user,
            event=active_event,
            status=EventRegistration.Status.REGISTERED,
        )
        EventRegistration.objects.create(
            user=second_user,
            event=active_event,
            status=EventRegistration.Status.REGISTERED,
        )

        response = self.client.get(
            "/api/events/",
            {"ordering": "popular"},
        )

        results = response.data["results"]
        self.assertEqual(results[0]["id"], active_event.id)

        quiet_ids = {
            item["id"]
            for item in results
        }
        self.assertIn(quiet_event.id, quiet_ids)


class OrganizerEventUpdateTests(EventWorkflowTestCase):
    def test_updating_approved_event_resets_to_pending(self):
        self.event.status = Event.Status.APPROVED
        self.event.save(update_fields=["status"])

        self.client.force_authenticate(user=self.organizer)

        response = self.client.patch(
            reverse(
                "organizer-event-detail",
                kwargs={"pk": self.event.id},
            ),
            {"title": "Revised Title"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.event.refresh_from_db()
        self.assertEqual(self.event.status, Event.Status.PENDING)
        self.assertEqual(self.event.title, "Revised Title")

    def test_other_organizer_cannot_update_event(self):
        other_organizer = User.objects.create_user(
            username="rival_organizer",
            email="rival_organizer@example.com",
            password="testpass123",
        )
        other_organizer.role = User.Role.ORGANIZER
        other_organizer.save()

        self.client.force_authenticate(user=other_organizer)

        response = self.client.patch(
            reverse(
                "organizer-event-detail",
                kwargs={"pk": self.event.id},
            ),
            {"title": "Hijacked"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)


class OrganizerParticipantTests(EventWorkflowTestCase):
    def setUp(self):
        super().setUp()
        self.attendee = User.objects.create_user(
            username="attendee",
            email="attendee@example.com",
            password="testpass123",
        )

        self.registration = EventRegistration.objects.create(
            user=self.attendee,
            event=self.event,
            status=EventRegistration.Status.REGISTERED,
        )

    def test_participants_can_be_filtered_by_status(self):
        self.client.force_authenticate(user=self.organizer)

        registered = self.client.get(
            reverse(
                "organizer-event-participants",
                kwargs={"event_id": self.event.id},
            ),
            {"status": "REGISTERED"},
        )

        self.assertEqual(registered.status_code, 200)
        self.assertEqual(len(registered.data), 1)

        attended = self.client.get(
            reverse(
                "organizer-event-participants",
                kwargs={"event_id": self.event.id},
            ),
            {"status": "ATTENDED"},
        )

        self.assertEqual(len(attended.data), 0)

    def test_other_organizer_sees_empty_participants(self):
        other_organizer = User.objects.create_user(
            username="spectator_organizer",
            email="spectator_organizer@example.com",
            password="testpass123",
        )
        other_organizer.role = User.Role.ORGANIZER
        other_organizer.save()

        self.client.force_authenticate(user=other_organizer)

        response = self.client.get(
            reverse(
                "organizer-event-participants",
                kwargs={"event_id": self.event.id},
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_not_an_organizer_is_forbidden_from_participants(self):
        self.client.force_authenticate(user=self.attendee)

        response = self.client.get(
            reverse(
                "organizer-event-participants",
                kwargs={"event_id": self.event.id},
            ),
        )

        self.assertEqual(response.status_code, 403)


class NearbyEventViewTests(EventWorkflowTestCase):
    def setUp(self):
        super().setUp()
        self.event.status = Event.Status.APPROVED
        self.event.latitude = "19.0760"
        self.event.longitude = "72.8777"
        self.event.city = "Mumbai"
        self.event.save()

    def _post(self, params):
        return self.client.get(
            reverse("nearby-events"),
            params,
        )

    def test_missing_coordinates_return_400(self):
        self.assertEqual(
            self._post({"radius": "5"}).status_code,
            400,
        )

    def test_invalid_coordinates_return_400(self):
        response = self._post(
            {"latitude": "abc", "longitude": "72.8777"}
        )

        self.assertEqual(response.status_code, 400)

    def test_out_of_range_coordinates_return_400(self):
        response = self._post(
            {"latitude": "95", "longitude": "72.8777"}
        )

        self.assertEqual(response.status_code, 400)

    def test_radius_out_of_bounds_return_400(self):
        response = self._post(
            {"latitude": "19.0760", "longitude": "72.8777", "radius": "600"}
        )

        self.assertEqual(response.status_code, 400)

    def test_returns_nearby_events_sorted_by_distance(self):
        far_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Far Away Event",
            description="Too far.",
            mode=Event.Mode.OFFLINE,
            venue_name="Delhi Grounds",
            city="Delhi",
            latitude="28.6139",
            longitude="77.2090",
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            status=Event.Status.APPROVED,
        )

        response = self._post(
            {
                "latitude": "19.0760",
                "longitude": "72.8777",
                "radius": "10",
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            response.data["results"][0]["id"],
            self.event.id,
        )
        self.assertLess(
            response.data["results"][0]["distance_km"],
            5,
        )

        self.assertNotIn(far_event.id, {
            item["id"]
            for item in response.data["results"]
        })


class OrganizerAnalyticsTests(EventWorkflowTestCase):
    def test_non_organizer_is_forbidden(self):
        regular_user = User.objects.create_user(
            username="plain_user",
            email="plain_user@example.com",
            password="testpass123",
        )

        self.client.force_authenticate(user=regular_user)

        response = self.client.get(reverse("organizer-analytics"))

        self.assertEqual(response.status_code, 403)

    def test_analytics_counts_registrations_and_attendance(self):
        registered_user = User.objects.create_user(
            username="analytics_registered",
            email="analytics_registered@example.com",
            password="testpass123",
        )
        attended_user = User.objects.create_user(
            username="analytics_attended",
            email="analytics_attended@example.com",
            password="testpass123",
        )

        EventRegistration.objects.create(
            user=registered_user,
            event=self.event,
            status=EventRegistration.Status.REGISTERED,
        )
        EventRegistration.objects.create(
            user=attended_user,
            event=self.event,
            status=EventRegistration.Status.ATTENDED,
        )

        self.client.force_authenticate(user=self.organizer)

        response = self.client.get(reverse("organizer-analytics"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["events"]["total"], 1)
        self.assertEqual(
            response.data["registrations"]["total"],
            2,
        )
        self.assertEqual(
            response.data["registrations"]["attended"],
            1,
        )
        self.assertEqual(response.data["attendance_rate"], 50.0)

    def test_analytics_includes_trend_ratings_and_utilization(self):
        registered_user = User.objects.create_user(
            username="analytics_trend",
            email="analytics_trend@example.com",
            password="testpass123",
        )
        reviewer_user = User.objects.create_user(
            username="analytics_reviewer",
            email="analytics_reviewer@example.com",
            password="testpass123",
        )

        self.event.capacity = 10
        self.event.save(update_fields=["capacity"])

        EventRegistration.objects.create(
            user=registered_user,
            event=self.event,
            status=EventRegistration.Status.REGISTERED,
        )

        Review.objects.create(
            user=registered_user,
            event=self.event,
            rating=5,
            comment="Amazing event.",
        )
        Review.objects.create(
            user=reviewer_user,
            event=self.event,
            rating=4,
            comment="Loved it.",
        )

        self.client.force_authenticate(user=self.organizer)

        response = self.client.get(reverse("organizer-analytics"))

        self.assertEqual(response.status_code, 200)

        event_entry = response.data["event_registrations"][0]

        self.assertEqual(event_entry["registration_count"], 1)
        self.assertEqual(event_entry["attended_count"], 0)
        self.assertEqual(event_entry["capacity"], 10)
        self.assertEqual(event_entry["utilization"], 10.0)

        self.assertEqual(len(response.data["registration_trend"]), 1)
        self.assertEqual(
            response.data["registration_trend"][0]["count"],
            1,
        )

        rating_counts = response.data["reviews"]["rating_counts"]
        self.assertEqual(rating_counts["5"], 1)
        self.assertEqual(rating_counts["4"], 1)
        self.assertEqual(rating_counts["1"], 0)


class DistanceCalculationTests(SimpleTestCase):
    def test_haversine_distance_mumbai_to_delhi(self):
        distance = calculate_distance_km(
            19.0760,
            72.8777,
            28.6139,
            77.2090,
        )

        self.assertGreater(distance, 1000)
        self.assertLess(distance, 1300)

    def test_zero_distance_for_same_point(self):
        distance = calculate_distance_km(
            19.0760,
            72.8777,
            19.0760,
            72.8777,
        )

        self.assertAlmostEqual(distance, 0, places=5)