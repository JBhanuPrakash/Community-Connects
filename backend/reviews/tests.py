from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from events.models import Category, Event
from notifications.models import Notification
from registrations.models import EventRegistration
from reviews.models import Review


class ReviewFixtureTestCase(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            username="review_org",
            email="review_org@example.com",
            password="testpass123",
        )
        self.organizer.role = User.Role.ORGANIZER
        self.organizer.save(update_fields=["role"])

        self.other_organizer = User.objects.create_user(
            username="review_org2",
            email="review_org2@example.com",
            password="testpass123",
        )
        self.other_organizer.role = User.Role.ORGANIZER
        self.other_organizer.save(update_fields=["role"])

        self.user = User.objects.create_user(
            username="reviewer",
            email="reviewer@example.com",
            password="testpass123",
        )
        self.user.is_email_verified = True
        self.user.save(update_fields=["is_email_verified"])

        self.other_user = User.objects.create_user(
            username="reviewer2",
            email="reviewer2@example.com",
            password="testpass123",
        )
        self.other_user.is_email_verified = True
        self.other_user.save(update_fields=["is_email_verified"])

        self.category = Category.objects.create(
            name="Reviews"
        )

        self.past_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Reviewable Event",
            description="Happened already.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/past",
            start_datetime=timezone.now() - timedelta(days=3),
            end_datetime=timezone.now() - timedelta(days=2),
            status=Event.Status.APPROVED,
        )

        self.future_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Future Event",
            description="Has not started yet.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/future",
            start_datetime=timezone.now() + timedelta(days=2),
            end_datetime=timezone.now() + timedelta(days=3),
            status=Event.Status.APPROVED,
        )

        self.pending_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Pending Event",
            description="Not approved yet.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/pending",
            start_datetime=timezone.now() - timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=1),
            status=Event.Status.PENDING,
        )

        EventRegistration.objects.create(
            user=self.user,
            event=self.past_event,
            status=EventRegistration.Status.REGISTERED,
        )

        self.review = Review.objects.create(
            user=self.user,
            event=self.past_event,
            rating=4,
            comment="A genuinely great community event.",
        )

    def _client(self, user=None):
        client = APIClient()

        if user is not None:
            client.force_authenticate(user=user)

        return client

    def _post_review(self, client, event_id, payload):
        return client.post(
            reverse(
                "event-review-list-create",
                args=[event_id],
            ),
            payload,
            format="json",
        )


class EventReviewListTests(ReviewFixtureTestCase):
    def test_lists_reviews_publicly(self):
        response = self._client().get(
            reverse(
                "event-review-list-create",
                args=[self.past_event.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["rating"], 4)
        self.assertEqual(response.data[0]["username"], "reviewer")

    def test_lists_only_reviews_for_the_event(self):
        second_event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Second Event",
            description="Another past event.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/second",
            start_datetime=timezone.now() - timedelta(days=5),
            end_datetime=timezone.now() - timedelta(days=4),
            status=Event.Status.APPROVED,
        )

        Review.objects.create(
            user=self.other_user,
            event=second_event,
            rating=5,
            comment="This other event was excellent as well.",
        )

        response = self._client().get(
            reverse(
                "event-review-list-create",
                args=[self.past_event.id],
            ),
        )

        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["event"], self.past_event.id)

    def test_create_requires_authentication(self):
        response = self._client().post(
            reverse(
                "event-review-list-create",
                args=[self.past_event.id],
            ),
            {
                "rating": 5,
                "comment": "Very good experience overall.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_registration_for_event(self):
        response = self._post_review(
            self._client(self.other_user),
            self.past_event.id,
            {
                "rating": 5,
                "comment": "Wish I had been there.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "must register",
            response.data["detail"],
        )

    def test_organizers_cannot_review_events(self):
        response = self._post_review(
            self._client(self.organizer),
            self.past_event.id,
            {
                "rating": 5,
                "comment": "Legitimately one of the best events.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "Only regular users",
            response.data["detail"],
        )

    def test_cannot_review_unapproved_event(self):
        response = self._post_review(
            self._client(self.user),
            self.pending_event.id,
            {
                "rating": 5,
                "comment": "Should be rejected before it starts.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "Approved event not found",
            response.data["event"],
        )

    def test_cannot_review_before_event_starts(self):
        EventRegistration.objects.create(
            user=self.user,
            event=self.future_event,
            status=EventRegistration.Status.REGISTERED,
        )

        response = self._post_review(
            self._client(self.user),
            self.future_event.id,
            {
                "rating": 5,
                "comment": "Excited to attend this one later.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "after it has started",
            response.data["detail"],
        )

    def test_can_review_past_registered_event(self):
        new_user = User.objects.create_user(
            username="reviewer3",
            email="reviewer3@example.com",
            password="testpass123",
        )

        EventRegistration.objects.create(
            user=new_user,
            event=self.past_event,
            status=EventRegistration.Status.ATTENDED,
        )

        response = self._post_review(
            self._client(new_user),
            self.past_event.id,
            {
                "rating": 5,
                "comment": "Fantastic turnout and great speakers.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["rating"], 5)
        self.assertEqual(response.data["username"], "reviewer3")

    def test_only_one_review_per_user_per_event(self):
        response = self._post_review(
            self._client(self.user),
            self.past_event.id,
            {
                "rating": 2,
                "comment": "Second attempt should not be allowed.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "already reviewed",
            response.data["detail"],
        )

    def test_rejects_comment_shorter_than_five_characters(self):
        EventRegistration.objects.create(
            user=self.other_user,
            event=self.past_event,
            status=EventRegistration.Status.REGISTERED,
        )

        response = self._post_review(
            self._client(self.other_user),
            self.past_event.id,
            {
                "rating": 4,
                "comment": "Ok",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("at least 5 characters", response.data["comment"][0])

    def test_rejects_rating_outside_range(self):
        response = self._post_review(
            self._client(self.other_user),
            self.past_event.id,
            {
                "rating": 6,
                "comment": "Six stars feels generous but honest.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EventReviewSummaryTests(ReviewFixtureTestCase):
    def test_returns_average_count_and_breakdown(self):
        EventRegistration.objects.create(
            user=self.other_user,
            event=self.past_event,
            status=EventRegistration.Status.REGISTERED,
        )

        Review.objects.create(
            user=self.other_user,
            event=self.past_event,
            rating=2,
            comment="Not as good as advertised honestly.",
        )

        response = self._client().get(
            reverse(
                "event-review-summary",
                args=[self.past_event.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["average_rating"], 3.0)
        self.assertEqual(response.data["review_count"], 2)
        self.assertEqual(response.data["rating_breakdown"]["4"], 1)
        self.assertEqual(response.data["rating_breakdown"]["2"], 1)
        self.assertEqual(response.data["rating_breakdown"]["5"], 0)

    def test_returns_zeros_for_event_without_reviews(self):
        response = self._client().get(
            reverse(
                "event-review-summary",
                args=[self.future_event.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["average_rating"], 0)
        self.assertEqual(response.data["review_count"], 0)


class ReviewDetailTests(ReviewFixtureTestCase):
    def test_owner_can_update_own_review(self):
        response = self._client(self.user).patch(
            reverse(
                "review-detail",
                args=[self.review.id],
            ),
            {
                "rating": 5,
                "comment": "Updating to a perfect score.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rating"], 5)
        self.assertTrue(response.data["is_owner"])

    def test_owner_can_delete_own_review(self):
        response = self._client(self.user).delete(
            reverse(
                "review-detail",
                args=[self.review.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Review.objects.filter(id=self.review.id).exists()
        )

    def test_non_owner_cannot_update_review(self):
        response = self._client(self.other_user).patch(
            reverse(
                "review-detail",
                args=[self.review.id],
            ),
            {
                "rating": 1,
                "comment": "Trying to game the rating.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_owner_cannot_delete_review(self):
        response = self._client(self.other_user).delete(
            reverse(
                "review-detail",
                args=[self.review.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_requires_authentication(self):
        response = self._client().delete(
            reverse(
                "review-detail",
                args=[self.review.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OrganizerReplyTests(ReviewFixtureTestCase):
    def test_event_organizer_can_reply(self):
        response = self._client(self.organizer).post(
            reverse(
                "organizer-review-reply",
                args=[self.review.id],
            ),
            {
                "reply": "Thank you for the kind words!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["review"]["organizer_reply"],
            "Thank you for the kind words!",
        )
        self.assertIsNotNone(response.data["review"]["replied_at"])

    def test_reply_creates_notification_for_reviewer(self):
        self._client(self.organizer).post(
            reverse(
                "organizer-review-reply",
                args=[self.review.id],
            ),
            {
                "reply": "Appreciate your feedback!",
            },
            format="json",
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user,
                notification_type=Notification.Type.REVIEW_REPLY,
            ).exists()
        )

    def test_other_organizer_cannot_reply(self):
        response = self._client(self.other_organizer).post(
            reverse(
                "organizer-review-reply",
                args=[self.review.id],
            ),
            {
                "reply": "This is not my event.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_regular_user_cannot_reply(self):
        response = self._client(self.other_user).post(
            reverse(
                "organizer-review-reply",
                args=[self.review.id],
            ),
            {
                "reply": "Impersonating an organizer.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reply_requires_non_blank_text(self):
        response = self._client(self.organizer).post(
            reverse(
                "organizer-review-reply",
                args=[self.review.id],
            ),
            {
                "reply": "",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)