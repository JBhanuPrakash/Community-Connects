from django.urls import path

from .views import (
    AdminDashboardStatsView,
    AdminEventDetailView,
    AdminEventListView,
    AdminPendingEventListView,
    ApproveEventView,
    CancelOrganizerEventView,
    CategoryListView,
    EventDetailView,
    EventListCreateView,
    OrganizerDashboardStatsView,
    OrganizerEventDetailView,
    OrganizerEventListView,
    OrganizerEventParticipantsView,
    RejectEventView,
    ToggleFeaturedEventView,
    NearbyEventListView,
    AdminAnalyticsView,
    OrganizerAnalyticsView,
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
)


urlpatterns = [
    path(
        "categories/",
        CategoryListView.as_view(),
        name="category-list",
    ),


    

    path(
        "organizer/dashboard/",
        OrganizerDashboardStatsView.as_view(),
        name="organizer-dashboard",
    ),

    path(
        "organizer/events/",
        OrganizerEventListView.as_view(),
        name="organizer-events",
    ),

    path(
        "organizer/events/<int:pk>/",
        OrganizerEventDetailView.as_view(),
        name="organizer-event-detail",
    ),

    path(
        "organizer/events/<int:event_id>/participants/",
        OrganizerEventParticipantsView.as_view(),
        name="organizer-event-participants",
    ),

    path(
        "organizer/events/<int:event_id>/cancel/",
        CancelOrganizerEventView.as_view(),
        name="organizer-event-cancel",
    ),

    path(
        "admin/dashboard/",
        AdminDashboardStatsView.as_view(),
        name="admin-dashboard",
    ),

    path(
        "admin/events/",
        AdminEventListView.as_view(),
        name="admin-event-list",
    ),

    path(
        "admin/events/pending/",
        AdminPendingEventListView.as_view(),
        name="admin-pending-events",
    ),

    path(
        "admin/events/<int:pk>/",
        AdminEventDetailView.as_view(),
        name="admin-event-detail",
    ),

    path(
        "admin/events/<int:event_id>/approve/",
        ApproveEventView.as_view(),
        name="admin-event-approve",
    ),

    path(
        "admin/events/<int:event_id>/reject/",
        RejectEventView.as_view(),
        name="admin-event-reject",
    ),

    path(
        "admin/events/<int:event_id>/featured/",
        ToggleFeaturedEventView.as_view(),
        name="admin-event-featured",
    ),

    path(
        "events/nearby/",
        NearbyEventListView.as_view(),
        name="nearby-events",
    ),

    path(
        "events/",
        EventListCreateView.as_view(),
        name="event-list-create",
    ),

    path(
        "events/<int:pk>/",
        EventDetailView.as_view(),
        name="event-detail",
    ),

    path(
        "admin/analytics/",
        AdminAnalyticsView.as_view(),
        name="admin-analytics",
    ),
    path(
        "organizer/analytics/",
        OrganizerAnalyticsView.as_view(),
        name="organizer-analytics",
    ),
    path(
        "admin/categories/",
        AdminCategoryListCreateView.as_view(),
        name="admin-category-list-create",
    ),

    path(
        "admin/categories/<int:pk>/",
        AdminCategoryDetailView.as_view(),
        name="admin-category-detail",
    ),
]