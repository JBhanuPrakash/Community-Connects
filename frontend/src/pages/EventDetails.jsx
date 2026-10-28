import {
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  CheckCircle,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Share2,
  Star,
  Ticket,
  User,
  Users,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import EventMap from "../components/EventMap";
import ReviewsSection from "../components/ReviewsSection";

function EventDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);

  const [loading, setLoading] = useState(true);

  const [registering, setRegistering] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadEvent = async () => {
      setEvent(null);
      setError("");
      setLoading(true);

      try {
        const response = await api.get(`/events/${id}/`);

        if (active) {
          setEvent(response.data);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.detail ||
              "The requested event could not be found.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadEvent();

    return () => {
      active = false;
    };
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          message: "Please log in to register for this event.",
        },
      });

      return;
    }

    if (user?.role !== "USER") {
      setError("Only regular user accounts can register for events.");

      return;
    }

    setRegistering(true);
    setMessage("");
    setError("");

    try {
      await api.post("/registrations/register/", {
        event_id: Number(id),
      });

      setEvent((previous) => ({
        ...previous,

        is_registered: true,

        registration_count: previous.registration_count + 1,

        available_slots:
          previous.available_slots === null
            ? null
            : Math.max(previous.available_slots - 1, 0),
      }));

      setMessage("You registered for this event successfully.");
    } catch (requestError) {
      console.error(
        "Registration error:",
        requestError.response?.data || requestError,
      );

      const apiError = requestError.response?.data;

      if (typeof apiError === "string") {
        setError(apiError);
      } else if (apiError?.detail) {
        setError(apiError.detail);
      } else if (apiError?.event_id) {
        setError(
          Array.isArray(apiError.event_id)
            ? apiError.event_id[0]
            : apiError.event_id,
        );
      } else if (apiError?.non_field_errors) {
        setError(
          Array.isArray(apiError.non_field_errors)
            ? apiError.non_field_errors[0]
            : apiError.non_field_errors,
        );
      } else {
        setError("Unable to register for this event.");
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          message: "Please log in to save this event.",
        },
      });

      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (event.is_saved) {
        await api.delete(`/registrations/saved/${id}/remove/`);

        setEvent((previous) => ({
          ...previous,
          is_saved: false,
        }));

        setMessage("Event removed from your saved events.");
      } else {
        await api.post(`/registrations/saved/${id}/`);

        setEvent((previous) => ({
          ...previous,
          is_saved: true,
        }));

        setMessage("Event saved successfully.");
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail || "Unable to update saved event.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: event.title,

      text: event.short_description || event.description,

      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);

        setMessage("Event link copied to the clipboard.");
      }
    } catch (shareError) {
      if (shareError.name !== "AbortError") {
        setError("Unable to share this event.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-500">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl bg-red-50 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800">Event unavailable</h1>

          <p className="mt-3 text-red-700">{error}</p>

          <Link
            to="/events"
            className="mt-6 inline-block rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white"
          >
            Browse Events
          </Link>
        </div>
      </section>
    );
  }

  const startDate = new Date(event.start_datetime);

  const endDate = new Date(event.end_datetime);

  const registrationDeadline = event.registration_deadline
    ? new Date(event.registration_deadline)
    : null;

  const now = new Date();

  const hasStarted = startDate <= now;

  const registrationClosed = registrationDeadline && registrationDeadline < now;

  const canRegister =
    !event.is_registered &&
    !event.is_full &&
    !hasStarted &&
    !registrationClosed &&
    event.status === "APPROVED";

  return (
    <section className="bg-slate-50 pb-16">
      <EventBanner event={event} />

      <div className="mx-auto grid max-w-7xl gap-8 px-6 pt-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-8">
          <EventHeader event={event} onShare={handleShare} />

          {message && <Alert type="success" message={message} />}

          {error && <Alert type="error" message={error} />}

          <EventInformation
            event={event}
            startDate={startDate}
            endDate={endDate}
          />

          <DescriptionSection event={event} />

          <OrganizerSection event={event} />

          <LocationSection event={event} />

          <ReviewsSection
            eventId={event.id}
            eventOrganizerId={event.organizer}
          />
        </main>

        <aside>
          <RegistrationCard
            event={event}
            registrationDeadline={registrationDeadline}
            hasStarted={hasStarted}
            registrationClosed={registrationClosed}
            canRegister={canRegister}
            registering={registering}
            saving={saving}
            isAuthenticated={isAuthenticated}
            user={user}
            onRegister={handleRegister}
            onSave={handleSave}
          />
        </aside>
      </div>
    </section>
  );
}

function EventBanner({ event }) {
  return (
    <div className="relative h-[280px] overflow-hidden bg-slate-900 sm:h-[380px] lg:h-[460px]">
      {event.banner_image ? (
        <>
          <img
            src={event.banner_image}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </>
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-r from-indigo-800 to-purple-800 text-white">
          <CalendarDays size={70} />
        </div>
      )}
    </div>
  );
}

function EventHeader({ event, onShare }) {
  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              {event.category_name}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {formatMode(event.mode)}
            </span>

            {event.is_featured && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                Featured
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <Star size={18} className="fill-amber-400 text-amber-400" />

            <span className="font-semibold text-slate-900">
              {Number(event.average_rating || 0).toFixed(1)}
            </span>

            <span>({event.review_count || 0} reviews)</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {event.title}
          </h1>

          {event.short_description && (
            <p className="mt-4 text-lg leading-7 text-slate-600">
              {event.short_description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Share2 size={18} />
          Share
        </button>
      </div>
    </section>
  );
}

function EventInformation({ event, startDate, endDate }) {
  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Event Information</h2>

      <div className="mt-7 grid gap-6 md:grid-cols-2">
        <InformationItem
          icon={<CalendarDays size={22} />}
          label="Date"
          value={formatEventDate(startDate)}
        />

        <InformationItem
          icon={<Clock size={22} />}
          label="Time"
          value={`${formatEventTime(startDate)} – ${formatEventTime(endDate)}`}
        />

        <InformationItem
          icon={<MapPin size={22} />}
          label="Location"
          value={getLocationText(event)}
        />

        <InformationItem
          icon={<Users size={22} />}
          label="Registrations"
          value={`${event.registration_count || 0} registered`}
        />

        <InformationItem
          icon={<Ticket size={22} />}
          label="Available Seats"
          value={
            event.capacity === null
              ? "Unlimited"
              : `${event.available_slots ?? 0} of ${event.capacity} available`
          }
        />

        <InformationItem
          icon={<User size={22} />}
          label="Organizer"
          value={event.organizer_full_name || event.organizer_name}
        />
      </div>
    </section>
  );
}

function DescriptionSection({ event }) {
  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">About This Event</h2>

      <p className="mt-5 whitespace-pre-line leading-8 text-slate-600">
        {event.description}
      </p>
    </section>
  );
}

function OrganizerSection({ event }) {
  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">About the Organizer</h2>

      <div className="mt-6 flex items-center gap-5">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-indigo-50">
          {event.organizer_profile_image ? (
            <img
              src={event.organizer_profile_image}
              alt={event.organizer_name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-indigo-700">
              <User size={34} />
            </div>
          )}
        </div>

        <div>
          <Link
            to={`/organizations/${event.organizer}`}
            className="text-xl font-bold text-slate-900 hover:text-indigo-700 hover:underline"
          >
            {event.organizer_full_name || event.organizer_name}
          </Link>

          <p className="mt-1 text-slate-500">@{event.organizer_name}</p>

          <p className="mt-2 text-sm text-slate-600">
            Event organizer on CommunityConnect
          </p>
        </div>
      </div>
    </section>
  );
}

function LocationSection({ event }) {
  const hasCoordinates =
    event.latitude !== null &&
    event.latitude !== undefined &&
    event.latitude !== "" &&
    event.longitude !== null &&
    event.longitude !== undefined &&
    event.longitude !== "";

  if (event.mode === "ONLINE") {
    return (
      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Online Event</h2>

        <p className="mt-4 leading-7 text-slate-600">
          This event will be conducted online. Registered participants can use
          the event link provided by the organizer.
        </p>

        {event.online_event_url && (
          <a
            href={event.online_event_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
          >
            Open Event Link
            <ExternalLink size={17} />
          </a>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
          <MapPin size={22} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Event Location</h2>

          <p className="mt-1 text-sm text-slate-500">
            View the venue and get directions to the event.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-5">
        <p className="font-semibold text-slate-900">
          {event.venue_name || "Venue not specified"}
        </p>

        {event.address && (
          <p className="mt-2 text-slate-600">{event.address}</p>
        )}

        {(event.city || event.state) && (
          <p className="mt-1 text-slate-600">
            {[event.city, event.state].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {hasCoordinates ? (
        <>
          <div className="mt-6">
            <EventMap
              latitude={event.latitude}
              longitude={event.longitude}
              title={event.title}
              venue={event.venue_name}
              city={event.city}
              height="380px"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white transition hover:bg-indigo-800"
            >
              <Navigation size={18} />
              Get Directions
            </a>

            <a
              href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=16/${event.latitude}/${event.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-700 px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              <MapPin size={18} />
              Open in Map
            </a>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-xl bg-amber-50 px-5 py-4 text-amber-700">
          Map location is not available for this event.
        </div>
      )}
    </section>
  );
}

function RegistrationCard({
  event,
  registrationDeadline,
  hasStarted,
  registrationClosed,
  canRegister,
  registering,
  saving,
  isAuthenticated,
  user,
  onRegister,
  onSave,
}) {
  return (
    <div className="sticky top-24 rounded-2xl bg-white p-7 shadow-lg">
      <p className="text-sm font-medium text-slate-500">Event price</p>

      <p className="mt-1 text-3xl font-bold text-slate-900">
        {Number(event.price) === 0
          ? "Free"
          : `₹${Number(event.price).toLocaleString("en-IN")}`}
      </p>

      <div className="mt-6 space-y-4 border-y border-slate-200 py-5">
        <SummaryRow label="Registered" value={event.registration_count || 0} />

        <SummaryRow
          label="Capacity"
          value={event.capacity === null ? "Unlimited" : event.capacity}
        />

        <SummaryRow
          label="Available"
          value={
            event.available_slots === null ? "Unlimited" : event.available_slots
          }
        />

        {registrationDeadline && (
          <SummaryRow
            label="Registration closes"
            value={registrationDeadline.toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}
      </div>

      <div className="mt-6 space-y-3">
        {event.is_registered ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-3 font-semibold text-green-700">
            <CheckCircle size={19} />
            Already Registered
          </div>
        ) : (
          <button
            type="button"
            onClick={onRegister}
            disabled={
              registering ||
              (isAuthenticated && user?.role !== "USER") ||
              (isAuthenticated &&
                user?.role === "USER" &&
                !user?.is_email_verified) ||
              !canRegister
            }
            className="w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registering ? "Registering..." : "Register Now"}
          </button>
        )}

        {isAuthenticated &&
          user?.role === "USER" &&
          !user?.is_email_verified && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
              Verify your email before registering.{" "}
              <Link
                to="/verify-email"
                className="underline hover:text-amber-800"
              >
                Verify now
              </Link>
            </p>
          )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-700 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
        >
          {event.is_saved ? (
            <>
              <BookmarkCheck size={19} />
              Saved
            </>
          ) : (
            <>
              <Bookmark size={19} />
              Save Event
            </>
          )}
        </button>
      </div>

      <RegistrationNotice
        event={event}
        hasStarted={hasStarted}
        registrationClosed={registrationClosed}
        user={user}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}

function RegistrationNotice({
  event,
  hasStarted,
  registrationClosed,
  user,
  isAuthenticated,
}) {
  let text = "";

  if (!isAuthenticated) {
    text = "Log in with a user account to register or save this event.";
  } else if (user?.role !== "USER") {
    text = "Organizer and administrator accounts cannot register for events.";
  } else if (event.is_full) {
    text = "This event has reached its maximum capacity.";
  } else if (hasStarted) {
    text = "Registration is unavailable because this event has started.";
  } else if (registrationClosed) {
    text = "The registration deadline for this event has passed.";
  }

  if (!text) {
    return null;
  }

  return (
    <p className="mt-4 text-center text-sm leading-6 text-slate-500">{text}</p>
  );
}

function InformationItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">{icon}</div>

      <div>
        <p className="text-sm text-slate-500">{label}</p>

        <p className="mt-1 font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>

      <span className="text-right font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Alert({ type, message }) {
  const classes =
    type === "success"
      ? "bg-green-50 text-green-700"
      : "bg-red-50 text-red-700";

  return <div className={`rounded-xl px-5 py-4 ${classes}`}>{message}</div>;
}

function formatEventDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMode(mode) {
  const labels = {
    ONLINE: "Online",
    OFFLINE: "In Person",
    HYBRID: "Hybrid",
  };

  return labels[mode] || mode;
}

function getLocationText(event) {
  if (event.mode === "ONLINE") {
    return "Online event";
  }

  return [event.venue_name, event.city, event.state].filter(Boolean).join(", ");
}

export default EventDetails;
