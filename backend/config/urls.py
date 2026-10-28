from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("events.urls")),
    path(
        "api/registrations/",
        include("registrations.urls"),
    ),
    path(
    "api/reviews/",
    include("reviews.urls"),
),
path(
    "api/notifications/",
    include("notifications.urls"),
),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )