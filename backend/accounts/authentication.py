from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class VersionedJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        expected_version = str(
            getattr(user, "token_version", 0)
        )

        if (
            validated_token.get("token_version")
            != expected_version
        ):
            raise AuthenticationFailed(
                "Your session has been revoked. "
                "Please log in again.",
                code="token_version_mismatch",
            )

        return user