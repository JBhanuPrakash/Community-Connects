import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";
import EventCard from "../components/EventCard";
import { SkeletonCardGrid } from "../components/Skeleton";

const initialFilters = {
  search: "",
  category: "",
  city: "",
  mode: "",
  price_type: "",
  date_from: "",
  date_to: "",
  ordering: "upcoming",
};

function Events() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    category: searchParams.get("category") || "",
  }));

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/categories/");
        setCategories(response.data);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          ordering: filters.ordering,
        };

        Object.entries(filters).forEach(
          ([key, value]) => {
            if (
              value !== "" &&
              key !== "ordering"
            ) {
              params[key] = value;
            }
          },
        );

        const response = await api.get("/events/", {
          params,
        });

        setEvents(response.data.results || []);

        setPagination({
          count: response.data.count || 0,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (requestError) {
        setError(
          requestError.response?.data?.detail ||
            "Unable to load events.",
        );

        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(loadEvents, 350);

    return () => clearTimeout(delay);
  }, [filters, page]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "category") {
      const nextParams = new URLSearchParams(
        searchParams,
      );

      if (value) {
        nextParams.set("category", value);
      } else {
        nextParams.delete("category");
      }

      setSearchParams(nextParams);
    }

    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchParams({});
    setPage(1);
  };

  const totalPages = Math.max(
    Math.ceil(pagination.count / 9),
    1,
  );

  const activeFilterCount = Object.entries(filters)
    .filter(
      ([key, value]) =>
        key !== "ordering" && value !== "",
    )
    .length;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            Explore
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Discover Events
          </h1>

          <p className="mt-3 text-slate-600">
            Find community events based on your interests,
            location and schedule.
          </p>
        </div>

        <p className="text-sm font-medium text-slate-500">
          {pagination.count} event
          {pagination.count === 1 ? "" : "s"} found
        </p>
      </div>

      <div className="mb-8 glass-card rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              name="search"
              type="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Search events, categories or organizers"
              className="input-premium w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-450 outline-none focus:border-indigo-500"
            />
          </div>

          <select
            name="ordering"
            value={filters.ordering}
            onChange={handleChange}
            className="input-premium rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="upcoming">
              Upcoming first
            </option>

            <option value="newest">
              Newly added
            </option>

            <option value="popular">
              Most popular
            </option>

            <option value="price_low">
              Price: Low to high
            </option>

            <option value="price_high">
              Price: High to low
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              setShowFilters((previous) => !previous)
            }
            className="btn-premium inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-bold text-indigo-600 shadow-sm hover:bg-indigo-50/50 transition-all duration-200 active:scale-[0.98]"
          >
            <SlidersHorizontal size={17} />

            Filters

            {activeFilterCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FilterSelect
                label="Category"
                name="category"
                value={filters.category}
                onChange={handleChange}
              >
                <option value="">
                  All categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}
              </FilterSelect>

              <FilterInput
                label="City"
                name="city"
                value={filters.city}
                onChange={handleChange}
                placeholder="Example: Hyderabad"
              />

              <FilterSelect
                label="Mode"
                name="mode"
                value={filters.mode}
                onChange={handleChange}
              >
                <option value="">All modes</option>
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </FilterSelect>

              <FilterSelect
                label="Price"
                name="price_type"
                value={filters.price_type}
                onChange={handleChange}
              >
                <option value="">Free and paid</option>
                <option value="free">Free only</option>
                <option value="paid">Paid only</option>
              </FilterSelect>

              <FilterInput
                label="From date"
                name="date_from"
                type="date"
                value={filters.date_from}
                onChange={handleChange}
              />

              <FilterInput
                label="To date"
                name="date_to"
                type="date"
                value={filters.date_to}
                onChange={handleChange}
              />
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 font-semibold text-red-600"
                >
                  <X size={17} />
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <SkeletonCardGrid count={6} />
      )}

      {error && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            No events found
          </h2>

          <p className="mt-2 text-slate-500">
            Try changing or clearing your filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl glass-card px-6 py-5 shadow-sm sm:flex-row">
            <p className="text-sm font-bold text-slate-550">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!pagination.previous}
                onClick={() =>
                  setPage((previous) =>
                    Math.max(previous - 1, 1),
                  )
                }
                className="btn-premium inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={!pagination.next}
                onClick={() =>
                  setPage((previous) => previous + 1)
                }
                className="btn-premium inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function FilterInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-premium w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function FilterSelect({
  label,
  name,
  value,
  onChange,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="input-premium w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
      >
        {children}
      </select>
    </div>
  );
}

export default Events;