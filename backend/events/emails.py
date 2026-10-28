import logging

from django.conf import settings
from django.core.mail import send_mail


logger = logging.getLogger(__name__)


def send_event_approved_email(event):
    organizer = event.organizer

    if not organizer.email:
        return False

    subject = f"Event Approved - {event.title}"

    message = f"""
Hello {organizer.get_full_name() or organizer.username},

Good news!

Your event "{event.title}" has been approved by the CommunityConnect admin team.

Event Details
-------------------------
Event: {event.title}
Status: APPROVED
Start: {event.start_datetime.strftime("%d %B %Y, %I:%M %p")}

Your event is now visible to users on CommunityConnect.

You can manage your event from the Organizer Dashboard.

Thank you,
CommunityConnect Team
"""

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [organizer.email],
            fail_silently=False,
        )

        return True

    except Exception:
        logger.exception(
            "Failed to send approval email for event %s",
            event.id,
        )

        return False


def send_event_rejected_email(event):
    organizer = event.organizer

    if not organizer.email:
        return False

    subject = f"Event Rejected - {event.title}"

    rejection_reason = (
        event.rejection_reason
        or "No rejection reason was provided."
    )

    message = f"""
Hello {organizer.get_full_name() or organizer.username},

Your event "{event.title}" was not approved.

Event Details
-------------------------
Event: {event.title}
Status: REJECTED

Reason:
{rejection_reason}

You can edit the event and submit it again from your Organizer Dashboard.

Thank you,
CommunityConnect Team
"""

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [organizer.email],
            fail_silently=False,
        )

        return True

    except Exception:
        logger.exception(
            "Failed to send rejection email for event %s",
            event.id,
        )

        return False

def send_event_cancelled_email(event, user):
    if not user.email:
        return False

    subject = f"Event Cancelled - {event.title}"

    message = f"""
Hello {user.get_full_name() or user.username},

We are sorry to inform you that the event "{event.title}" has been cancelled by the organizer.

Event Details
-------------------------
Event: {event.title}
Original Date: {event.start_datetime.strftime("%d %B %Y, %I:%M %p")}
Location: {event.venue_name or "Online Event"}
City: {event.city or "Online"}

Your registration for this event is no longer valid.

Please check CommunityConnect for other upcoming events.

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
            "Failed to send cancellation email for event %s to user %s",
            event.id,
            user.id,
        )

        return False