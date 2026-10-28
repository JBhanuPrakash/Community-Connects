from rest_framework import permissions


class IsOrganizer(permissions.BasePermission):
    message = "Only organizers can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.role == "ORGANIZER"
                or request.user.is_staff
                or request.user.is_superuser
            )
        )


class IsEventOwnerOrAdmin(permissions.BasePermission):
    message = "You do not have permission to modify this event."

    def has_object_permission(self, request, view, obj):
        return (
            obj.organizer == request.user
            or request.user.is_staff
            or request.user.is_superuser
            or request.user.role == "ADMIN"
        )

class IsAdminRole(permissions.BasePermission):
    message = "Only administrators can access this feature."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or request.user.is_superuser
                or request.user.role == "ADMIN"
            )
        )