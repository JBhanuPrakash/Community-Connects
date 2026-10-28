from django.contrib import admin

from .models import EventRegistration, SavedEvent


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "event",
        "status",
        "registered_at",
        "cancelled_at",
    )

    list_filter = (
        "status",
        "event",
        "registered_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "event__title",
    )

    readonly_fields = (
        "registered_at",
        "cancelled_at",
    )


@admin.register(SavedEvent)
class SavedEventAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "event",
        "saved_at",
    )

    list_filter = (
        "saved_at",
        "event",
    )

    search_fields = (
        "user__username",
        "user__email",
        "event__title",
    )

    readonly_fields = (
        "saved_at",
    )