import {
  Bookmark,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import { SkeletonCardGrid } from "../components/Skeleton";

function SavedEvents() {
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSavedEvents = async () => {
    try {
      const response = await api.get(
        "/registrations/saved/",
      );

      setSavedEvents(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to load saved events.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSavedEvents = async () => {
      await loadSavedEvents();
    };

    fetchSavedEvents();
  }, []);

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

      setMessage("Saved event removed.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to remove the saved event.",
      );
    }
  };

  return (
    <section
      className="mx-auto max-w-7xl px-6 py-12"
    >
      <div
        className="mb-8 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-700 p-6 text-white"
      >
        <div>
          <h1
            className="text-2xl font-bold"
          >
            Saved Events
          </h1>

          <p
            className="mt-1 text-indigo-100"
          >
            Events you have bookmarked for later.
          </p>
        </div>
      </div>

      {message && (
        <div
          className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-green-700"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonCardGrid count={3} />
      ) : !error && savedEvents.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
        >
          <Bookmark size={40} className="mx-auto text-slate-300" />

          <p
            className="mt-4 text-slate-500"
          >
            You have not saved any events yet.
          </p>

          <Link
            to="/events"
            className="mt-5 inline-block rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {savedEvents.map((saved) => (
            <article
              key={saved.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div
                className="h-44 bg-slate-200"
              >
                {saved.event_banner ? (
                  <img
                    src={saved.event_banner}
                    alt={saved.event_title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center text-slate-500"
                  >
                    No event image
                  </div>
                )}
              </div>

              <div
                className="p-5"
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide text-indigo-700"
                >
                  {saved.category_name}
                </p>

                <h2
                  className="mt-2 text-xl font-bold text-slate-900"
                >
                  {saved.event_title}
                </h2>

                <div
                  className="mt-4 space-y-2 text-sm text-slate-600"
                >
                  <div
                    className="flex items-center gap-2"
                  >
                    <CalendarDays size={17} />
                    {new Date(
                      saved.event_start_datetime,
                    ).toLocaleDateString("en-IN")}
                  </div>

                  <div
                    className="flex items-center gap-2"
                  >
                    <MapPin size={17} />
                    {saved.event_city || "Location unavailable"}
                  </div>
                </div>

                <div
                  className="mt-5 flex gap-3"
                >
                  <Link
                    to={`/events/${saved.event}`}
                    className="flex-1 rounded-lg bg-indigo-700 px-4 py-2 text-center font-semibold text-white"
                  >
                    View
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeSavedEvent(saved.event)}
                    className="rounded-lg border border-red-600 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default SavedEvents;