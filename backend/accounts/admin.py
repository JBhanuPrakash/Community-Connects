from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import OrganizerProfile, User
from .models import EmailOTP, OrganizerProfile, User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "CommunityConnect Information",
            {
                "fields": (
                    "role",
                    "phone_number",
                    "city",
                    "bio",
                    "profile_image",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "CommunityConnect Information",
            {
                "fields": (
                    "email",
                    "role",
                    "phone_number",
                    "city",
                )
            },
        ),
    )

    list_display = (
        "id",
        "username",
        "email",
        "role",
        "city",
        "is_active",
        "is_staff",
    )


    list_display_links = (
        "username",
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "city",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
    )

@admin.register(OrganizerProfile)
class OrganizerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "organization_name",
        "user",
        "is_verified",
        "created_at",
    )

    list_filter = (
        "is_verified",
        "created_at",
    )

    search_fields = (
        "organization_name",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "purpose",
        "is_used",
        "attempts",
        "created_at",
        "expires_at",
    )

    list_filter = (
        "purpose",
        "is_used",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "otp_hash",
        "created_at",
    )