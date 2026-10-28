import {
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../api/axios";
import PasswordInput from "../components/PasswordInput";


function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    otp: "",
    new_password: "",
    confirm_new_password: "",
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);


  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
    setMessage("");
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");
    setErrors({});

    if (
      formData.new_password !==
      formData.confirm_new_password
    ) {
      setErrors({
        confirm_new_password:
          "Passwords do not match.",
      });

      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post(
        "/auth/reset-password/",
        formData,
      );

      setMessage(
        response.data.message ||
          "Password reset successfully.",
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (requestError) {
      const apiErrors =
        requestError.response?.data;

      console.error(
        "Reset password error:",
        apiErrors || requestError,
      );

      if (
        apiErrors &&
        typeof apiErrors === "object"
      ) {
        setErrors(apiErrors);
      }

      setError(
        apiErrors?.detail ||
          apiErrors?.non_field_errors?.[0] ||
          "Unable to reset password.",
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">

      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
            <KeyRound size={27} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Reset Password
          </h1>

          <p className="mt-2 text-slate-500">
            Enter the OTP sent to your email and
            create a new password.
          </p>

        </div>


        {message && (
          <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-green-700">
            {message}
          </div>
        )}


        {error && (
          <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >

          {/* EMAIL */}
          <div>

            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <div className="relative">

              <Mail
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-indigo-500"
              />

            </div>

            <FieldError
              error={errors.email}
            />

          </div>


          {/* OTP */}
          <div>

            <label
              htmlFor="otp"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              OTP
            </label>

            <div className="relative">

              <ShieldCheck
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={formData.otp}
                onChange={handleChange}
                required
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 tracking-[0.3em] outline-none focus:border-indigo-500"
              />

            </div>

            <FieldError
              error={errors.otp}
            />

          </div>


          {/* NEW PASSWORD */}
          <div>

            <PasswordInput
              name="new_password"
              label="New Password"
              value={formData.new_password}
              onChange={handleChange}
              placeholder="Enter new password"
              autoComplete="new-password"
            />

            <FieldError
              error={errors.new_password}
            />

          </div>


          {/* CONFIRM PASSWORD */}
          <div>

            <PasswordInput
              name="confirm_new_password"
              label="Confirm New Password"
              value={
                formData.confirm_new_password
              }
              onChange={handleChange}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />

            <FieldError
              error={
                errors.confirm_new_password
              }
            />

          </div>


          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Resetting Password..."
              : "Reset Password"}
          </button>

        </form>


        <p className="mt-6 text-center text-sm text-slate-600">
          Remember your password?{" "}

          <Link
            to="/login"
            className="font-semibold text-indigo-700"
          >
            Login
          </Link>
        </p>

      </div>

    </section>
  );
}


function FieldError({ error }) {
  if (!error) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-red-600">
      {Array.isArray(error)
        ? error[0]
        : error}
    </p>
  );
}


export default ResetPassword;