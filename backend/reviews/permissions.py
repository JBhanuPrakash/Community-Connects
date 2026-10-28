from rest_framework import permissions


class IsReviewOwner(permissions.BasePermission):
    message = "You can modify only your own review."

    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated
            and obj.user_id == request.user.id
        )