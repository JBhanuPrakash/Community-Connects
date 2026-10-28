import { LocateFixed, MapPin, Navigation, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";

import api from "../api/axios";
import EventCard from "../components/EventCard";
import NearbyEventsMap from "../components/NearbyEventsMap";

function NearbyEvents() {
  const [events, setEvents] = useState([]);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(25);

  const [loadingLocation, setLoadingLocation] = useState(false);

  const [loadingEvents, setLoadingEvents] = useState(false);

  const [error, setError] = useState("");

  const detectIdRef = useRef(0);

  const loadNearbyEvents = async (
    latitude,
    longitude,
    selectedRadius = radius,
  ) => {
    setLoadingEvents(true);
    setError("");

    try {
      const response = await api.get("/events/nearby/", {
        params: {
          latitude,
          longitude,
          radius: selectedRadius,
        },
      });

      setEvents(response.data.results || []);

      setLocation({
        latitude: response.data.latitude,
        longitude: response.data.longitude,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail || "Unable to load nearby events.",
      );

      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");

      return;
    }

    setLoadingLocation(true);
    setError("");

    const detectId = detectIdRef.current + 1;
    detectIdRef.current = detectId;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (detectIdRef.current !== detectId) {
          return;
        }

        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(coordinates);

        await loadNearbyEvents(coordinates.latitude, coordinates.longitude);

        if (detectIdRef.current === detectId) {
          setLoadingLocation(false);
        }
      },
      (locationError) => {
        if (detectIdRef.current !== detectId) {
          return;
        }

        const messages = {
          1: "Location permission was denied.",
          2: "Your current location is unavailable.",
          3: "Location request timed out.",
        };

        setError(
          messages[locationError.code] || "Unable to detect your location.",
        );

        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  };

  const handleRadiusChange = async (event) => {
    const selectedRadius = Number(event.target.value);

    setRadius(selectedRadius);

    if (location) {
      await loadNearbyEvents(
        location.latitude,
        location.longitude,
        selectedRadius,
      );
    }
  };

  const openUserLocation = () => {
    if (!location) {
      return;
    }

    const mapUrl =
      `https://www.openstreetmap.org/` +
      `?mlat=${location.latitude}` +
      `&mlon=${location.longitude}` +
      `#map=14/${location.latitude}/${location.longitude}`;

    window.open(mapUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
          Discover Locally
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          Nearby Events
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Use your current location to discover approved community events near
          you.
        </p>
      </div>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Find events around you
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your browser will ask for permission before accessing your
              location.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label
                htmlFor="radius"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search radius
              </label>

              <select
                id="radius"
                value={radius}
                onChange={handleRadiusChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>

            <button
              type="button"
              onClick={detectLocation}
              disabled={loadingLocation || loadingEvents}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60 sm:self-end"
            >
              {loadingLocation ? (
                <RefreshCw size={19} className="animate-spin" />
              ) : (
                <LocateFixed size={19} />
              )}

              {loadingLocation
                ? "Detecting..."
                : location
                  ? "Refresh Location"
                  : "Use My Location"}
            </button>
          </div>
        </div>

        {location && (
          <div className="mt-6 flex flex-col justify-between gap-4 rounded-xl bg-indigo-50 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="mt-0.5 text-indigo-700" />

              <div>
                <p className="font-semibold text-slate-900">
                  Current location detected
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {location.latitude.toFixed(5)},{" "}
                  {location.longitude.toFixed(5)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openUserLocation}
              className="inline-flex items-center gap-2 font-semibold text-indigo-700"
            >
              <Navigation size={17} />
              View on map
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-7 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      {loadingEvents && (
        <div className="py-20 text-center text-slate-500">
          Loading nearby events...
        </div>
      )}

      {!loadingEvents && !error && location && events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <MapPin size={48} className="mx-auto text-slate-400" />

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            No nearby events found
          </h2>

          <p className="mt-2 text-slate-500">
            Increase the search radius or check again later.
          </p>
        </div>
      )}

      {!loadingEvents && events.length > 0 && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Events within {radius} km
            </h2>

            <p className="mt-2 text-slate-500">
              {events.length} event
              {events.length === 1 ? "" : "s"} found.
            </p>
          </div>

          {location && !loadingEvents && (
            <section className="mb-10">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">
                  Nearby Events Map
                </h2>

                <p className="mt-2 text-slate-500">
                  Explore events around your current location.
                </p>
              </div>

              <NearbyEventsMap userLocation={location} events={events} />
            </section>
          )}

          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id}>
                <EventCard event={event} />

                <div className="-mt-3 rounded-b-2xl bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700">
                  {event.distance_km} km away
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!location && !loadingLocation && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <LocateFixed size={48} className="mx-auto text-slate-400" />

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Location not detected
          </h2>

          <p className="mt-2 text-slate-500">
            Click “Use My Location” to discover nearby events.
          </p>
        </div>
      )}
    </section>
  );
}

export default NearbyEvents;
