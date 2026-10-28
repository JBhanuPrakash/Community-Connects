import logging

from django.conf import settings
from django.core.mail import send_mail


logger = logging.getLogger(__name__)


def send_registration_confirmation_email(registration):
    user = registration.user
    event = registration.event

    if not user.email:
        return False

    subject = f"Registration Confirmed - {event.title}"

    event_date = event.start_datetime.strftime(
        "%d %B %Y, %I:%M %p"
    )

    if event.mode == "ONLINE":
        location = "Online Event"
    else:
        location = f"{event.venue_name}, {event.city}"

    message = f"""
Hello {user.get_full_name() or user.username},

Your registration for "{event.title}" has been confirmed.

Event Details
-------------------------
Event: {event.title}
Date & Time: {event_date}
Location: {location}
Ticket Code: {registration.ticket_code}

Please keep your ticket/QR code available when attending the event.

Thank you,
CommunityConnect Team
"""

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return True

    except Exception:
        logger.exception(
            "Failed to send registration email "
            "for registration %s",
            registration.id,
        )

        return False