from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        REGISTRATION = (
            "REGISTRATION",
            "Registration",
        )

        REGISTRATION_CANCELLED = (
            "REGISTRATION_CANCELLED",
            "Registration Cancelled",
        )

        EVENT_APPROVED = (
            "EVENT_APPROVED",
            "Event Approved",
        )

        EVENT_REJECTED = (
            "EVENT_REJECTED",
            "Event Rejected",
        )

        EVENT_CANCELLED = (
            "EVENT_CANCELLED",
            "Event Cancelled",
        )

        REVIEW_REPLY = (
            "REVIEW_REPLY",
            "Review Reply",
        )

        ATTENDANCE = (
            "ATTENDANCE",
            "Attendance",
        )

        GENERAL = (
            "GENERAL",
            "General",
        )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=40,
        choices=Type.choices,
        default=Type.GENERAL,
    )

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    target_url = models.CharField(
        max_length=500,
        blank=True,
    )

    is_read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    read_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.recipient.username} - "
            f"{self.title}"
        )