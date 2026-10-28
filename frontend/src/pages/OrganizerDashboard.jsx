import {
  CalendarDays,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Plus,
  Star,
  UserCheck,
  Users,
  XCircle,
  Ban,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Link } from "react-router-dom";

import api from "../api/axios";


function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  const [error, setError] = useState("");
  const [analyticsError, setAnalyticsError] =
    useState("");

  const [message, setMessage] = useState("");


  const fetchEventsData = useCallback(
    async () => {
      const response = await api.get(
        "/organizer/events/",
      );

      const eventData =
        response.data.results ||
        response.data ||
        [];

      return Array.isArray(eventData)
        ? eventData
        : [];
    },
    [],
  );

  const fetchAnalyticsData = useCallback(
    async () => {
      const response = await api.get(
        "/organizer/analytics/",
      );

      return response.data;
    },
    [],
  );

  const loadEvents = async () => {
    try {
      const data = await fetchEventsData();

      setEvents(data);
    } catch (requestError) {
      console.error(
        "Organizer events error:",
        requestError.response?.data ||
          requestError,
      );

      setError(
        requestError.response?.data?.detail ||
          "Unable to load your events.",
      );
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analytics =
        await fetchAnalyticsData();

      setAnalytics(analytics);
    } catch (requestError) {
      console.error(
        "Organizer analytics error:",
        requestError.response?.data ||
          requestError,
      );

      setAnalyticsError(
        requestError.response?.data?.detail ||
          "Unable to load dashboard analytics.",
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [
          eventData,
          analyticsData,
        ] = await Promise.all([
          fetchEventsData(),
          fetchAnalyticsData(),
        ]);

        if (active) {
          setEvents(eventData);
          setAnalytics(analyticsData);
        }
      } catch (requestError) {
        console.error(
          "Organizer dashboard error:",
          requestError.response?.data ||
            requestError,
        );

        if (active) {
          setError(
            requestError.response?.data
              ?.detail ||
              "Unable to load your dashboard.",
          );
        }
      } finally {
        if (active) {
          setLoadingEvents(false);
          setAnalyticsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [
    fetchEventsData,
    fetchAnalyticsData,
  ]);


  const handleCancel = async (eventId) => {
    const confirmed = window.confirm(
      "Cancel this event? Registered users will be notified.",
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(eventId);
    setError("");
    setMessage("");

    try {
      await api.post(
        `/organizer/events/${eventId}/cancel/`,
      );

      setMessage(
        "Event cancelled successfully.",
      );

      await loadEvents();
      await loadAnalytics();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to cancel this event.",
      );
    } finally {
      setProcessingId(null);
    }
  };


  const eventStatusData = [
    {
      name: "Approved",
      value: analytics?.events?.approved ?? 0,
      color: "#22c55e",
    },
    {
      name: "Pending",
      value: analytics?.events?.pending ?? 0,
      color: "#f59e0b",
    },
    {
      name: "Rejected",
      value: analytics?.events?.rejected ?? 0,
      color: "#ef4444",
    },
    {
      name: "Cancelled",
      value: analytics?.events?.cancelled ?? 0,
      color: "#94a3b8",
    },
  ].filter((item) => item.value > 0);

  const registrationStatusData = [
    {
      name: "Active",
      value: analytics?.registrations?.active ?? 0,
      color: "#a78bfa",
    },
    {
      name: "Attended",
      value: analytics?.registrations?.attended ?? 0,
      color: "#34d399",
    },
    {
      name: "Cancelled",
      value: analytics?.registrations?.cancelled ?? 0,
      color: "#fb7185",
    },
  ].filter((item) => item.value > 0);

  const trendData =
    analytics?.registration_trend ?? [];

  const eventData =
    analytics?.event_registrations ?? [];

  const sortedEventData = [
    ...eventData,
  ].sort(
    (a, b) =>
      (b.registration_count ?? 0) -
      (a.registration_count ?? 0),
  );

  const ratingData = [1, 2, 3, 4, 5].map(
    (rating) => ({
      rating:
        rating === 1
          ? "1 star"
          : `${rating} stars`,
      count:
        analytics?.reviews?.rating_counts?.[
          String(rating)
        ] ?? 0,
    }),
  );


  return (
    <section className="mx-auto max-w-7xl px-6 py-12">

      {/* HEADER */}
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            Organizer
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Organizer Dashboard
          </h1>

          <p className="mt-3 text-slate-600">
            Manage your events, participants,
            registrations and attendance.
          </p>
        </div>


        <Link
          to="/organizer/events/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
        >
          <Plus size={19} />
          Create Event
        </Link>

      </div>


      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="mb-7 rounded-xl bg-green-50 px-5 py-4 text-green-700">
          {message}
        </div>
      )}


      {/* GENERAL ERROR */}
      {error && (
        <div className="mb-7 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}


      {/* ANALYTICS ERROR */}
      {analyticsError && (
        <div className="mb-7 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {analyticsError}
        </div>
      )}


      {/* ANALYTICS LOADING */}
      {analyticsLoading && (
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-slate-500">
            Loading dashboard analytics...
          </p>
        </div>
      )}


      {/* ANALYTICS */}
      {analytics && (
        <>
          {/* MAIN STATISTICS */}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            <DashboardCard
              title="Total Events"
              value={
                analytics.events?.total ?? 0
              }
              icon={
                <CalendarDays size={24} />
              }
            />


            <DashboardCard
              title="Approved"
              value={
                analytics.events?.approved ?? 0
              }
              icon={
                <CheckCircle size={24} />
              }
            />


            <DashboardCard
              title="Pending"
              value={
                analytics.events?.pending ?? 0
              }
              icon={
                <Clock size={24} />
              }
            />


            <DashboardCard
              title="Registrations"
              value={
                analytics.registrations?.total ??
                0
              }
              icon={<Users size={24} />}
            />


            <DashboardCard
              title="Attended"
              value={
                analytics.registrations
                  ?.attended ?? 0
              }
              icon={
                <UserCheck size={24} />
              }
            />


            <DashboardCard
              title="Average Rating"
              value={
                Number(
                  analytics.reviews
                    ?.average_rating ?? 0,
                ).toFixed(1)
              }
              icon={<Star size={24} />}
            />

          </div>


          {/* SECONDARY STATISTICS */}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            <SmallStat
              title="Rejected Events"
              value={
                analytics.events?.rejected ?? 0
              }
              icon={<XCircle size={20} />}
            />

            <SmallStat
              title="Cancelled Events"
              value={
                analytics.events?.cancelled ?? 0
              }
              icon={<Ban size={20} />}
            />

            <SmallStat
              title="Active Registrations"
              value={
                analytics.registrations
                  ?.active ?? 0
              }
              icon={<Users size={20} />}
            />

            <SmallStat
              title="Cancelled Registrations"
              value={
                analytics.registrations
                  ?.cancelled ?? 0
              }
              icon={<XCircle size={20} />}
            />

            <SmallStat
              title="Total Reviews"
              value={
                analytics.reviews?.total ?? 0
              }
              icon={<Star size={20} />}
            />

            <SmallStat
              title="Attendance Rate"
              value={`${
                analytics.attendance_rate ?? 0
              }%`}
              icon={
                <UserCheck size={20} />
              }
            />

          </div>


          {/* STATUS DONUTS */}

          <div className="mb-8 grid gap-5 lg:grid-cols-2">

            <ChartCard
              title="Events by Status"
              subtitle="Breakdown of your events."
            >
              {eventStatusData.length > 0 ? (
                <DonutChart
                  data={eventStatusData}
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>


            <ChartCard
              title="Registrations by Status"
              subtitle="Where your attendees stand."
            >
              {registrationStatusData.length >
              0 ? (
                <DonutChart
                  data={
                    registrationStatusData
                  }
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

          </div>


          {/* REGISTRATIONS + UTILIZATION */}

          <div className="mb-8 grid gap-5 lg:grid-cols-2">

            <ChartCard
              title="Registrations by Event"
              subtitle="Active registrations compared to capacity."
            >
              {sortedEventData.length > 0 && (
                <div className="h-72 w-full">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={sortedEventData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 30,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="title"
                        tick={{ fontSize: 11 }}
                        angle={-20}
                        textAnchor="end"
                        height={70}
                      />

                      <YAxis
                        allowDecimals={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="registration_count"
                        name="Registrations"
                        fill="#c026d3"
                        radius={[6, 6, 0, 0]}
                      />

                      <Bar
                        dataKey="capacity"
                        name="Capacity"
                        fill="#f0abfc"
                        radius={[6, 6, 0, 0]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>
              )}

              {sortedEventData.length === 0 && (
                <EmptyChart />
              )}

            </ChartCard>


            <ChartCard
              title="Capacity Utilization"
              subtitle="How full your events are."
            >
              {sortedEventData.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {sortedEventData.map((item) => (
                    <div key={item.id}>

                      <div className="mb-1.5 flex items-center justify-between gap-3">

                        <p className="max-w-[70%] truncate text-sm font-medium text-slate-700">
                          {item.title}
                        </p>

                        <p className="text-sm font-bold text-slate-900">
                          {item.utilization ===
                          null ||
                          item.utilization ===
                            undefined
                            ? "No capacity"
                            : `${item.utilization}%`}
                        </p>

                      </div>


                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">

                        <div
                          className={`h-full rounded-full ${utilizationColor(
                            item.utilization,
                          )}`}
                          style={{
                            width: `${Math.min(
                              item.utilization ??
                                0,
                              100,
                            )}%`,
                          }}
                        />

                      </div>


                      <p className="mt-1 text-xs text-slate-400">
                        {item.registration_count} /{" "}
                        {item.capacity ?? "-"}{" "}
                        registered
                      </p>

                    </div>
                  ))}
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

          </div>


          {/* TREND + REVIEWS */}

          <div className="mb-10 grid gap-5 lg:grid-cols-2">

            <ChartCard
              title="Registrations Over Time"
              subtitle="Monthly registrations across your events."
            >
              {trendData.length > 0 ? (
                <div className="h-64 w-full">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <AreaChart
                      data={trendData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 0,
                      }}
                    >

                      <defs>

                        <linearGradient
                          id="trendFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >

                          <stop
                            offset="0%"
                            stopColor="#c026d3"
                            stopOpacity={0.4}
                          />

                          <stop
                            offset="100%"
                            stopColor="#c026d3"
                            stopOpacity={0.05}
                          />

                        </linearGradient>

                      </defs>


                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12 }}
                      />

                      <YAxis
                        allowDecimals={false}
                      />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Registrations"
                        stroke="#c026d3"
                        strokeWidth={2}
                        fill="url(#trendFill)"
                      />

                    </AreaChart>

                  </ResponsiveContainer>

                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>


            <ChartCard
              title="Review Ratings"
              subtitle="Distribution of ratings on your events."
            >
              {ratingData.some(
                (item) => item.count > 0,
              ) ? (
                <div className="h-64 w-full">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={ratingData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 0,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="rating"
                        tick={{ fontSize: 12 }}
                      />

                      <YAxis
                        allowDecimals={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="count"
                        name="Reviews"
                        fill="#8b5cf6"
                        radius={[6, 6, 0, 0]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

          </div>
        </>
      )}


      {/* EVENTS SECTION */}

      <section>

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              My Events
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage all events created by your
              organization.
            </p>
          </div>

        </div>


        {loadingEvents ? (

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

            <p className="text-slate-500">
              Loading events...
            </p>

          </div>

        ) : !error && events.length === 0 ? (

          <EmptyEvents />

        ) : (

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <TableHeader>
                      Event
                    </TableHeader>

                    <TableHeader>
                      Category
                    </TableHeader>

                    <TableHeader>
                      Date
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Registrations
                    </TableHeader>

                    <TableHeader>
                      Actions
                    </TableHeader>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-200">

                  {events.map((event) => (

                    <EventRow
                      key={event.id}
                      event={event}
                      cancelling={
                        processingId === event.id
                      }
                      onCancel={
                        handleCancel
                      }
                    />

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </section>

    </section>
  );
}



function EventRow({
  event,
  cancelling,
  onCancel,
}) {
  return (
    <tr className="hover:bg-slate-50">

      {/* EVENT */}

      <td className="px-6 py-5">

        <div className="flex items-center gap-4">

          <div className="h-14 w-20 overflow-hidden rounded-lg bg-slate-100">

            {event.banner_image ? (

              <img
                src={event.banner_image}
                alt={event.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />

            ) : (

              <div className="flex h-full items-center justify-center text-slate-400">
                <CalendarDays size={22} />
              </div>

            )}

          </div>


          <div>

            <p className="max-w-xs font-semibold text-slate-900">
              {event.title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {event.mode}
            </p>

          </div>

        </div>

      </td>


      {/* CATEGORY */}

      <td className="px-6 py-5 text-sm text-slate-600">
        {event.category_name ||
          "Uncategorized"}
      </td>


      {/* DATE */}

      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">

        {event.start_datetime
          ? new Date(
              event.start_datetime,
            ).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            )
          : "Not set"}

      </td>


      {/* STATUS */}

      <td className="px-6 py-5">

        <StatusBadge
          status={event.status}
        />

      </td>


      {/* REGISTRATIONS */}

      <td className="px-6 py-5 text-sm font-semibold text-slate-700">

        {event.registration_count ?? 0}

        {event.capacity !== null &&
          event.capacity !== undefined && (
            <span className="font-normal text-slate-400">
              {" "}
              / {event.capacity}
            </span>
          )}

      </td>


      {/* ACTIONS */}

      <td className="px-6 py-5">

        <div className="flex flex-wrap gap-2">

          <Link
            to={`/events/${event.id}`}
            title="View Event"
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-700 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <Eye size={16} />
            View
          </Link>


          <Link
            to={`/organizer/events/${event.id}/edit`}
            title="Edit Event"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Edit size={16} />
            Edit
          </Link>


          <Link
            to={`/organizer/events/${event.id}/participants`}
            title="Participants"
            className="inline-flex items-center gap-1 rounded-lg border border-green-700 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
          >
            <Users size={16} />
            Participants
          </Link>


          <button
            type="button"
            onClick={() =>
              onCancel(event.id)
            }
            disabled={cancelling}
            className="inline-flex items-center gap-1 rounded-lg border border-red-600 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ban size={16} />

            {cancelling
              ? "Cancelling..."
              : "Cancel"}

          </button>

        </div>

      </td>

    </tr>
  );
}



function DashboardCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

        </div>


        <div className="rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 p-3 text-fuchsia-700">
          {icon}
        </div>

      </div>

    </div>
  );
}



function SmallStat({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-4">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>


        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>

      </div>

    </div>
  );
}



function StatusBadge({ status }) {
  const classes = {
    APPROVED:
      "bg-green-100 text-green-700",

    PENDING:
      "bg-amber-100 text-amber-700",

    REJECTED:
      "bg-red-100 text-red-700",

    CANCELLED:
      "bg-slate-200 text-slate-700",

    DRAFT:
      "bg-blue-100 text-blue-700",
  };


  const labels = {
    APPROVED: "Approved",
    PENDING: "Pending",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    DRAFT: "Draft",
  };


  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        classes[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}



function TableHeader({ children }) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}



function EmptyEvents() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">

      <CalendarDays
        size={50}
        className="mx-auto text-slate-400"
      />


      <h3 className="mt-5 text-xl font-bold text-slate-900">
        No events created yet
      </h3>


      <p className="mt-2 text-slate-500">
        Create your first event and start
        connecting with your community.
      </p>


      <Link
        to="/organizer/events/create"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
      >
        <Plus size={18} />
        Create Event
      </Link>

    </div>
  );
}


function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">

      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      <p className="mb-5 mt-1 text-sm text-slate-500">
        {subtitle}
      </p>

      {children}

    </section>
  );
}



function DonutChart({ data }) {
  return (
    <>

      <div className="h-56 w-full">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                />
              ))}
            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>


      <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">

        {data.map((entry) => (
          <li
            key={entry.name}
            className="flex items-center gap-2 text-sm text-slate-600"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: entry.color,
              }}
            />
            <span className="font-medium">
              {entry.name}
            </span>
            <span className="font-bold text-slate-900">
              {entry.value}
            </span>
          </li>
        ))}

      </ul>

    </>
  );
}



function EmptyChart() {
  return (
    <div className="py-12 text-center text-slate-500">
      No data available yet.
    </div>
  );
}



function utilizationColor(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "bg-slate-300";
  }

  if (value >= 100) {
    return "bg-red-500";
  }

  if (value >= 80) {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}


export default OrganizerDashboard;