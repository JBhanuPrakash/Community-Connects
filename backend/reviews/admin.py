from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "event",
        "rating",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "rating",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "event__title",
        "comment",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "replied_at",
    )