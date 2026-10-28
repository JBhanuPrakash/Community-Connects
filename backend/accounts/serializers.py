from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from django.contrib.auth import password_validation
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import serializers

from .models import EmailOTP, OrganizerProfile, User
from .utils import MAX_OTP_ATTEMPTS, create_and_send_otp

from .models import OrganizerProfile, User
from .models import (
    EmailOTP,
    OrganizerProfile,
    OrganizationGalleryItem,
    User,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_email_verified",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "city",
            "bio",
            "is_staff",
            "is_superuser",
            "profile_image",
            "created_at",
        ]
        read_only_fields = ["id", 
                            "role",
                            "is_staff",
                            "is_superuser",
                            "is_email_verified",
                            "created_at"
                            ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    confirm_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "phone_number",
            "city",
        ]

    def validate_email(self, value):
        return value.lower()

    def validate_password(self, value):
        password_validation.validate_password(value)

        return value

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone_number=validated_data.get("phone_number", ""),
            city=validated_data.get("city", ""),
            role=User.Role.USER,
        )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        user = authenticate(
            username=username,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid username or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        refresh = RefreshToken.for_user(user)
        refresh["token_version"] = str(user.token_version)

        access = refresh.access_token
        access["token_version"] = str(user.token_version)

        return {
            "refresh": str(refresh),
            "access": str(access),
            "user": UserSerializer(user).data,
        }

class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "city",
            "bio",
            "profile_image",
            "is_email_verified",
            "role",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "role",
            "is_email_verified",
            "created_at",
            "updated_at",
        ]

    def validate_email(self, value):
        value = value.lower().strip()

        queryset = User.objects.filter(
            email=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def update(self, instance, validated_data):
        email = validated_data.get("email")

        if email and email != instance.email:
            User.objects.filter(
                pk=instance.pk
            ).update(is_email_verified=False)

            instance.is_email_verified = False

            EmailOTP.objects.filter(
                user=instance,
                purpose=EmailOTP.Purpose.EMAIL_VERIFICATION,
                is_used=False,
            ).update(is_used=True)

            instance = super().update(instance, validated_data)

            create_and_send_otp(
                instance,
                EmailOTP.Purpose.EMAIL_VERIFICATION,
            )

            return instance

        return super().update(instance, validated_data)

class OrganizerProfileSerializer(
    serializers.ModelSerializer
):

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    phone_number = serializers.CharField(
        source="user.phone_number",
        read_only=True,
    )

    city = serializers.CharField(
        source="user.city",
        read_only=True,
    )

    profile_image = serializers.ImageField(
        source="user.profile_image",
        read_only=True,
    )

    class Meta:
        model = OrganizerProfile

        fields = [
            "id",

            # User information
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "city",
            "profile_image",

            # Organization information
            "organization_name",
            "organization_description",
            "website",
            "address",

            # Social media
            "instagram_url",
            "facebook_url",
            "linkedin_url",
            "twitter_url",
            "youtube_url",
            "whatsapp_url",
            "telegram_url",

            # Verification
            "verification_document",
            "is_verified",

            # Dates
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "city",
            "profile_image",
            "is_verified",
            "created_at",
            "updated_at",
        ]

class PublicOrganizerProfileSerializer(
    serializers.ModelSerializer
):
    organizer_id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    full_name = serializers.SerializerMethodField()

    profile_image = serializers.ImageField(
        source="user.profile_image",
        read_only=True,
    )

    city = serializers.CharField(
        source="user.city",
        read_only=True,
    )

    class Meta:
        model = OrganizerProfile

        fields = [
            "id",
            "organizer_id",
            "username",
            "full_name",
            "profile_image",
            "city",

            "organization_name",
            "organization_description",
            "website",
            "address",

            "instagram_url",
            "facebook_url",
            "linkedin_url",
            "twitter_url",
            "youtube_url",
            "whatsapp_url",
            "telegram_url",

            "is_verified",
            "created_at",
        ]

        read_only_fields = fields

    def get_full_name(self, obj):
        full_name = obj.user.get_full_name()

        if full_name:
            return full_name

        return obj.user.username

class OrganizationGalleryItemSerializer(
    serializers.ModelSerializer
):
    event_title = serializers.CharField(
        source="event.title",
        read_only=True,
    )

    class Meta:
        model = OrganizationGalleryItem

        fields = [
            "id",
            "organizer_profile",
            "event",
            "event_title",
            "media_type",
            "image",
            "video",
            "video_url",
            "caption",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "organizer_profile",
            "event_title",
            "created_at",
        ]

    
    def validate(self, data):
            media_type = data.get(
                "media_type",
                getattr(self.instance, "media_type", None),
            )
    
            image = data.get(
                "image",
                getattr(self.instance, "image", None),
            )
    
            video = data.get(
                "video",
                getattr(self.instance, "video", None),
            )
    
            video_url = data.get(
                "video_url",
                getattr(self.instance, "video_url", ""),
            )
    
            if media_type == OrganizationGalleryItem.MediaType.IMAGE:
                if not image:
                    raise serializers.ValidationError({
                        "image": "Please upload an image."
                    })
    
                data["video"] = None
                data["video_url"] = ""
    
            elif media_type == OrganizationGalleryItem.MediaType.VIDEO:
                if not video and not video_url:
                    raise serializers.ValidationError({
                        "video": "Please upload a video or provide a video URL."
                    })
    
                data["image"] = None
    
            return data

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    new_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    confirm_new_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_current_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "The current password is incorrect."
            )

        return value

    def validate(self, data):
        new_password = data["new_password"]
        confirm_password = data["confirm_new_password"]

        if new_password != confirm_password:
            raise serializers.ValidationError(
                {
                    "confirm_new_password":
                        "The new passwords do not match."
                }
            )

        user = self.context["request"].user

        if user.check_password(new_password):
            raise serializers.ValidationError(
                {
                    "new_password":
                        "The new password must be different "
                        "from the current password."
                }
            )

        password_validation.validate_password(
            new_password,
            user=user,
        )

        return data

class SendVerificationOTPSerializer(serializers.Serializer):
    def validate(self, data):
        user = self.context["request"].user

        if user.is_email_verified:
            raise serializers.ValidationError(
                "Your email is already verified."
            )

        if not user.email:
            raise serializers.ValidationError(
                "No email address is associated with this account."
            )

        return data

    def create(self, validated_data):
        user = self.context["request"].user

        create_and_send_otp(
            user,
            EmailOTP.Purpose.EMAIL_VERIFICATION,
        )

        return user

class VerifyEmailOTPSerializer(serializers.Serializer):
    otp = serializers.CharField(
        min_length=6,
        max_length=6,
    )

    def validate(self, data):
        user = self.context["request"].user

        otp_record = EmailOTP.objects.filter(
            user=user,
            purpose=EmailOTP.Purpose.EMAIL_VERIFICATION,
            is_used=False,
        ).first()

        if not otp_record:
            raise serializers.ValidationError(
                {"otp": "No active verification OTP was found."}
            )

        if otp_record.expires_at <= timezone.now():
            otp_record.is_used = True
            otp_record.save(update_fields=["is_used"])

            raise serializers.ValidationError(
                {"otp": "This OTP has expired."}
            )

        if otp_record.attempts >= MAX_OTP_ATTEMPTS:
            otp_record.is_used = True
            otp_record.save(update_fields=["is_used"])

            raise serializers.ValidationError(
                {"otp": "Maximum OTP attempts exceeded."}
            )

        if not check_password(
            data["otp"],
            otp_record.otp_hash,
        ):
            otp_record.attempts += 1
            otp_record.save(update_fields=["attempts"])

            raise serializers.ValidationError(
                {"otp": "Invalid OTP."}
            )

        data["otp_record"] = otp_record
        return data

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()

    def create(self, validated_data):
        user = User.objects.filter(
            email=validated_data["email"],
            is_active=True,
        ).first()

        # Do not reveal whether an email exists.
        if user:
            create_and_send_otp(
                user,
                EmailOTP.Purpose.PASSWORD_RESET,
            )

        return validated_data

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    otp = serializers.CharField(
        min_length=6,
        max_length=6,
    )

    new_password = serializers.CharField(
        write_only=True,
    )

    confirm_new_password = serializers.CharField(
        write_only=True,
    )

    def validate(self, data):
        email = data["email"].lower().strip()

        user = User.objects.filter(
            email=email,
            is_active=True,
        ).first()

        if not user:
            raise serializers.ValidationError(
                {"otp": "Invalid or expired OTP."}
            )

        otp_record = EmailOTP.objects.filter(
            user=user,
            purpose=EmailOTP.Purpose.PASSWORD_RESET,
            is_used=False,
        ).first()

        if not otp_record:
            raise serializers.ValidationError(
                {"otp": "Invalid or expired OTP."}
            )

        if otp_record.expires_at <= timezone.now():
            otp_record.is_used = True
            otp_record.save(update_fields=["is_used"])

            raise serializers.ValidationError(
                {"otp": "This OTP has expired."}
            )

        if otp_record.attempts >= MAX_OTP_ATTEMPTS:
            otp_record.is_used = True
            otp_record.save(update_fields=["is_used"])

            raise serializers.ValidationError(
                {"otp": "Maximum OTP attempts exceeded."}
            )

        if not check_password(
            data["otp"],
            otp_record.otp_hash,
        ):
            otp_record.attempts += 1
            otp_record.save(update_fields=["attempts"])

            raise serializers.ValidationError(
                {"otp": "Invalid OTP."}
            )

        if (
            data["new_password"]
            != data["confirm_new_password"]
        ):
            raise serializers.ValidationError(
                {
                    "confirm_new_password":
                        "Passwords do not match."
                }
            )

        password_validation.validate_password(
            data["new_password"],
            user=user,
        )

        data["user"] = user
        data["otp_record"] = otp_record

        return data

class AdminUserSerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "city",
            "role",
            "is_email_verified",
            "is_active",
            "is_staff",
            "is_superuser",
            "created_at",
        ]

        read_only_fields = fields

    def get_full_name(self, obj):
        full_name = obj.get_full_name()

        if full_name:
            return full_name

        return obj.username