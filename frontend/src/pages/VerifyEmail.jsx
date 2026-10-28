import { CheckCircle, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function VerifyEmail() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setSending(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post(
        "/auth/email/send-otp/",
        {},
      );

      setOtpSent(true);
      setMessage(
        response.data.message ||
          "Verification OTP sent successfully.",
      );
    } catch (requestError) {
      const apiError = requestError.response?.data;

      setError(
        apiError?.detail ||
          apiError?.non_field_errors?.[0] ||
          (typeof apiError === "string"
            ? apiError
            : "Unable to send verification OTP."),
      );
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();

    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setVerifying(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post(
        "/auth/email/verify-otp/",
        {
          otp: otp.trim(),
        },
      );

      await refreshProfile();

      setMessage(
        response.data.message ||
          "Email verified successfully.",
      );

      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (requestError) {
      const apiError = requestError.response?.data;

      setError(
        apiError?.otp?.[0] ||
          apiError?.non_field_errors?.[0] ||
          apiError?.detail ||
          "Unable to verify the OTP.",
      );
    } finally {
      setVerifying(false);
    }
  };

  if (user?.is_email_verified) {
    return (
      <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
          <CheckCircle
            size={56}
            className="mx-auto text-green-600"
          />

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Email already verified
          </h1>

          <p className="mt-3 text-slate-600">
            Your email address has already been verified.
          </p>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="mt-7 rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800"
          >
            Return to Profile
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
            <Mail size={30} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Verify Your Email
          </h1>

          <p className="mt-3 text-slate-600">
            We will send a 6-digit OTP to:
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {user?.email}
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!otpSent ? (
          <button
            type="button"
            onClick={sendOtp}
            disabled={sending}
            className="mt-8 w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending OTP..." : "Send Verification OTP"}
          </button>
        ) : (
          <form
            onSubmit={verifyOtp}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Verification OTP
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="Enter 6-digit OTP"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify Email"}
            </button>

            <button
              type="button"
              onClick={sendOtp}
              disabled={sending}
              className="w-full rounded-lg border border-indigo-700 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Resend OTP"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          During development, the OTP appears in the Django terminal
          because real email delivery is currently postponed.
        </p>
      </div>
    </section>
  );
}

export default VerifyEmail;