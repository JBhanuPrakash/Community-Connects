import {
  CalendarDays,
  CheckCircle,
  Clock,
  Star,
  Tags,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api/axios";

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    const response = await api.get("/admin/analytics/");

    return response.data;
  }, []);

  useEffect(() => {
    let active = true;

    fetchAnalytics()
      .then((data) => {
        if (active) {
          setAnalytics(data);
          setLoading(false);
        }
      })
      .catch((requestError) => {
        if (active) {
          console.error(
            "Admin analytics error:",
            requestError.response?.data || requestError,
          );

          setError(
            requestError.response?.data?.detail ||
              "Unable to load admin analytics.",
          );

          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-slate-500">Loading admin dashboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* HEADER */}

      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <p className="mt-3 text-slate-600">
          Monitor users, organizers, events, registrations and platform
          activity.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-8 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      {analytics && (
        <>
          {/* MAIN STATISTICS */}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AdminStatCard
              title="Total Users"
              value={analytics.users?.total_users ?? 0}
              icon={<Users size={24} />}
            />

            <AdminStatCard
              title="Organizers"
              value={analytics.users?.total_organizers ?? 0}
              icon={<UserCheck size={24} />}
            />

            <AdminStatCard
              title="Total Events"
              value={analytics.events?.total ?? 0}
              icon={<CalendarDays size={24} />}
            />

            <AdminStatCard
              title="Pending Events"
              value={analytics.events?.pending ?? 0}
              icon={<Clock size={24} />}
            />

            <AdminStatCard
              title="Approved Events"
              value={analytics.events?.approved ?? 0}
              icon={<CheckCircle size={24} />}
            />

            <AdminStatCard
              title="Registrations"
              value={analytics.registrations?.total ?? 0}
              icon={<Users size={24} />}
            />

            <AdminStatCard
              title="Attended"
              value={analytics.registrations?.attended ?? 0}
              icon={<UserCheck size={24} />}
            />

            <AdminStatCard
              title="Categories"
              value={analytics.categories?.total ?? 0}
              icon={<Tags size={24} />}
            />

            <AdminStatCard
              title="Reviews"
              value={analytics.reviews?.total ?? 0}
              icon={<Star size={24} />}
            />
          </div>

          {/* QUICK MANAGEMENT */}

          <section className="mb-10">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Quick Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Access frequently used administrative sections.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction
                title="Manage Users"
                description="View and manage platform users."
                path="/admin/users"
                icon={<Users size={24} />}
              />

              <QuickAction
                title="Manage Events"
                description="Review all submitted events."
                path="/admin/events"
                icon={<CalendarDays size={24} />}
              />

              <QuickAction
                title="Pending Approvals"
                description="Approve or reject new events."
                path="/admin/events?status=PENDING"
                icon={<Clock size={24} />}
              />

              <QuickAction
                title="Categories"
                description="Create and manage categories."
                path="/admin/categories"
                icon={<Tags size={24} />}
              />
            </div>
          </section>

          {/* EVENT STATUS */}

          <section className="mb-10">
            <h2 className="mb-5 text-2xl font-bold text-slate-900">
              Event Status Overview
            </h2>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <SmallStatCard
                title="Approved"
                value={analytics.events?.approved ?? 0}
                icon={<CheckCircle size={20} />}
              />

              <SmallStatCard
                title="Pending"
                value={analytics.events?.pending ?? 0}
                icon={<Clock size={20} />}
              />

              <SmallStatCard
                title="Rejected"
                value={analytics.events?.rejected ?? 0}
                icon={<XCircle size={20} />}
              />

              <SmallStatCard
                title="Cancelled"
                value={analytics.events?.cancelled ?? 0}
                icon={<XCircle size={20} />}
              />
            </div>
          </section>

          {/* REGISTRATION STATUS */}

          <section className="mb-10">
            <h2 className="mb-5 text-2xl font-bold text-slate-900">
              Registration Overview
            </h2>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <SmallStatCard
                title="Total"
                value={analytics.registrations?.total ?? 0}
                icon={<Users size={20} />}
              />

              <SmallStatCard
                title="Active"
                value={analytics.registrations?.active ?? 0}
                icon={<Users size={20} />}
              />

              <SmallStatCard
                title="Attended"
                value={analytics.registrations?.attended ?? 0}
                icon={<UserCheck size={20} />}
              />

              <SmallStatCard
                title="Cancelled"
                value={analytics.registrations?.cancelled ?? 0}
                icon={<XCircle size={20} />}
              />
            </div>
          </section>

          {/* MONTHLY CHARTS */}

          <div className="mb-10 grid gap-8 lg:grid-cols-2">
            <AnalyticsBarChart
              title="Monthly Events"
              description="Events created each month."
              data={analytics.monthly_events || []}
              label="Events"
            />

            <AnalyticsBarChart
              title="Monthly Registrations"
              description="Event registrations each month."
              data={analytics.monthly_registrations || []}
              label="Registrations"
            />
          </div>

          {/* CATEGORY DISTRIBUTION */}

          <CategoryDistributionChart
            data={analytics.category_distribution || []}
          />
        </>
      )}
    </section>
  );
}

function AdminStatCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>

        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SmallStatCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

function QuickAction({ title, description, path, icon }) {
  return (
    <Link
      to={path}
      className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-700">
        {icon}
      </div>

      <h3 className="font-bold text-slate-900 group-hover:text-indigo-700">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}

function AnalyticsBarChart({ title, description, data, label }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>

        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {data.length > 0 ? (
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 12,
                }}
              />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Bar dataKey="count" name={label} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500">
          No data available yet.
        </div>
      )}
    </section>
  );
}

function CategoryDistributionChart({ data }) {
  return (
    <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Category Distribution
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Approved events grouped by category.
        </p>
      </div>

      {data.length > 0 ? (
        <div className="mt-6 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="event_count"
                nameKey="category_name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ category_name, event_count }) =>
                  `${category_name}: ${event_count}`
                }
              />

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500">
          No category data available yet.
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
