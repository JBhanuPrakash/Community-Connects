import { Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/axios";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(
        "/auth/forgot-password/",
        {
          email: email.trim(),
        },
      );

      setMessage(
        response.data.message ||
          "If an account exists for this email, an OTP has been sent.",
      );

      setTimeout(() => {
        navigate("/reset-password", {
          state: { email: email.trim() },
        });
      }, 2000);
    } catch (requestError) {
      const apiErrors = requestError.response?.data;

      setError(
        apiErrors?.email?.[0] ||
          apiErrors?.non_field_errors?.[0] ||
          apiErrors?.detail ||
          "Unable to send the password reset OTP.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg"
      >
        <div className="text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-700"
          >
            <Mail size={27} />
          </div>

          <h1
            className="mt-5 text-3xl font-bold text-slate-900"
          >
            Forgot Password
          </h1>

          <p
            className="mt-2 text-slate-500"
          >
            Enter your email address and we&apos;ll send you an
            OTP to reset your password.
          </p>
        </div>

        {message && (
          <div
            className="mt-6 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-xs font-semibold text-green-700"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="mt-6 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-semibold text-rose-600"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={submitting}
              placeholder="Enter your registered email"
              className="input-premium w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-premium btn-sunset w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div
          className="mt-7 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"
        >
          <ShieldCheck size={15} className="text-indigo-600" />
          You&apos;ll be redirected to reset your password after
          the OTP is sent.
        </div>

        <p
          className="mt-4 text-center text-xs font-semibold text-slate-500"
        >
          Remembered your password?{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default ForgotPassword;