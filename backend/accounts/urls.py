from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    OrganizerProfileView,
    ProfileView,
    RegisterView,
    ResetPasswordView,
    SendVerificationOTPView,
    VerifyEmailOTPView,
    PublicOrganizerProfileView,
    OrganizerGalleryDeleteView,
    OrganizerGalleryListCreateView,
    PublicOrganizationGalleryView,
    AdminUserListView,
    AdminToggleUserStatusView,
)


urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    path(
        "profile/",
        ProfileView.as_view(),
        name="profile",
    ),

    path(
        "organizer-profile/",
        OrganizerProfileView.as_view(),
        name="organizer-profile",
    ),

    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),

    path(
    "email/send-otp/",
    SendVerificationOTPView.as_view(),
    name="send-verification-otp",
),

path(
    "email/verify-otp/",
    VerifyEmailOTPView.as_view(),
    name="verify-email-otp",
),

path(
    "forgot-password/",
    ForgotPasswordView.as_view(),
    name="forgot-password",
),

path(
    "reset-password/",
    ResetPasswordView.as_view(),
    name="reset-password",
),
path(
    "organizers/<int:organizer_id>/profile/",
    PublicOrganizerProfileView.as_view(),
    name="public-organizer-profile",
),
path(
    "organizer/gallery/",
    OrganizerGalleryListCreateView.as_view(),
    name="organizer-gallery",
),

path(
    "organizer/gallery/<int:pk>/",
    OrganizerGalleryDeleteView.as_view(),
    name="organizer-gallery-delete",
),

path(
    "organizers/<int:organizer_id>/gallery/",
    PublicOrganizationGalleryView.as_view(),
    name="public-organization-gallery",
),
path(
    "admin/users/",
    AdminUserListView.as_view(),
    name="admin-users",
),

path(
    "admin/users/<int:user_id>/toggle-status/",
    AdminToggleUserStatusView.as_view(),
    name="admin-user-toggle-status",
),
]