from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from events.models import Event


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_reviews",
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="reviews",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )

    comment = models.TextField()

    organizer_reply = models.TextField(
        blank=True,
    )

    replied_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["user", "event"],
                name="unique_user_event_review",
            )
        ]

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.event.title} - "
            f"{self.rating}"
        )