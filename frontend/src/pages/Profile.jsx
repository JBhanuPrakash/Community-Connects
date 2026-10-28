import {
  AtSign,
  Building2,
  CalendarDays,
  CheckCircle,
  Edit,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
        <p className="text-slate-500">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Profile unavailable
          </h1>

          <p className="mt-3 text-slate-600">
            Please log in to view your profile.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${user.first_name || ""} ${
    user.last_name || ""
  }`.trim();

  const displayName = fullName || user.username;

  const roleLabel = getRoleLabel(user);

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(
        "en-IN",
        {
          month: "long",
          year: "numeric",
        },
      )
    : null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {/* Cover */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-r from-fuchsia-100 via-violet-100 to-amber-100">
          <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-fuchsia-300/40 blur-2xl" />
          <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-amber-300/30 blur-2xl" />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300/30 blur-2xl" />
        </div>

        <div className="relative px-6 pb-10 sm:px-8 lg:px-10">
          {/* Header */}
          <div className="-mt-16 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <ProfileImage user={user} />

              <div className="pb-2">
                <h1 className="text-gradient-sunset text-3xl font-bold sm:text-4xl">
                  {displayName}
                </h1>

                <p className="mt-1 flex items-center gap-1.5 text-slate-500">
                  <AtSign size={15} />
                  {user.username}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-sm font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200">
                    {roleLabel}
                  </span>

                  {user.is_email_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      <CheckCircle size={15} />
                      Email Verified
                    </span>
                  ) : (
                    <Link
                      to="/verify-email"
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 hover:bg-amber-200"
                    >
                      <Mail size={15} />
                      Verify Email
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/profile/edit"
                className="btn-sunset inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold"
              >
                <Edit size={18} />
                Edit Profile
              </Link>

              <Link
                to="/change-password"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-700"
              >
                <KeyRound size={18} />
                Change Password
              </Link>
            </div>
          </div>

          {/* Main content */}
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your account and contact details.
              </p>

              <div className="mt-7 grid gap-6 md:grid-cols-2">
                <ProfileInfo
                  icon={<User size={20} />}
                  label="Full Name"
                  value={fullName || "Not provided"}
                />

                <ProfileInfo
                  icon={<AtSign size={20} />}
                  label="Username"
                  value={`@${user.username}`}
                />

                <ProfileInfo
                  icon={<Mail size={20} />}
                  label="Email Address"
                  value={user.email || "Not provided"}
                />

                <ProfileInfo
                  icon={<Phone size={20} />}
                  label="Phone Number"
                  value={user.phone_number || "Not provided"}
                />

                <ProfileInfo
                  icon={<MapPin size={20} />}
                  label="City"
                  value={user.city || "Not provided"}
                />

                <ProfileInfo
                  icon={<ShieldCheck size={20} />}
                  label="Account Role"
                  value={roleLabel}
                />

                <ProfileInfo
                  icon={<CalendarDays size={20} />}
                  label="Member Since"
                  value={memberSince || "Not available"}
                />

                <ProfileInfo
                  icon={<CheckCircle size={20} />}
                  label="Email Status"
                  value={
                    user.is_email_verified
                      ? "Verified"
                      : "Not verified"
                  }
                  valueClassName={
                    user.is_email_verified
                      ? "text-green-700"
                      : "text-amber-700"
                  }
                />
              </div>
            </div>

            {/* Quick links */}
            <aside className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Jump to your tools.
              </p>

              <div className="mt-6 space-y-3">
                {!user.is_email_verified && (
                  <QuickActionLink
                    to="/verify-email"
                    icon={<Mail size={18} />}
                    title="Verify Email"
                    description="Verify your email using OTP"
                  />
                )}

                {user.role === "ORGANIZER" && (
                  <QuickActionLink
                    to="/organizer/profile"
                    icon={<Building2 size={18} />}
                    title="Organization Profile"
                    description="Manage organization information"
                  />
                )}

                {user.role === "ORGANIZER" && (
                  <QuickActionLink
                    to="/organizer/dashboard"
                    icon={<CalendarDays size={18} />}
                    title="Organizer Dashboard"
                    description="Manage your events and insights"
                  />
                )}

                {user.role === "USER" && (
                  <QuickActionLink
                    to="/dashboard"
                    icon={<User size={18} />}
                    title="User Dashboard"
                    description="View registrations and saved events"
                  />
                )}

                {(user.role === "ADMIN" ||
                  user.is_staff ||
                  user.is_superuser) && (
                  <QuickActionLink
                    to="/admin/dashboard"
                    icon={<ShieldCheck size={18} />}
                    title="Admin Dashboard"
                    description="Manage platform activities"
                  />
                )}
              </div>
            </aside>
          </div>

          {/* About Me */}
          <div className="mt-8 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">
              About Me
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              A short introduction shown on your
              profile.
            </p>

            <p className="mt-5 whitespace-pre-line leading-7 text-slate-600">
              {user.bio ||
                "No biography has been added yet. Use the Edit Profile option to add information about yourself."}
            </p>
          </div>

          {/* Organizer banner */}
          {user.role === "ORGANIZER" && (
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-fuchsia-50 to-amber-50 p-6 ring-1 ring-fuchsia-100">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-amber-400/20 p-3 text-fuchsia-700 shadow-sm">
                    <Building2 size={26} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Organizer Information
                    </h2>

                    <p className="mt-2 text-slate-600">
                      Add your organization name, website,
                      description, address and verification
                      document.
                    </p>
                  </div>
                </div>

                <Link
                  to="/organizer/profile"
                  className="btn-sunset rounded-lg px-5 py-3 text-center font-semibold"
                >
                  Manage Organization
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProfileImage({ user }) {
  return (
    <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg ring-4 ring-fuchsia-500/30">
      {user.profile_image ? (
        <img
          src={user.profile_image}
          alt={`${user.username} profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-fuchsia-600">
          <User size={48} />
        </div>
      )}
    </div>
  );
}

function ProfileInfo({
  icon,
  label,
  value,
  valueClassName = "text-slate-800",
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 p-2 text-fuchsia-700">
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <p className={`mt-1 font-semibold ${valueClassName}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickActionLink({
  to,
  icon,
  title,
  description,
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-fuchsia-300 hover:bg-fuchsia-50"
    >
      <span className="mt-1 text-fuchsia-600">
        {icon}
      </span>

      <div>
        <p className="font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>
    </Link>
  );
}

function getRoleLabel(user) {
  if (user.is_superuser || user.is_staff) {
    return "Administrator";
  }

  if (user.role === "ORGANIZER") {
    return "Organizer";
  }

  if (user.role === "ADMIN") {
    return "Administrator";
  }

  return "User";
}

export default Profile;