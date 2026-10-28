from django.urls import path

from .views import (
    CancelRegistrationView,
    MyRegistrationsView,
    MySavedEventsView,
    RegisterForEventView,
    RemoveSavedEventView,
    SaveEventView,
    DownloadTicketPDFView,
    TicketDetailView,
    TicketQRCodeView,
    VerifyTicketView,
    MarkAttendanceView,
)


urlpatterns = [
    path(
        "",
        MyRegistrationsView.as_view(),
        name="my-registrations",
    ),
    path(
        "register/",
        RegisterForEventView.as_view(),
        name="register-for-event",
    ),
    path(
        "<int:pk>/cancel/",
        CancelRegistrationView.as_view(),
        name="cancel-registration",
    ),

    path(
        "saved/",
        MySavedEventsView.as_view(),
        name="my-saved-events",
    ),
    path(
        "saved/<int:event_id>/",
        SaveEventView.as_view(),
        name="save-event",
    ),
    path(
        "saved/<int:event_id>/remove/",
        RemoveSavedEventView.as_view(),
        name="remove-saved-event",
    ),
    path(
    "<int:pk>/ticket/",
    TicketDetailView.as_view(),
    name="ticket-detail",
    ),

    path(
        "<int:pk>/ticket/qr/",
        TicketQRCodeView.as_view(),
        name="ticket-qr",
    ),

    path(
        "<int:pk>/ticket/pdf/",
        DownloadTicketPDFView.as_view(),
        name="ticket-pdf",
    ),

    path(
        "tickets/verify/<uuid:ticket_code>/",
        VerifyTicketView.as_view(),
        name="verify-ticket",
    ),
    path(
        "tickets/<uuid:ticket_code>/attend/",
        MarkAttendanceView.as_view(),
        name="mark-attendance",
    ),

]