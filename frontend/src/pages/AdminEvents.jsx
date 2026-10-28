import {
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Star,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import api from "../api/axios";
import { RowItemSkeleton } from "../components/Skeleton";


function AdminEvents() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialStatus =
    searchParams.get("status") || "ALL";

  const [events, setEvents] =
    useState([]);

  const [statusFilter, setStatusFilter] =
    useState(
      initialStatus.toUpperCase(),
    );

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    rejectModal,
    setRejectModal,
  ] = useState({
    open: false,
    event: null,
  });

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");


  const fetchEventsData = useCallback(
    async () => {
      const params = {};

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const response = await api.get(
        "/admin/events/",
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
    [statusFilter],
  );

  const loadEvents = async () => {
    try {
      const data = await fetchEventsData();

      setEvents(data);
    } catch (requestError) {
      console.error(
        "Admin events error:",
        requestError.response?.data ||
          requestError,
      );

      setError(
        requestError.response?.data
          ?.detail ||
          "Unable to load admin events.",
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
          await fetchEventsData();

        if (active) {
          setEvents(data);
        }
      } catch (requestError) {
        console.error(
          "Admin events error:",
          requestError.response?.data ||
            requestError,
        );

        if (active) {
          setError(
            requestError.response?.data
              ?.detail ||
              "Unable to load admin events.",
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
  }, [fetchEventsData]);


  const handleStatusChange = (
    status,
  ) => {
    setStatusFilter(status);

    if (status === "ALL") {
      setSearchParams({});
    } else {
      setSearchParams({
        status,
      });
    }

    setMessage("");
    setError("");
  };


  const handleApprove = async (
    eventId,
  ) => {
    const confirmed =
      window.confirm(
        "Approve this event?",
      );

    if (!confirmed) {
      return;
    }

    setProcessingId(eventId);
    setError("");
    setMessage("");

    try {
      const response =
        await api.post(
          `/admin/events/${eventId}/approve/`,
        );

      setMessage(
        response.data.message ||
          "Event approved successfully.",
      );

      await loadEvents();
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.detail ||
          "Unable to approve this event.",
      );
    } finally {
      setProcessingId(null);
    }
  };


  const openRejectModal = (
    event,
  ) => {
    setRejectModal({
      open: true,
      event,
    });

    setRejectionReason("");
    setError("");
  };


  const closeRejectModal = () => {
    setRejectModal({
      open: false,
      event: null,
    });

    setRejectionReason("");
  };


  const handleReject = async () => {
    const event =
      rejectModal.event;

    if (!event) {
      return;
    }

    if (
      !rejectionReason.trim()
    ) {
      setError(
        "Please enter a rejection reason.",
      );

      return;
    }

    setProcessingId(event.id);
    setError("");
    setMessage("");

    try {
      const response =
        await api.post(
          `/admin/events/${event.id}/reject/`,
          {
            rejection_reason:
              rejectionReason.trim(),
          },
        );

      setMessage(
        response.data.message ||
          "Event rejected successfully.",
      );

      closeRejectModal();

      await loadEvents();
    } catch (requestError) {
      const apiError =
        requestError.response?.data;

      setError(
        apiError?.detail ||
          apiError?.rejection_reason ||
          "Unable to reject this event.",
      );
    } finally {
      setProcessingId(null);
    }
  };


  const handleToggleFeatured =
    async (eventId) => {
      setProcessingId(eventId);
      setError("");
      setMessage("");

      try {
        const response =
          await api.post(
            `/admin/events/${eventId}/featured/`,
          );

        setMessage(
          response.data.message ||
            "Featured status updated.",
        );

        await loadEvents();
      } catch (requestError) {
        setError(
          requestError.response?.data
            ?.detail ||
            "Unable to update featured status.",
        );
      } finally {
        setProcessingId(null);
      }
    };


  const filteredEvents =
    events.filter((event) => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        event.title
          ?.toLowerCase()
          .includes(query) ||
        event.organizer_username
          ?.toLowerCase()
          .includes(query) ||
        event.category_name
          ?.toLowerCase()
          .includes(query) ||
        event.city
          ?.toLowerCase()
          .includes(query)
      );
    });


  return (
    <section className="mx-auto max-w-7xl px-6 py-12">

      {/* HEADER */}

      <div className="mb-8">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          Manage Events
        </h1>

        <p className="mt-3 text-slate-600">
          Review, approve, reject,
          and manage submitted events.
        </p>

      </div>


      {/* SUCCESS */}

      {message && (
        <div className="mb-6 rounded-xl bg-green-50 px-5 py-4 text-green-700">
          {message}
        </div>
      )}


      {/* ERROR */}

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
                statusFilter ===
                "ALL"
              }
              onClick={
                handleStatusChange
              }
            />


            <FilterButton
              label="Pending"
              value="PENDING"
              active={
                statusFilter ===
                "PENDING"
              }
              onClick={
                handleStatusChange
              }
            />


            <FilterButton
              label="Approved"
              value="APPROVED"
              active={
                statusFilter ===
                "APPROVED"
              }
              onClick={
                handleStatusChange
              }
            />


            <FilterButton
              label="Rejected"
              value="REJECTED"
              active={
                statusFilter ===
                "REJECTED"
              }
              onClick={
                handleStatusChange
              }
            />


            <FilterButton
              label="Cancelled"
              value="CANCELLED"
              active={
                statusFilter ===
                "CANCELLED"
              }
              onClick={
                handleStatusChange
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
              placeholder="Search events..."
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
            />

          </div>

        </div>

      </section>


      {/* TABLE */}

      {loading ? (
        <RowItemSkeleton rows={5} />
      ) : !error && filteredEvents.length ===
        0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

          <CalendarDays
            size={45}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No events found
          </h2>

          <p className="mt-2 text-slate-500">
            No events match the
            selected filter.
          </p>

        </div>
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
                    Organizer
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

                {filteredEvents.map(
                  (event) => (
                    <AdminEventRow
                      key={event.id}
                      event={event}
                      processing={
                        processingId ===
                        event.id
                      }
                      onApprove={
                        handleApprove
                      }
                      onReject={
                        openRejectModal
                      }
                      onToggleFeatured={
                        handleToggleFeatured
                      }
                    />
                  ),
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}


      {/* REJECT MODAL */}

      {rejectModal.open && (
        <RejectEventModal
          event={
            rejectModal.event
          }
          reason={
            rejectionReason
          }
          setReason={
            setRejectionReason
          }
          processing={
            processingId ===
            rejectModal.event?.id
          }
          onReject={
            handleReject
          }
          onClose={
            closeRejectModal
          }
        />
      )}

    </section>
  );
}



function AdminEventRow({
  event,
  processing,
  onApprove,
  onReject,
  onToggleFeatured,
}) {
  return (
    <tr className="hover:bg-slate-50">

      {/* EVENT */}

      <td className="px-6 py-5">

        <div className="flex items-center gap-4">

          <div className="h-14 w-20 overflow-hidden rounded-lg bg-slate-100">

            {event.banner_image ? (
              <img
                src={
                  event.banner_image
                }
                alt={event.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">

                <CalendarDays
                  size={22}
                />

              </div>
            )}

          </div>


          <div className="min-w-[180px]">

            <p className="font-semibold text-slate-900">
              {event.title}
            </p>


            <p className="mt-1 text-xs text-slate-500">
              {event.mode}
            </p>


            {event.is_featured && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">

                <Star size={12} />

                Featured

              </span>
            )}

          </div>

        </div>

      </td>


      {/* ORGANIZER */}

      <td className="px-6 py-5">

        <p className="font-medium text-slate-800">
          {event.organizer_username}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {event.organizer_email}
        </p>

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


      {/* REGISTRATION */}

      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
        {event.registration_count ??
          0}
      </td>


      {/* ACTIONS */}

      <td className="px-6 py-5">

        <div className="flex min-w-[260px] flex-wrap gap-2">

          {/* VIEW */}

          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Eye size={16} />

            View
          </Link>


          {/* PENDING ACTIONS */}

          {event.status ===
            "PENDING" && (
            <>
              <button
                type="button"
                disabled={
                  processing
                }
                onClick={() =>
                  onApprove(
                    event.id,
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle
                  size={16}
                />

                Approve
              </button>


              <button
                type="button"
                disabled={
                  processing
                }
                onClick={() =>
                  onReject(
                    event,
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle
                  size={16}
                />

                Reject
              </button>

            </>
          )}


          {/* FEATURED */}

          {event.status ===
            "APPROVED" && (
            <button
              type="button"
              disabled={
                processing
              }
              onClick={() =>
                onToggleFeatured(
                  event.id,
                )
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                event.is_featured
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-indigo-500 text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              <Star
                size={16}
              />

              {event.is_featured
                ? "Unfeature"
                : "Feature"}
            </button>
          )}

        </div>


        {event.status ===
          "REJECTED" &&
          event.rejection_reason && (
            <p className="mt-3 max-w-xs text-xs leading-5 text-red-600">

              Reason:{" "}
              {
                event.rejection_reason
              }

            </p>
          )}

      </td>

    </tr>
  );
}



function RejectEventModal({
  event,
  reason,
  setReason,
  processing,
  onReject,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">

      <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">

        <h2 className="text-2xl font-bold text-slate-900">
          Reject Event
        </h2>


        <p className="mt-2 text-slate-500">
          You are rejecting:
        </p>


        <p className="mt-1 font-semibold text-slate-900">
          {event?.title}
        </p>


        <div className="mt-6">

          <label
            htmlFor="rejection-reason"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Rejection Reason
          </label>


          <textarea
            id="rejection-reason"
            rows={5}
            value={reason}
            onChange={(
              event,
            ) =>
              setReason(
                event.target.value,
              )
            }
            placeholder="Explain why this event is being rejected..."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
          />

        </div>


        <div className="mt-6 flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>


          <button
            type="button"
            onClick={onReject}
            disabled={
              processing ||
              !reason.trim()
            }
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {processing
              ? "Rejecting..."
              : "Reject Event"}
          </button>

        </div>

      </div>

    </div>
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



function StatusBadge({
  status,
}) {
  const classes = {
    PENDING:
      "bg-amber-100 text-amber-700",

    APPROVED:
      "bg-green-100 text-green-700",

    REJECTED:
      "bg-red-100 text-red-700",

    CANCELLED:
      "bg-slate-200 text-slate-700",

    DRAFT:
      "bg-blue-100 text-blue-700",
  };


  const icons = {
    PENDING: (
      <Clock size={13} />
    ),

    APPROVED: (
      <CheckCircle
        size={13}
      />
    ),

    REJECTED: (
      <XCircle
        size={13}
      />
    ),

    CANCELLED: (
      <XCircle
        size={13}
      />
    ),
  };


  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        classes[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {icons[status]}

      {status}
    </span>
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


export default AdminEvents;