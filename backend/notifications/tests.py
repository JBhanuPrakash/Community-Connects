from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from notifications.models import Notification
from notifications.utils import create_notification


class NotificationsFixtureTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notifuser",
            email="notifuser@example.com",
            password="testpass123",
        )

        self.other = User.objects.create_user(
            username="notifother",
            email="notifother@example.com",
            password="testpass123",
        )

        self.read_notification = create_notification(
            recipient=self.user,
            notification_type=Notification.Type.GENERAL,
            title="Read notice",
            message="Already seen.",
        )
        self.read_notification.is_read = True
        self.read_notification.save(update_fields=["is_read"])

        self.unread_notification = create_notification(
            recipient=self.user,
            notification_type=Notification.Type.EVENT_APPROVED,
            title="Unread notice",
            message="Not seen yet.",
        )

        create_notification(
            recipient=self.other,
            notification_type=Notification.Type.GENERAL,
            title="Private notice",
            message="Should not leak.",
        )

    def _client(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client


class NotificationListViewTests(NotificationsFixtureTestCase):
    def test_list_requires_authentication(self):
        response = self.client.get(reverse("notification-list"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_lists_only_own_notifications(self):
        response = self._client(self.user).get(
            reverse("notification-list"),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        titles = [
            item["title"] for item in response.data
        ]

        self.assertIn("Unread notice", titles)
        self.assertIn("Read notice", titles)
        self.assertNotIn("Private notice", titles)

    def test_lists_newest_first(self):
        response = self._client(self.user).get(
            reverse("notification-list"),
        )

        self.assertGreater(
            response.data[0]["created_at"],
            response.data[1]["created_at"],
        )

    def test_unread_filter(self):
        response = self._client(self.user).get(
            reverse("notification-list"),
            {"unread": "true"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Unread notice")
        self.assertFalse(response.data[0]["is_read"])

    def test_read_notifications_excluded_when_filtering(self):
        response = self._client(self.user).get(
            reverse("notification-list"),
            {"unread": "1"},
        )

        self.assertEqual(
            [item["is_read"] for item in response.data],
            [False],
        )


class UnreadNotificationCountViewTests(NotificationsFixtureTestCase):
    def test_returns_unread_count_only(self):
        response = self._client(self.user).get(
            reverse("notification-unread-count"),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["unread_count"],
            1,
        )

    def test_requires_authentication(self):
        response = self.client.get(
            reverse("notification-unread-count"),
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MarkNotificationReadViewTests(NotificationsFixtureTestCase):
    def test_marks_own_notification_as_read(self):
        notification_id = self.unread_notification.id

        response = self._client(self.user).post(
            reverse(
                "notification-read",
                args=[notification_id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["notification"]["is_read"])
        self.assertIsNotNone(response.data["notification"]["read_at"])

        self.unread_notification.refresh_from_db()
        self.assertTrue(self.unread_notification.is_read)

    def test_marking_already_read_is_idempotent(self):
        notification_id = self.read_notification.id

        response = self._client(self.user).post(
            reverse(
                "notification-read",
                args=[notification_id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_mark_another_users_notification(self):
        other_notification = Notification.objects.get(
            recipient=self.other,
        )

        response = self._client(self.user).post(
            reverse(
                "notification-read",
                args=[other_notification.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_requires_authentication(self):
        response = self.client.post(
            reverse(
                "notification-read",
                args=[self.unread_notification.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MarkAllNotificationsReadViewTests(NotificationsFixtureTestCase):
    def test_marks_all_own_unread_as_read(self):
        response = self._client(self.user).post(
            reverse("notification-read-all"),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(
            Notification.objects.filter(
                recipient=self.user,
                is_read=False,
            ).count(),
            0,
        )

    def test_does_not_affect_other_users(self):
        self._client(self.user).post(
            reverse("notification-read-all"),
        )

        other_notification = Notification.objects.get(
            recipient=self.other,
            title="Private notice",
        )

        self.assertFalse(other_notification.is_read)

    def test_requires_authentication(self):
        response = self.client.post(reverse("notification-read-all"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DeleteNotificationViewTests(NotificationsFixtureTestCase):
    def test_deletes_own_notification(self):
        notification_id = self.unread_notification.id

        response = self._client(self.user).delete(
            reverse(
                "notification-delete",
                args=[notification_id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Notification.objects.filter(
                id=notification_id,
            ).exists()
        )

    def test_cannot_delete_another_users_notification(self):
        other_notification = Notification.objects.get(
            recipient=self.other,
        )

        response = self._client(self.user).delete(
            reverse(
                "notification-delete",
                args=[other_notification.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(
            Notification.objects.filter(
                id=other_notification.id,
            ).exists()
        )

    def test_requires_authentication(self):
        response = self.client.delete(
            reverse(
                "notification-delete",
                args=[self.unread_notification.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)