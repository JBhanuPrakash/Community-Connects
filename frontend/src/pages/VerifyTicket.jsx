import {
  CalendarDays,
  Camera,
  CheckCircle,
  MapPin,
  Search,
  Ticket,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import api from "../api/axios";

function VerifyTicket() {
  const scannerRef = useRef(null);
  const processedCodeRef = useRef("");

  const [ticketCode, setTicketCode] = useState("");
  const [verification, setVerification] = useState(null);

  const [scannerEnabled, setScannerEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);

  const [markingAttendance, setMarkingAttendance] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [error, setError] = useState("");

  const verifyTicket = async (code) => {
    const cleanedCode = String(code || "").trim();

    if (!cleanedCode) {
      setError("Enter a ticket code.");
      return;
    }

    setLoading(true);
    setError("");
    setVerification(null);

    try {
      const response = await api.get(
        `/registrations/tickets/verify/${cleanedCode}/`,
      );

      setVerification(response.data);
    } catch (requestError) {
      const apiData = requestError.response?.data;

      if (apiData?.valid === false) {
        setVerification(apiData);
      } else {
        setError(apiData?.detail || "Unable to verify this ticket.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scannerEnabled) {
      return undefined;
    }

    Promise.resolve().then(() => setScannerLoading(true));

    const scanner = new Html5QrcodeScanner(
      "ticket-qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [],
      },
      false,
    );

    scannerRef.current = scanner;

    const onScanSuccess = async (decodedText) => {
      const extractedCode = extractTicketCode(decodedText);

      if (!extractedCode) {
        setError("This QR code is not a valid CommunityConnect ticket.");
        return;
      }

      if (processedCodeRef.current === extractedCode) {
        return;
      }

      processedCodeRef.current = extractedCode;

      setTicketCode(extractedCode);
      setScannerEnabled(false);

      await verifyTicket(extractedCode);
    };

    const onScanFailure = () => {
      // Scanning failures happen continuously while
      // the camera is searching. They can be ignored.
    };

    try {
      scanner.render(onScanSuccess, onScanFailure);
    } catch (scanError) {
      scannerRef.current = null;

      Promise.resolve().then(() => {
        setScannerEnabled(false);
        setScannerLoading(false);
        setError(
          scanError?.message ||
            "Unable to start the camera scanner.",
        );
      });

      return undefined;
    }

    Promise.resolve().then(() => setScannerLoading(false));

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});

        scannerRef.current = null;
      }
    };
  }, [scannerEnabled]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    processedCodeRef.current = "";

    await verifyTicket(ticketCode);
  };

  const startScanner = () => {
    setError("");
    setVerification(null);
    processedCodeRef.current = "";
    setScannerEnabled(true);
  };

  const stopScanner = async () => {
    setScannerEnabled(false);

    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch {
        // Scanner may already be stopped.
      }

      scannerRef.current = null;
    }
  };
  const markAttendance = async () => {
    const code = verification?.ticket?.ticket_code;

    if (!code) return;

    setMarkingAttendance(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await api.post(`/registrations/tickets/${code}/attend/`);

      setVerification((prev) => ({
        ...prev,
        ticket: response.data.registration,
      }));

      setSuccessMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to mark attendance.");
    } finally {
      setMarkingAttendance(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
          Organizer Check-in
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          Verify Event Ticket
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Scan the attendee&apos;s QR code or enter the ticket code manually.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Ticket Verification
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="ticket-code"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Ticket Code
              </label>

              <input
                id="ticket-code"
                type="text"
                value={ticketCode}
                onChange={(event) => setTicketCode(event.target.value)}
                placeholder="Enter ticket UUID"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
            >
              <Search size={18} />

              {loading ? "Verifying..." : "Verify Ticket"}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-sm text-slate-400">OR</span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {!scannerEnabled ? (
            <button
              type="button"
              onClick={startScanner}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-700 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <Camera size={19} />
              Scan QR Code
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanner}
              className="w-full rounded-lg border border-red-600 px-5 py-3 font-semibold text-red-600 hover:bg-red-50"
            >
              Stop Scanner
            </button>
          )}

          {scannerEnabled && (
            <div className="mt-6">
              {scannerLoading && (
                <p className="mb-3 text-center text-sm text-slate-500">
                  Starting camera...
                </p>
              )}

              <div
                id="ticket-qr-reader"
                className="overflow-hidden rounded-xl border border-slate-200"
              />

              <p className="mt-3 text-center text-sm text-slate-500">
                Allow camera access and place the QR code inside the scanning
                box.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 px-5 py-4 text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-6 rounded-xl bg-green-50 px-5 py-4 text-green-700">
              {successMessage}
            </div>
          )}
        </section>

        <section>
          {!verification ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div>
                <Ticket size={52} className="mx-auto text-slate-400" />

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  No ticket checked
                </h2>

                <p className="mt-2 text-slate-500">
                  Scan or enter a ticket code to see its verification result.
                </p>
              </div>
            </div>
          ) : (
            <VerificationResult
              verification={verification}
              markingAttendance={markingAttendance}
              onMarkAttendance={markAttendance}
            />
          )}
        </section>
      </div>
    </section>
  );
}

function VerificationResult({
  verification,
  markingAttendance,
  onMarkAttendance,
}) {
  if (!verification.valid) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
      <XCircle size={54} className="text-red-600" />

      <h2 className="mt-5 text-3xl font-bold text-red-800">
        Invalid Ticket
      </h2>

      <p className="mt-3 text-red-700">
        {verification.detail || "This ticket is not valid."}
      </p>
    </div>
    );
  }

  const ticket = verification.ticket;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="bg-green-600 p-7 text-white">
        <div className="flex items-center gap-3">
          <CheckCircle size={34} />

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-100">
              Verification Successful
            </p>

            <h2 className="mt-1 text-3xl font-bold">Valid Ticket</h2>
          </div>
        </div>
      </div>

      <div className="p-7">
        <h3 className="text-2xl font-bold text-slate-900">
          {ticket.event_title}
        </h3>

        <div className="mt-7 space-y-5">
          <ResultItem
            icon={<User size={20} />}
            label="Attendee"
            value={ticket.user_full_name || ticket.username}
          />

          <ResultItem
            icon={<Ticket size={20} />}
            label="Ticket Code"
            value={ticket.ticket_code}
            mono
          />

          <ResultItem
            icon={<CalendarDays size={20} />}
            label="Event Date"
            value={
              ticket.event_start_datetime
                ? new Date(ticket.event_start_datetime).toLocaleString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )
                : "Not available"
            }
          />

          <ResultItem
            icon={<MapPin size={20} />}
            label="Location"
            value={
              ticket.event_mode === "ONLINE"
                ? "Online Event"
                : [ticket.event_venue_name, ticket.event_city]
                    .filter(Boolean)
                    .join(", ")
            }
          />

          <ResultItem
            icon={<CheckCircle size={20} />}
            label="Status"
            value={ticket.status}
          />
          <div className="mt-8 border-t border-slate-200 pt-6">
  {ticket.status === "ATTENDED" ? (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-100 px-5 py-3 font-semibold text-blue-700">
      Attendance Already Marked
    </div>
  ) : (
    <button
      type="button"
      onClick={onMarkAttendance}
      disabled={markingAttendance}
      className="w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
    >
      {markingAttendance
        ? "Marking Attendance..."
        : "Mark as Attended"}
    </button>
  )}
</div>
        </div>
      </div>
    </div>
  );
}

function ResultItem({ icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-4">
      <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">{icon}</div>

      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>

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

function extractTicketCode(decodedText) {
  const value = String(decodedText || "").trim();

  const prefix = "COMMUNITYCONNECT-TICKET:";

  if (value.startsWith(prefix)) {
    return value.slice(prefix.length).trim();
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (uuidPattern.test(value)) {
    return value;
  }

  return "";
}

export default VerifyTicket;
