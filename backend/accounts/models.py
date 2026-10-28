from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):

    class Role(models.TextChoices):
        USER = "USER", "User"
        ORGANIZER = "ORGANIZER", "Organizer"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    bio = models.TextField(
        blank=True,
    )

    profile_image = models.ImageField(
        upload_to="profile_images/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    is_email_verified = models.BooleanField(default=False)

    token_version = models.PositiveIntegerField(default=0)

    def bump_token_version(self):
        self.token_version += 1
        self.save(update_fields=["token_version"])

    def __str__(self):
        return f"{self.username} - {self.role}"

class OrganizerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organizer_profile",
    )

    organization_name = models.CharField(
        max_length=200,
    )

    organization_description = models.TextField(
        blank=True,
    )

    website = models.URLField(
        blank=True,
    )

    address = models.TextField(
        blank=True,
    )

    verification_document = models.FileField(
        upload_to="organizer_documents/",
        blank=True,
        null=True,
    )

    is_verified = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )
    instagram_url = models.URLField(
        blank=True,
    )

    facebook_url = models.URLField(
        blank=True,
    )

    linkedin_url = models.URLField(
        blank=True,
    )

    twitter_url = models.URLField(
        blank=True,
    )

    youtube_url = models.URLField(
        blank=True,
    )

    whatsapp_url = models.URLField(
        blank=True,
    )

    telegram_url = models.URLField(
        blank=True,
    )


    def __str__(self):
        return self.organization_name

class OrganizationGalleryItem(models.Model):

    class MediaType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        VIDEO = "VIDEO", "Video"

    organizer_profile = models.ForeignKey(
        OrganizerProfile,
        on_delete=models.CASCADE,
        related_name="gallery_items",
    )

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.SET_NULL,
        related_name="organization_gallery_items",
        blank=True,
        null=True,
    )

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )

    image = models.ImageField(
        upload_to="organization_gallery/",
        blank=True,
        null=True,
    )

    video = models.FileField(
            upload_to="organization_gallery/videos/",
            blank=True,
            null=True,
    )

    video_url = models.URLField(
        blank=True,
    )

    caption = models.CharField(
        max_length=250,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.organizer_profile.organization_name} "
            f"- {self.media_type}"
        )

class EmailOTP(models.Model):
    class Purpose(models.TextChoices):
        EMAIL_VERIFICATION = (
            "EMAIL_VERIFICATION",
            "Email Verification",
        )
        PASSWORD_RESET = (
            "PASSWORD_RESET",
            "Password Reset",
        )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_otps",
    )

    purpose = models.CharField(
        max_length=30,
        choices=Purpose.choices,
    )

    otp_hash = models.CharField(max_length=128)

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    is_used = models.BooleanField(default=False)

    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.purpose}"   