import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailOTP


OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS = 5


def generate_otp():
    return f"{secrets.randbelow(1_000_000):06d}"


def create_and_send_otp(user, purpose):
    EmailOTP.objects.filter(
        user=user,
        purpose=purpose,
        is_used=False,
    ).update(is_used=True)

    otp = generate_otp()

    otp_record = EmailOTP.objects.create(
        user=user,
        purpose=purpose,
        otp_hash=make_password(otp),
        expires_at=timezone.now()
        + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )

    if purpose == EmailOTP.Purpose.EMAIL_VERIFICATION:
        subject = "Verify your CommunityConnect email"
        message = (
            f"Hello {user.username},\n\n"
            f"Your email verification OTP is: {otp}\n\n"
            f"This OTP expires in {OTP_EXPIRY_MINUTES} minutes.\n"
            "Do not share this OTP with anyone."
        )
    else:
        subject = "Reset your CommunityConnect password"
        message = (
            f"Hello {user.username},\n\n"
            f"Your password reset OTP is: {otp}\n\n"
            f"This OTP expires in {OTP_EXPIRY_MINUTES} minutes.\n"
            "Do not share this OTP with anyone."
        )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return otp_record