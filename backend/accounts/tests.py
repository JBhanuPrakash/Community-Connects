import base64
import tempfile
from datetime import timedelta
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework.throttling import ScopedRateThrottle

from events.models import Category, Event

from .models import EmailOTP, OrganizationGalleryItem, OrganizerProfile

User = get_user_model()

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwC"
    "AAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
)
class AuthenticationFlowTestCase(APITestCase):
    def setUp(self):
        self.strong_password = "StrongP@ssword123"

        self.user = User.objects.create_user(
            username="flowuser",
            email="flowuser@example.com",
            password=self.strong_password,
        )

    def test_registration_rejects_weak_password(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "weakuser",
                "email": "weak@example.com",
                "first_name": "",
                "last_name": "",
                "phone_number": "",
                "city": "",
                "password": "password",
                "confirm_password": "password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    @mock.patch("accounts.utils.generate_otp", return_value="654321")
    def test_forgot_and_reset_password_flow(
        self,
        mock_otp,
    ):
        response = self.client.post(
            "/api/auth/forgot-password/",
            {"email": self.user.email},
        )

        self.assertEqual(response.status_code, 200)

        response = self.client.post(
            "/api/auth/reset-password/",
            {
                "email": self.user.email,
                "otp": "654321",
                "new_password": "NewStrongP@ss123",
                "confirm_new_password": "NewStrongP@ss123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.user.refresh_from_db()
        self.assertTrue(
            self.user.check_password("NewStrongP@ss123")
        )

    @mock.patch("accounts.utils.generate_otp", return_value="654321")
    def test_reset_password_rejects_wrong_otp(self, mock_otp):
        self.client.post(
            "/api/auth/forgot-password/",
            {"email": self.user.email},
        )

        response = self.client.post(
            "/api/auth/reset-password/",
            {
                "email": self.user.email,
                "otp": "000000",
                "new_password": "NewStrongP@ss123",
                "confirm_new_password": "NewStrongP@ss123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_forgot_password_hides_unknown_email(self):
        response = self.client.post(
            "/api/auth/forgot-password/",
            {"email": "missing@example.com"},
        )

        self.assertEqual(response.status_code, 200)

    @mock.patch("accounts.utils.generate_otp", return_value="112233")
    def test_email_change_invalidates_verification_and_sends_otp(
        self,
        mock_otp,
    ):
        self.user.is_email_verified = True
        self.user.save(update_fields=["is_email_verified"])

        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/auth/profile/",
            {"email": "newflow@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.user.refresh_from_db()
        self.assertFalse(self.user.is_email_verified)
        self.assertEqual(
            self.user.email,
            "newflow@example.com",
        )

        verify_response = self.client.post(
            "/api/auth/email/verify-otp/",
            {"otp": "112233"},
            format="json",
        )

        self.assertEqual(verify_response.status_code, 200)

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)

    def test_password_change_invalidates_previous_tokens(self):
        login_response = self.client.post(
            "/api/auth/login/",
            {
                "username": self.user.username,
                "password": self.strong_password,
            },
            format="json",
        )

        self.assertEqual(login_response.status_code, 200)

        access_token = login_response.data["access"]

        client = APIClient()
        client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )

        profile_response = client.get("/api/auth/profile/")
        self.assertEqual(profile_response.status_code, 200)

        change_response = client.post(
            "/api/auth/change-password/",
            {
                "current_password": self.strong_password,
                "new_password": "ChangedP@ss123",
                "confirm_new_password": "ChangedP@ss123",
            },
            format="json",
        )

        self.assertEqual(change_response.status_code, 200)

        revoked_response = client.get("/api/auth/profile/")
        self.assertEqual(revoked_response.status_code, 401)


class OrganizerGalleryUploadTests(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            username="galorg",
            email="galorg@example.com",
            password="StrongP@ssword123",
        )
        self.organizer.role = User.Role.ORGANIZER
        self.organizer.save(update_fields=["role"])

        self.client.force_authenticate(user=self.organizer)

    def test_video_file_can_be_uploaded(self):
        video = SimpleUploadedFile(
            "clip.mp4",
            b"fake-video-bytes",
            content_type="video/mp4",
        )

        response = self.client.post(
            "/api/auth/organizer/gallery/",
            {
                "media_type": "VIDEO",
                "video": video,
                "caption": "Event highlights",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["video"])

    def test_video_url_can_be_provided(self):
        response = self.client.post(
            "/api/auth/organizer/gallery/",
            {
                "media_type": "VIDEO",
                "video_url": "https://youtube.com/watch?v=abc123",
                "caption": "Watch the recap",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data["video_url"],
            "https://youtube.com/watch?v=abc123",
        )


class LoginRateLimitTests(APITestCase):
    def setUp(self):
        self._original_login_rate = (
            ScopedRateThrottle.THROTTLE_RATES["login"]
        )

        ScopedRateThrottle.THROTTLE_RATES[
            "login"
        ] = "2/min"

        cache.clear()

        self.password = "StrongP@ssword123"

        self.user = User.objects.create_user(
            username="throttled",
            email="throttled@example.com",
            password=self.password,
        )

    def tearDown(self):
        ScopedRateThrottle.THROTTLE_RATES[
            "login"
        ] = self._original_login_rate

        cache.clear()

    def test_login_requests_are_rate_limited(self):
        first = self.client.post(
            "/api/auth/login/",
            {
                "username": "throttled",
                "password": self.password,
            },
        )

        self.assertEqual(first.status_code, 200)

        second = self.client.post(
            "/api/auth/login/",
            {
                "username": "throttled",
                "password": "WrongP@ssword1",
            },
        )

        self.assertEqual(second.status_code, 400)

        third = self.client.post(
            "/api/auth/login/",
            {
                "username": "throttled",
                "password": "WrongP@ssword1",
            },
        )

        self.assertEqual(third.status_code, 429)


class AdminToggleUserStatusTests(APITestCase):
    def setUp(self):
        self.password = "StrongP@ssword123"

        self.superuser = User.objects.create_superuser(
            username="superboss",
            email="superboss@example.com",
            password=self.password,
        )

        self.admin_one = User.objects.create_user(
            username="adminone",
            email="adminone@example.com",
            password=self.password,
        )
        self.admin_one.role = User.Role.ADMIN
        self.admin_one.save(update_fields=["role"])

        self.admin_two = User.objects.create_user(
            username="admintwo",
            email="admintwo@example.com",
            password=self.password,
        )
        self.admin_two.role = User.Role.ADMIN
        self.admin_two.save(update_fields=["role"])

        self.regular = User.objects.create_user(
            username="regularuser",
            email="regular@example.com",
            password=self.password,
        )

    def test_admin_cannot_deactivate_another_admin(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_one)

        response = client.post(
            f"/api/auth/admin/users/{self.admin_two.id}/toggle-status/"
        )

        self.assertEqual(response.status_code, 403)
        self.admin_two.refresh_from_db()
        self.assertTrue(self.admin_two.is_active)

    def test_admin_can_deactivate_regular_user(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_one)

        response = client.post(
            f"/api/auth/admin/users/{self.regular.id}/toggle-status/"
        )

        self.assertEqual(response.status_code, 200)
        self.regular.refresh_from_db()
        self.assertFalse(self.regular.is_active)

    def test_superuser_can_deactivate_another_admin(self):
        client = APIClient()
        client.force_authenticate(user=self.superuser)

        response = client.post(
            f"/api/auth/admin/users/{self.admin_two.id}/toggle-status/"
        )

        self.assertEqual(response.status_code, 200)
        self.admin_two.refresh_from_db()
        self.assertFalse(self.admin_two.is_active)

    def test_admin_cannot_deactivate_self(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_one)

        response = client.post(
            f"/api/auth/admin/users/{self.admin_one.id}/toggle-status/"
        )

        self.assertEqual(response.status_code, 400)


GALLERY_MEDIA_ROOT = tempfile.mkdtemp(prefix="cc-gallery-test-")


@override_settings(MEDIA_ROOT=GALLERY_MEDIA_ROOT)
class GalleryFixtureTestCase(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            username="gal_org",
            email="gal_org@example.com",
            password="testpass123",
        )
        self.organizer.role = User.Role.ORGANIZER
        self.organizer.save(update_fields=["role"])

        self.profile = OrganizerProfile.objects.create(
            user=self.organizer,
            organization_name="Test Org",
        )

        self.other_organizer = User.objects.create_user(
            username="gal_org2",
            email="gal_org2@example.com",
            password="testpass123",
        )
        self.other_organizer.role = User.Role.ORGANIZER
        self.other_organizer.save(update_fields=["role"])

        self.other_profile = OrganizerProfile.objects.create(
            user=self.other_organizer,
            organization_name="Other Org",
        )

        self.regular = User.objects.create_user(
            username="gal_user",
            email="gal_user@example.com",
            password="testpass123",
        )

        self.category = Category.objects.create(
            name="Gallery"
        )

        self.event = Event.objects.create(
            organizer=self.organizer,
            category=self.category,
            title="Gallery Event",
            description="For gallery testing.",
            mode=Event.Mode.OFFLINE,
            venue_name="Community Hall",
            city="Delhi",
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=2),
            status=Event.Status.APPROVED,
        )

        self.other_event = Event.objects.create(
            organizer=self.other_organizer,
            category=self.category,
            title="Other Organizer Event",
            description="Belongs to someone else.",
            mode=Event.Mode.ONLINE,
            online_event_url="https://example.com/other",
            start_datetime=timezone.now() + timedelta(days=3),
            end_datetime=timezone.now() + timedelta(days=4),
            status=Event.Status.APPROVED,
        )

        self.item = OrganizationGalleryItem.objects.create(
            organizer_profile=self.profile,
            event=self.event,
            media_type=OrganizationGalleryItem.MediaType.IMAGE,
            image=SimpleUploadedFile(
                "banner.png",
                TINY_PNG,
                content_type="image/png",
            ),
            caption="Main banner",
        )

    def _client(self, user=None):
        client = APIClient()

        if user is not None:
            client.force_authenticate(user=user)

        return client

    def _image_upload(self):
        return SimpleUploadedFile(
            "event-image.png",
            TINY_PNG,
            content_type="image/png",
        )


class PublicOrganizationGalleryTests(GalleryFixtureTestCase):
    def test_lists_organizer_items_publicly(self):
        response = self._client().get(
            reverse(
                "public-organization-gallery",
                kwargs={"organizer_id": self.organizer.id},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["caption"], "Main banner")
        self.assertIsNotNone(response.data[0]["image"])

    def test_returns_empty_for_organizer_without_items(self):
        response = self._client().get(
            reverse(
                "public-organization-gallery",
                kwargs={"organizer_id": self.other_organizer.id},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_does_not_leak_other_organizers_items(self):
        OrganizationGalleryItem.objects.create(
            organizer_profile=self.other_profile,
            media_type=OrganizationGalleryItem.MediaType.IMAGE,
            image=SimpleUploadedFile(
                "other.png",
                TINY_PNG,
                content_type="image/png",
            ),
        )

        response = self._client().get(
            reverse(
                "public-organization-gallery",
                kwargs={"organizer_id": self.organizer.id},
            ),
        )

        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["organizer_profile"], self.profile.id)

    def test_returns_empty_for_non_organizer_user(self):
        response = self._client().get(
            reverse(
                "public-organization-gallery",
                kwargs={"organizer_id": self.regular.id},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class OrganizerGalleryListCreateTests(GalleryFixtureTestCase):
    def test_organizer_lists_own_items_only(self):
        OrganizationGalleryItem.objects.create(
            organizer_profile=self.other_profile,
            media_type=OrganizationGalleryItem.MediaType.IMAGE,
            image=SimpleUploadedFile(
                "other.png",
                TINY_PNG,
                content_type="image/png",
            ),
        )

        response = self._client(self.organizer).get(
            reverse("organizer-gallery"),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["caption"], "Main banner")

    def test_regular_user_gets_empty_list(self):
        response = self._client(self.regular).get(
            reverse("organizer-gallery"),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_requires_authentication(self):
        response = self._client().get(reverse("organizer-gallery"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_organizer_can_create_image_item(self):
        response = self._client(self.organizer).post(
            reverse("organizer-gallery"),
            {
                "media_type": "IMAGE",
                "event": self.event.id,
                "image": self._image_upload(),
                "caption": "After event photo",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["caption"], "After event photo")
        self.assertIsNotNone(response.data["image"])

    def test_image_item_requires_uploaded_file(self):
        response = self._client(self.organizer).post(
            reverse("organizer-gallery"),
            {
                "media_type": "IMAGE",
                "event": self.event.id,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)

    def test_organizer_can_create_video_item_from_url(self):
        response = self._client(self.organizer).post(
            reverse("organizer-gallery"),
            {
                "media_type": "VIDEO",
                "event": self.event.id,
                "video_url": "https://example.com/reel.mp4",
                "caption": "Event recap",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["video_url"],
            "https://example.com/reel.mp4",
        )

    def test_video_item_requires_video_or_url(self):
        response = self._client(self.organizer).post(
            reverse("organizer-gallery"),
            {
                "media_type": "VIDEO",
                "event": self.event.id,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("video", response.data)

    def test_regular_user_cannot_create_item(self):
        response = self._client(self.regular).post(
            reverse("organizer-gallery"),
            {
                "media_type": "IMAGE",
                "image": self._image_upload(),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_attach_another_organizers_event(self):
        response = self._client(self.organizer).post(
            reverse("organizer-gallery"),
            {
                "media_type": "IMAGE",
                "event": self.other_event.id,
                "image": self._image_upload(),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "own events",
            response.data["event"],
        )


class OrganizerGalleryDeleteTests(GalleryFixtureTestCase):
    def test_organizer_can_delete_own_item(self):
        response = self._client(self.organizer).delete(
            reverse(
                "organizer-gallery-delete",
                args=[self.item.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            OrganizationGalleryItem.objects.filter(
                id=self.item.id,
            ).exists()
        )

    def test_cannot_delete_another_organizers_item(self):
        other_item = OrganizationGalleryItem.objects.create(
            organizer_profile=self.other_profile,
            media_type=OrganizationGalleryItem.MediaType.IMAGE,
            image=SimpleUploadedFile(
                "other.png",
                TINY_PNG,
                content_type="image/png",
            ),
        )

        response = self._client(self.organizer).delete(
            reverse(
                "organizer-gallery-delete",
                args=[other_item.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(
            OrganizationGalleryItem.objects.filter(
                id=other_item.id,
            ).exists()
        )

    def test_regular_user_cannot_delete_item(self):
        response = self._client(self.regular).delete(
            reverse(
                "organizer-gallery-delete",
                args=[self.item.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_requires_authentication(self):
        response = self._client().delete(
            reverse(
                "organizer-gallery-delete",
                args=[self.item.id],
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
