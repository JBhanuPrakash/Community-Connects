import {
  Bookmark,
  CalendarDays,
  MapPin,
  TicketCheck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import { SkeletonCardGrid } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";

function UserDashboard() {
  const { user } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("registrations");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(
    async () => {
      const [
        registrationsResponse,
        savedResponse,
      ] = await Promise.all([
        api.get("/registrations/"),
        api.get("/registrations/saved/"),
      ]);

      return {
        registrations:
          registrationsResponse.data,
        savedEvents: savedResponse.data,
      };
    },
    [],
  );

  const loadDashboardData = async () => {
    try {
      const data =
        await fetchDashboardData();

      setRegistrations(data.registrations);
      setSavedEvents(data.savedEvents);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard information.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data =
          await fetchDashboardData();

        if (active) {
          setRegistrations(
            data.registrations,
          );

          setSavedEvents(
            data.savedEvents,
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load dashboard information.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [fetchDashboardData]);

  const cancelRegistration = async (registrationId) => {
    setMessage("");
    setError("");

    try {
      await api.post(
        `/registrations/${registrationId}/cancel/`,
      );

      setMessage("Registration cancelled successfully.");
      await loadDashboardData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to cancel registration.",
      );
    }
  };

  const removeSavedEvent = async (eventId) => {
    setMessage("");
    setError("");

    try {
      await api.delete(
        `/registrations/saved/${eventId}/remove/`,
      );

      setSavedEvents((previous) =>
        previous.filter((item) => item.event !== eventId),
      );

      setMessage("Event removed from saved events.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to remove saved event.",
      );
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-700 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">
          User Dashboard
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Welcome, {user?.first_name || user?.username}
        </h1>

        <p className="mt-3 text-indigo-100">
          Manage your event registrations and saved events.
        </p>
      </div>

      <div className="mb-8 grid gap-5 sm:grid-cols-2">
        <DashboardCard
          icon={<TicketCheck size={26} />}
          title="My Registrations"
          value={registrations.length}
        />

        <DashboardCard
          icon={<Bookmark size={26} />}
          title="Saved Events"
          value={savedEvents.length}
        />
      </div>

      {message && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-3 border-b border-slate-200">
        <TabButton
          active={activeTab === "registrations"}
          onClick={() => setActiveTab("registrations")}
        >
          My Registrations
        </TabButton>

        <TabButton
          active={activeTab === "saved"}
          onClick={() => setActiveTab("saved")}
        >
          Saved Events
        </TabButton>
      </div>

      {loading ? (
        <SkeletonCardGrid count={3} />
      ) : (
        <>
          {activeTab === "registrations" && (
            <RegistrationsList
              registrations={registrations}
              hasError={Boolean(error)}
              onCancel={cancelRegistration}
            />
          )}

          {activeTab === "saved" && (
            <SavedEventsList
              savedEvents={savedEvents}
              hasError={Boolean(error)}
              onRemove={removeSavedEvent}
            />
          )}
        </>
      )}
    </section>
  );
}

function DashboardCard({ icon, title, value }) {
  return (
    <div className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm">
      <div className="rounded-xl bg-indigo-50 p-4 text-indigo-700">
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-3 font-semibold transition ${
        active
          ? "border-indigo-700 text-indigo-700"
          : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function RegistrationsList({ registrations, hasError, onCancel }) {
  if (!hasError && registrations.length === 0) {
    return (
      <EmptyState message="You have not registered for any events." />
    );
  }

  return (
    <div className="space-y-5">
      {registrations.map((registration) => {
        const date = new Date(
          registration.event_start_datetime,
        );

        return (
          <article
            key={registration.id}
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    {registration.event_title}
                  </h2>

                  <StatusBadge status={registration.status} />
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={17} />
                    {date.toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={17} />
                    {registration.event_city || "Location unavailable"}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  to={`/events/${registration.event}`}
                  className="rounded-lg border border-indigo-700 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  View Event
                </Link>

                {registration.status === "REGISTERED" && (
                  <button
                    type="button"
                    onClick={() =>
                      onCancel(registration.id)
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SavedEventsList({ savedEvents, hasError, onRemove }) {
  if (!hasError && savedEvents.length === 0) {
    return (
      <EmptyState message="You have not saved any events." />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {savedEvents.map((saved) => (
        <article
          key={saved.id}
          className="overflow-hidden rounded-2xl bg-white shadow-sm"
        >
          <div className="h-44 bg-slate-200">
            {saved.event_banner ? (
              <img
                src={saved.event_banner}
                alt={saved.event_title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                No event image
              </div>
            )}
          </div>

          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              {saved.category_name}
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {saved.event_title}
            </h2>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarDays size={17} />
                {new Date(
                  saved.event_start_datetime,
                ).toLocaleDateString("en-IN")}
              </div>

              <div className="flex items-center gap-2">
                <MapPin size={17} />
                {saved.event_city || "Location unavailable"}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <Link
                to={`/events/${saved.event}`}
                className="flex-1 rounded-lg bg-indigo-700 px-4 py-2 text-center font-semibold text-white"
              >
                View
              </Link>

              <button
                type="button"
                onClick={() => onRemove(saved.event)}
                className="rounded-lg border border-red-600 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    REGISTERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    ATTENDED: "bg-blue-100 text-blue-700",
    ABSENT: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        classes[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-slate-500">{message}</p>

      <Link
        to="/events"
        className="mt-5 inline-block rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white"
      >
        Explore Events
      </Link>
    </div>
  );
}

export default UserDashboard;