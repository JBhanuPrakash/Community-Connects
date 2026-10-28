import logging

from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from .models import (
    OrganizerProfile,
    OrganizationGalleryItem,
)

from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import OrganizerProfile
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    OrganizerProfileSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    SendVerificationOTPSerializer,
    UserProfileSerializer,
    VerifyEmailOTPSerializer,
    PublicOrganizerProfileSerializer,
    OrganizationGalleryItemSerializer,
    AdminUserSerializer,
)

logger = logging.getLogger("accounts")


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def perform_create(self, serializer):
        user = serializer.save()

        logger.info(
            "New account registered for user pk=%s",
            user.id,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            logger.warning(
                "Failed login attempt from IP %s",
                request.META.get("REMOTE_ADDR", "unknown"),
            )

            raise

        logger.info(
            "Successful login for user pk=%s",
            serializer.validated_data["user"]["id"],
        )

        return Response(
            {
                "message": "Login successful.",
                **serializer.validated_data,
            },
            status=status.HTTP_200_OK,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class OrganizerProfileView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = OrganizerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user

        if user.role != "ORGANIZER":
            self.permission_denied(
                self.request,
                message="Only organizers have organizer profiles.",
            )

        profile, _ = OrganizerProfile.objects.get_or_create(
            user=user,
            defaults={
                "organization_name":
                    f"{user.username}'s Organization"
            },
        )

        return profile

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password"

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(
            serializer.validated_data["new_password"]
        )
        user.save(update_fields=["password"])
        user.bump_token_version()

        logger.info(
            "Password changed for user pk=%s",
            user.id,
        )

        return Response(
            {
                "message": "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )

class SendVerificationOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        serializer = SendVerificationOTPSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        logger.info(
            "Verification OTP sent for user pk=%s",
            request.user.id,
        )

        return Response(
            {
                "message":
                    "Verification OTP sent successfully."
            },
            status=status.HTTP_200_OK,
        )


class VerifyEmailOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        serializer = VerifyEmailOTPSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        otp_record = serializer.validated_data["otp_record"]
        user = request.user

        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])

        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])

        logger.info(
            "Email verified for user pk=%s",
            user.id,
        )

        return Response(
            {
                "message": "Email verified successfully."
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = ForgotPasswordSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        logger.info(
            "Password reset OTP requested from IP %s",
            request.META.get("REMOTE_ADDR", "unknown"),
        )

        return Response(
            {
                "message":
                    "If an account exists for this email, "
                    "a password-reset OTP has been sent."
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = ResetPasswordSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        otp_record = serializer.validated_data[
            "otp_record"
        ]

        user.set_password(
            serializer.validated_data["new_password"]
        )
        user.save(update_fields=["password"])
        user.bump_token_version()

        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])

        logger.info(
            "Password reset completed for user pk=%s",
            user.id,
        )

        return Response(
            {
                "message":
                    "Password reset successfully. "
                    "You can now log in."
            },
            status=status.HTTP_200_OK,
        )

class PublicOrganizerProfileView(
    generics.RetrieveAPIView
):
    serializer_class = (
        PublicOrganizerProfileSerializer
    )

    permission_classes = [
        permissions.AllowAny,
    ]

    lookup_url_kwarg = "organizer_id"

    def get_object(self):
        organizer_id = self.kwargs[
            "organizer_id"
        ]

        try:
            return (
                OrganizerProfile.objects
                .select_related("user")
                .get(
                    user_id=organizer_id,
                    user__role="ORGANIZER",
                )
            )

        except OrganizerProfile.DoesNotExist:
            from rest_framework.exceptions import (
                NotFound,
            )

            raise NotFound(
                "Organization profile not found."
            )


class OrganizerGalleryListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = (
        OrganizationGalleryItemSerializer
    )

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        user = self.request.user

        if user.role != "ORGANIZER":
            return OrganizationGalleryItem.objects.none()

        return (
            OrganizationGalleryItem.objects
            .filter(
                organizer_profile__user=user
            )
            .select_related(
                "organizer_profile",
                "event",
            )
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "ORGANIZER":
            self.permission_denied(
                self.request,
                message=(
                    "Only organizers can add gallery items."
                ),
            )

        organizer_profile, _ = (
            OrganizerProfile.objects.get_or_create(
                user=user,
                defaults={
                    "organization_name":
                        f"{user.username}'s Organization"
                },
            )
        )

        event = serializer.validated_data.get(
            "event"
        )

        if event and event.organizer_id != user.id:
            from rest_framework.exceptions import (
                ValidationError,
            )

            raise ValidationError(
                {
                    "event":
                        "You can only attach gallery media to your own events."
                }
            )

        serializer.save(
            organizer_profile=organizer_profile
        )


class OrganizerGalleryDeleteView(
    generics.DestroyAPIView
):
    serializer_class = (
        OrganizationGalleryItemSerializer
    )

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        user = self.request.user

        if user.role != "ORGANIZER":
            return OrganizationGalleryItem.objects.none()

        return (
            OrganizationGalleryItem.objects
            .filter(
                organizer_profile__user=user
            )
        )


class PublicOrganizationGalleryView(
    generics.ListAPIView
):
    serializer_class = (
        OrganizationGalleryItemSerializer
    )

    permission_classes = [
        permissions.AllowAny,
    ]

    def get_queryset(self):
        organizer_id = self.kwargs[
            "organizer_id"
        ]

        return (
            OrganizationGalleryItem.objects
            .filter(
                organizer_profile__user_id=organizer_id,
                organizer_profile__user__role="ORGANIZER",
            )
            .select_related(
                "organizer_profile",
                "event",
            )
            .order_by("-created_at")
        )

User = get_user_model()

class AdminUserListView(
    generics.ListAPIView
):
    serializer_class = AdminUserSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        user = self.request.user

        is_admin = (
            user.is_staff
            or user.is_superuser
            or user.role == "ADMIN"
        )

        if not is_admin:
            self.permission_denied(
                self.request,
                message="Administrator access required.",
            )

        queryset = User.objects.all().order_by(
            "-created_at"
        )

        role = self.request.query_params.get(
            "role"
        )

        search = self.request.query_params.get(
            "search",
            "",
        ).strip()

        if role:
            queryset = queryset.filter(
                role=role.upper()
            )

        if search:
            queryset = queryset.filter(
                Q(
                    username__icontains=search
                )
                | Q(
                    email__icontains=search
                )
                | Q(
                    first_name__icontains=search
                )
                | Q(
                    last_name__icontains=search
                )
            )

        return queryset

class AdminToggleUserStatusView(
    APIView
):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def post(self, request, user_id):
        admin = request.user

        is_admin = (
            admin.is_staff
            or admin.is_superuser
            or admin.role == "ADMIN"
        )

        if not is_admin:
            self.permission_denied(
                request,
                message="Administrator access required.",
            )

        try:
            target_user = User.objects.get(
                id=user_id
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail":
                        "User not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if target_user.id == admin.id:
            return Response(
                {
                    "detail":
                        "You cannot deactivate your own account."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_user.is_superuser:
            return Response(
                {
                    "detail":
                        "A superuser account cannot be modified here."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_is_privileged = (
            target_user.is_staff
            or target_user.role == "ADMIN"
        )

        if target_is_privileged and not admin.is_superuser:
            return Response(
                {
                    "detail":
                        "Only a superuser can deactivate another administrator."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        target_user.is_active = (
            not target_user.is_active
        )

        target_user.save(
            update_fields=[
                "is_active"
            ]
        )

        logger.info(
            "Admin pk=%s %s user pk=%s",
            admin.id,
            "activated" if target_user.is_active else "deactivated",
            target_user.id,
        )

        message = (
            "User activated successfully."
            if target_user.is_active
            else "User deactivated successfully."
        )

        return Response(
            {
                "message": message,
                "user":
                    AdminUserSerializer(
                        target_user
                    ).data,
            },
            status=status.HTTP_200_OK,
        )

