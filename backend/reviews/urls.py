from django.urls import path

from .views import (
    EventReviewListCreateView,
    EventReviewSummaryView,
    OrganizerReplyView,
    ReviewDetailView,
)


urlpatterns = [
    path(
        "events/<int:event_id>/",
        EventReviewListCreateView.as_view(),
        name="event-review-list-create",
    ),

    path(
        "events/<int:event_id>/summary/",
        EventReviewSummaryView.as_view(),
        name="event-review-summary",
    ),

    path(
        "<int:pk>/",
        ReviewDetailView.as_view(),
        name="review-detail",
    ),

    path(
        "<int:review_id>/reply/",
        OrganizerReplyView.as_view(),
        name="organizer-review-reply",
    ),
]