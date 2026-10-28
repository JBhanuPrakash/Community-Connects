import {
  CalendarDays,
  Download,
  MapPin,
  QrCode,
  Ticket,
} from "lucide-react";
import { Link } from "react-router-dom";

function TicketCard({ registration, onDownload }) {
  const eventDate = new Date(
    registration.event_start_datetime,
  );

  return (
    <article className="glass-card glass-card-hover group overflow-hidden rounded-2xl shadow-sm transition-all duration-300 flex flex-col justify-between">
      {/* Event Image Banner */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {registration.event_banner ? (
          <img
            src={registration.event_banner}
            alt={registration.event_title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-indigo-50/30 text-indigo-600">
            <Ticket size={48} className="opacity-80 animate-pulse" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none" />
      </div>

      {/* Ticket Body */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                CommunityConnect Ticket
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                {registration.event_title}
              </h2>
            </div>

            <StatusBadge status={registration.status} />
          </div>

          <div className="mt-5 space-y-2.5 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-indigo-500" />

              <span>
                {eventDate.toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-indigo-500" />

              <span className="truncate">
                {registration.event_mode === "ONLINE"
                  ? "Online Event"
                  : [
                      registration.event_venue_name,
                      registration.event_city,
                    ]
                      .filter(Boolean)
                      .join(", ")}
              </span>
            </div>
          </div>
        </div>

        <div>
          {/* Virtual Ticket Stub Cut Divider */}
          <div className="relative my-5 flex items-center justify-between">
            <div className="absolute -left-7 -ml-0.5 h-5 w-3.5 rounded-r-full bg-[#fafbfe] border-r border-y border-slate-200/50" />
            <div className="w-full border-t-2 border-dashed border-slate-200/70" />
            <div className="absolute -right-7 -mr-0.5 h-5 w-3.5 rounded-l-full bg-[#fafbfe] border-l border-y border-slate-200/50" />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ticket Code
            </p>

            <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">
              {registration.ticket_code}
            </p>
          </div>

          {registration.status === "CANCELLED" ? (
            <div className="mt-6 rounded-xl bg-rose-50/50 border border-rose-100/40 px-4 py-3 text-center text-xs font-bold text-rose-600">
              This ticket is no longer valid.
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to={`/tickets/${registration.id}`}
                className="btn-premium inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98] transition-all"
              >
                <QrCode size={16} />
                View Ticket
              </Link>

              <button
                type="button"
                onClick={() => onDownload(registration)}
                className="btn-premium inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-indigo-600 shadow-sm hover:bg-indigo-50/50 active:scale-[0.98] transition-all"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const classes = {
    REGISTERED: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
    ATTENDED: "bg-blue-50 text-blue-700 border-blue-100/50",
    ABSENT: "bg-slate-50 text-slate-600 border-slate-200/50",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-100/50",
  };

  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
        classes[status] || "bg-slate-50 text-slate-600 border-slate-200/50"
      }`}
    >
      {status}
    </span>
  );
}

export default TicketCard;