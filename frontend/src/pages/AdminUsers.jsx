import {
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";
import { RowItemSkeleton } from "../components/Skeleton";


function AdminUsers() {
  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  const fetchUsers = useCallback(
    async () => {
      const params = {};

      if (roleFilter !== "ALL") {
        params.role = roleFilter;
      }

      const response = await api.get(
        "/auth/admin/users/",
        {
          params,
        },
      );

      const data =
        response.data.results ||
        response.data ||
        [];

      return Array.isArray(data)
        ? data
        : [];
    },
    [roleFilter],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setError("");

      try {
        const users = await fetchUsers();

        if (active) {
          setUsers(users);
        }
      } catch (requestError) {
        console.error(
          "Admin users error:",
          requestError.response?.data ||
            requestError,
        );

        if (active) {
          setError(
            requestError.response?.data
              ?.detail ||
              "Unable to load users.",
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
  }, [fetchUsers]);


  const handleToggleStatus =
    async (user) => {
      const action =
        user.is_active
          ? "deactivate"
          : "activate";

      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} ${user.username}?`,
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(user.id);
      setError("");
      setMessage("");

      try {
        const response =
          await api.post(
            `/auth/admin/users/${user.id}/toggle-status/`,
          );

        setMessage(
          response.data.message ||
            "User status updated successfully.",
        );

        setUsers(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                user.id
                  ? response.data.user
                  : item,
            ),
        );
      } catch (requestError) {
        setError(
          requestError.response?.data
            ?.detail ||
            "Unable to update user status.",
        );
      } finally {
        setProcessingId(null);
      }
    };


  const filteredUsers =
    users.filter((user) => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        user.username
          ?.toLowerCase()
          .includes(query) ||
        user.email
          ?.toLowerCase()
          .includes(query) ||
        user.full_name
          ?.toLowerCase()
          .includes(query) ||
        user.city
          ?.toLowerCase()
          .includes(query)
      );
    });


  return (
    <section className="mx-auto max-w-7xl px-6 py-12">

      <div className="mb-8">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          Manage Users
        </h1>

        <p className="mt-3 text-slate-600">
          View users, organizers and
          administrators and manage their
          account status.
        </p>

      </div>


      {message && (
        <div className="mb-6 rounded-xl bg-green-50 px-5 py-4 text-green-700">
          {message}
        </div>
      )}


      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}


      {/* FILTERS */}

      <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex flex-wrap gap-2">

            <FilterButton
              label="All"
              value="ALL"
              active={
                roleFilter ===
                "ALL"
              }
              onClick={
                setRoleFilter
              }
            />

            <FilterButton
              label="Users"
              value="USER"
              active={
                roleFilter ===
                "USER"
              }
              onClick={
                setRoleFilter
              }
            />

            <FilterButton
              label="Organizers"
              value="ORGANIZER"
              active={
                roleFilter ===
                "ORGANIZER"
              }
              onClick={
                setRoleFilter
              }
            />

            <FilterButton
              label="Admins"
              value="ADMIN"
              active={
                roleFilter ===
                "ADMIN"
              }
              onClick={
                setRoleFilter
              }
            />

          </div>


          <div className="relative w-full lg:w-80">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search users..."
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
            />

          </div>

        </div>

      </section>


      {loading ? (
        <RowItemSkeleton rows={5} />
      ) : !error && filteredUsers.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

          <Users
            size={45}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No users found
          </h2>

          <p className="mt-2 text-slate-500">
            No accounts match the selected
            filter.
          </p>

        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-slate-50">

                <tr>
                  <TableHeader>
                    User
                  </TableHeader>

                  <TableHeader>
                    Role
                  </TableHeader>

                  <TableHeader>
                    City
                  </TableHeader>

                  <TableHeader>
                    Email Verified
                  </TableHeader>

                  <TableHeader>
                    Account Status
                  </TableHeader>

                  <TableHeader>
                    Created
                  </TableHeader>

                  <TableHeader>
                    Action
                  </TableHeader>
                </tr>

              </thead>


              <tbody className="divide-y divide-slate-200">

                {filteredUsers.map(
                  (user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      processing={
                        processingId ===
                        user.id
                      }
                      onToggleStatus={
                        handleToggleStatus
                      }
                    />
                  ),
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </section>
  );
}



function UserRow({
  user,
  processing,
  onToggleStatus,
}) {
  return (
    <tr className="hover:bg-slate-50">

      <td className="px-6 py-5">

        <div>

          <p className="font-semibold text-slate-900">
            {user.full_name ||
              user.username}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            @{user.username}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {user.email}
          </p>

        </div>

      </td>


      <td className="px-6 py-5">

        <RoleBadge
          role={user.role}
        />

      </td>


      <td className="px-6 py-5 text-sm text-slate-600">
        {user.city ||
          "Not provided"}
      </td>


      <td className="px-6 py-5">

        {user.is_email_verified ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">

            <UserCheck
              size={16}
            />

            Verified

          </span>
        ) : (
          <span className="text-sm font-semibold text-amber-700">
            Not Verified
          </span>
        )}

      </td>


      <td className="px-6 py-5">

        {user.is_active ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Inactive
          </span>
        )}

      </td>


      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">

        {user.created_at
          ? new Date(
              user.created_at,
            ).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            )
          : "-"}

      </td>


      <td className="px-6 py-5">

        {user.is_superuser ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">

            <ShieldCheck
              size={16}
            />

            Protected

          </span>
        ) : (
          <button
            type="button"
            disabled={processing}
            onClick={() =>
              onToggleStatus(
                user,
              )
            }
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              user.is_active
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >

            {user.is_active ? (
              <>
                <UserX
                  size={16}
                />

                {processing
                  ? "Processing..."
                  : "Deactivate"}
              </>
            ) : (
              <>
                <UserCheck
                  size={16}
                />

                {processing
                  ? "Processing..."
                  : "Activate"}
              </>
            )}

          </button>
        )}

      </td>

    </tr>
  );
}



function RoleBadge({
  role,
}) {
  const classes = {
    USER:
      "bg-blue-100 text-blue-700",

    ORGANIZER:
      "bg-purple-100 text-purple-700",

    ADMIN:
      "bg-red-100 text-red-700",
  };


  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        classes[role] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {role}
    </span>
  );
}



function FilterButton({
  label,
  value,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onClick(value)
      }
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-indigo-700 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}



function TableHeader({
  children,
}) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}


export default AdminUsers;