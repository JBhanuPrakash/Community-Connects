import { KeyRound } from "lucide-react";
import { useState } from "react";

import api from "../api/axios";
import PasswordInput from "../components/PasswordInput";


function ChangePassword() {
  const [formData, setFormData] = useState({
    current_password: "",
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
    setErrors({});
    setError("");
    setMessage("");

    if (
      formData.new_password !==
      formData.confirm_new_password
    ) {
      setErrors({
        confirm_new_password:
          "The new passwords do not match.",
      });

      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post(
        "/auth/change-password/",
        formData,
      );

      setMessage(
        response.data.message ||
          "Password changed successfully.",
      );

      setFormData({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
    } catch (requestError) {
      const apiErrors =
        requestError.response?.data;

      console.error(
        "Change password error:",
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
          "Unable to change your password.",
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <section className="mx-auto max-w-2xl px-6 py-12">

      <div className="rounded-2xl bg-white p-8 shadow-sm">

        <div className="flex items-center gap-4">

          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
            <KeyRound size={26} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Change Password
            </h1>

            <p className="mt-1 text-slate-500">
              Update your account password securely.
            </p>
          </div>

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

          <div>

            <PasswordInput
              name="current_password"
              label="Current Password"
              value={
                formData.current_password
              }
              onChange={handleChange}
              placeholder="Enter current password"
              autoComplete="current-password"
            />

            <FieldError
              error={
                errors.current_password
              }
            />

          </div>


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
              ? "Changing Password..."
              : "Change Password"}
          </button>

        </form>

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


export default ChangePassword;