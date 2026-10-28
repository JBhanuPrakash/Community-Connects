import {
  CalendarDays,
  CheckCircle,
  Mail,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/axios";
import { RowItemSkeleton } from "../components/Skeleton";

function EventParticipants() {
  const { id } = useParams();

  const [participants, setParticipants] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadParticipants = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/organizer/events/${id}/participants/`,
          {
            params: statusFilter
              ? { status: statusFilter }
              : {},
          },
        );

        setParticipants(response.data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Unable to load event participants.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [id, statusFilter]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
            Organizer
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Event Participants
          </h1>

          <p className="mt-3 text-slate-600">
            View registered users and their registration status.
          </p>
        </div>

        <Link
          to="/organizer/dashboard"
          className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Total participants
          </p>

          <p className="text-3xl font-bold text-slate-900">
            {participants.length}
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
        >
          <option value="">All statuses</option>
          <option value="REGISTERED">Registered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ATTENDED">Attended</option>
          <option value="ABSENT">Absent</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <RowItemSkeleton rows={5} />
      ) : !error && participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500">
            No participants found.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>User</TableHeading>
                  <TableHeading>Email</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Registered At</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {participants.map((participant) => (
                  <tr
                    key={participant.id}
                    className="hover:bg-slate-50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-indigo-50 p-2 text-indigo-700">
                          <User size={18} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {participant.full_name}
                          </p>

                          <p className="text-sm text-slate-500">
                            @{participant.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail size={16} />
                        {participant.email}
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={participant.status} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays size={16} />
                        {new Date(
                          participant.registered_at,
                        ).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function TableHeading({ children }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return (
    <td className="whitespace-nowrap px-6 py-5">
      {children}
    </td>
  );
}

function StatusBadge({ status }) {
  const config = {
    REGISTERED: {
      classes: "bg-green-100 text-green-700",
      icon: <CheckCircle size={14} />,
    },
    CANCELLED: {
      classes: "bg-red-100 text-red-700",
      icon: <XCircle size={14} />,
    },
    ATTENDED: {
      classes: "bg-blue-100 text-blue-700",
      icon: <CheckCircle size={14} />,
    },
    ABSENT: {
      classes: "bg-slate-100 text-slate-700",
      icon: <XCircle size={14} />,
    },
  };

  const selected =
    config[status] || config.REGISTERED;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${selected.classes}`}
    >
      {selected.icon}
      {status}
    </span>
  );
}

export default EventParticipants;