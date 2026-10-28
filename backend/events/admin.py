from django.contrib import admin

from .models import Category, Event


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
        "description",
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "organizer",
        "category",
        "mode",
        "city",
        "start_datetime",
        "status",
        "is_featured",
    )

    list_filter = (
        "status",
        "mode",
        "category",
        "city",
        "is_featured",
    )

    search_fields = (
        "title",
        "description",
        "organizer__username",
        "city",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )