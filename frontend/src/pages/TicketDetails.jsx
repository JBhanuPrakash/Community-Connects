import {
  CalendarDays,
  Download,
  MapPin,
  Ticket,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/axios";

function TicketDetails() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let generatedQrUrl = "";

    const loadTicket = async () => {
      setTicket(null);
      setQrUrl("");
      setLoading(true);
      setError("");

      try {
        const [ticketResponse, qrResponse] =
          await Promise.all([
            api.get(
              `/registrations/${id}/ticket/`,
            ),
            api.get(
              `/registrations/${id}/ticket/qr/`,
              {
                responseType: "blob",
              },
            ),
          ]);

        setTicket(ticketResponse.data);

        generatedQrUrl = URL.createObjectURL(
          new Blob([qrResponse.data], {
            type: "image/png",
          }),
        );

        setQrUrl(generatedQrUrl);
      } catch (requestError) {
        setError(
          requestError.response?.data?.detail ||
            "Unable to load this ticket.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadTicket();

    return () => {
      if (generatedQrUrl) {
        URL.revokeObjectURL(generatedQrUrl);
      }
    };
  }, [id]);

  const downloadPdf = async () => {
    setDownloading(true);
    setError("");

    try {
      const response = await api.get(
        `/registrations/${id}/ticket/pdf/`,
        {
          responseType: "blob",
        },
      );

      const fileUrl = URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        }),
      );

      const link = document.createElement("a");

      link.href = fileUrl;
      link.download =
        `communityconnect-ticket-${id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(fileUrl);
    } catch {
      setError("Unable to download the ticket.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl bg-red-50 p-8 text-center text-red-700">
          {error || "Ticket not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
            Official Event Ticket
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            CommunityConnect
          </h1>
        </div>

        <div className="grid gap-10 p-8 md:grid-cols-[1fr_250px]">
          <div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              {ticket.status}
            </span>

            <h2 className="mt-5 text-3xl font-bold text-slate-900">
              {ticket.event_title}
            </h2>

            <div className="mt-8 space-y-5">
              <TicketInfo
                icon={<User size={20} />}
                label="Attendee"
                value={ticket.user_full_name}
              />

              <TicketInfo
                icon={<CalendarDays size={20} />}
                label="Date and Time"
                value={new Date(
                  ticket.event_start_datetime,
                ).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />

              <TicketInfo
                icon={<MapPin size={20} />}
                label="Location"
                value={
                  ticket.event_mode === "ONLINE"
                    ? "Online Event"
                    : [
                        ticket.event_venue_name,
                        ticket.event_city,
                      ]
                        .filter(Boolean)
                        .join(", ")
                }
              />

              <TicketInfo
                icon={<Ticket size={20} />}
                label="Ticket Code"
                value={ticket.ticket_code}
                mono
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadPdf}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                <Download size={18} />

                {downloading
                  ? "Downloading..."
                  : "Download PDF"}
              </button>

              <Link
                to="/tickets"
                className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to My Tickets
              </Link>
            </div>
          </div>

          <aside className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 text-center">
            {qrUrl && (
              <img
                src={qrUrl}
                alt="Ticket QR code"
                loading="lazy"
                className="h-52 w-52"
              />
            )}

            <p className="mt-4 text-sm text-slate-500">
              Present this QR code at the event entrance.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function TicketInfo({
  icon,
  label,
  value,
  mono = false,
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <p
          className={`mt-1 break-all font-semibold text-slate-900 ${
            mono ? "font-mono text-sm" : ""
          }`}
        >
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}

export default TicketDetails;