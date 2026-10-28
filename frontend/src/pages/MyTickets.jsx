import { Ticket } from "lucide-react";
import { useEffect, useState } from "react";

import api from "../api/axios";
import TicketCard from "../components/TicketCard";

function MyTickets() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] =
    useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRegistrations = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          "/registrations/",
        );

        setRegistrations(
          response.data.results ||
            response.data ||
            [],
        );
      } catch (requestError) {
        setError(
          requestError.response?.data?.detail ||
            "Unable to load your tickets.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();
  }, []);

  const downloadTicket = async (registration) => {
    setDownloadingId(registration.id);
    setError("");

    try {
      const response = await api.get(
        `/registrations/${registration.id}/ticket/pdf/`,
        {
          responseType: "blob",
        },
      );

      const fileUrl = URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        }),
      );

      const downloadLink =
        document.createElement("a");

      downloadLink.href = fileUrl;
      downloadLink.download =
        `communityconnect-ticket-${registration.id}.pdf`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(fileUrl);
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (responseData instanceof Blob) {
        const text = await responseData.text();

        try {
          const parsed = JSON.parse(text);
          setError(
            parsed.detail ||
              "Unable to download the ticket.",
          );
        } catch {
          setError("Unable to download the ticket.");
        }
      } else {
        setError(
          responseData?.detail ||
            "Unable to download the ticket.",
        );
      }
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading tickets...
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
          My Account
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          My Tickets
        </h1>

        <p className="mt-3 text-slate-600">
          View your event tickets, QR codes and downloadable
          PDF copies.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      {!error && registrations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <Ticket
            size={48}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            No tickets found
          </h2>

          <p className="mt-2 text-slate-500">
            Register for an event to receive your first ticket.
          </p>
        </div>
      ) : (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {registrations.map((registration) => (
            <div
              key={registration.id}
              className={
                downloadingId === registration.id
                  ? "opacity-60"
                  : ""
              }
            >
              <TicketCard
                registration={registration}
                onDownload={downloadTicket}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyTickets;