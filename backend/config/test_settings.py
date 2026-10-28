"""Test-only settings with fast password hashing and in-memory email.

Run the suite with:
    python manage.py test --settings=config.test_settings --keepdb

PBKDF2 (default, ~1.3s per user) is replaced with MD5 so the suite
finishes in seconds, and the real SMTP backend is replaced with the
in-memory locmem backend so tests never wait on (or reach) the network.
"""

from .settings import *  # noqa: F401,F403

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]