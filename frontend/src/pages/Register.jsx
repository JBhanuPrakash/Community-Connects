import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/axios";
import PasswordInput from "../components/PasswordInput";


function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    city: "",
    password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
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

    if (error) {
      setError("");
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setErrors({});

    if (
      formData.password !==
      formData.confirm_password
    ) {
      setErrors({
        confirm_password:
          "Passwords do not match.",
      });

      setSubmitting(false);
      return;
    }

    try {
      await api.post(
        "/auth/register/",
        formData,
      );

      navigate("/login", {
        state: {
          message:
            "Registration successful. Please log in.",
        },
      });
    } catch (requestError) {
      console.error(
        "Registration error:",
        requestError.response?.data ||
          requestError,
      );

      const apiErrors =
        requestError.response?.data;

      if (
        apiErrors &&
        typeof apiErrors === "object"
      ) {
        setErrors(apiErrors);
      }

      setError(
        apiErrors?.detail ||
          apiErrors?.non_field_errors?.[0] ||
          "Unable to create your account.",
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-6 py-16 bg-slate-50/40">
      {/* Ambient background glows */}
      <div className="ambient-glow bg-fuchsia-500/5 h-[320px] w-[320px] -left-20 top-20 animate-pulse-slow motion-reduce:animate-none" />
      <div className="ambient-glow bg-amber-500/5 h-[340px] w-[340px] -right-20 bottom-20 animate-pulse-slow motion-reduce:animate-none" />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl glass-card p-8 sm:p-10 shadow-xl shadow-slate-200/40 border border-slate-200/50">

        <div className="text-center">
          <h1 className="text-gradient-sunset text-3xl font-extrabold tracking-tight">
            Create Your Account
          </h1>

          <p className="mt-2.5 text-sm font-medium text-slate-500 leading-relaxed">
            Join <span className="font-semibold text-indigo-600">CommunityConnect</span> and discover events around you.
          </p>
        </div>


        {error && (
          <div className="mt-6 rounded-xl bg-rose-50/50 border border-rose-100/40 px-4 py-3 text-xs font-semibold text-rose-600">
            {error}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >

          <div className="grid gap-5 md:grid-cols-2">

            <FormField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              placeholder="Enter first name"
            />

            <FormField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name}
              placeholder="Enter last name"
            />

          </div>


          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            placeholder="Choose a username"
            required
          />


          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter your email"
            required
          />


          <div className="grid gap-5 md:grid-cols-2">

            <FormField
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              error={errors.phone_number}
              placeholder="Enter phone number"
            />

            <FormField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
              placeholder="Enter your city"
            />

          </div>


          <div className="grid gap-5 md:grid-cols-2">

            <PasswordInput
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
            />

            <PasswordInput
              name="confirm_password"
              label="Confirm Password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Enter password again"
              autoComplete="new-password"
            />

          </div>


          {errors.password && (
            <FieldError
              error={errors.password}
            />
          )}

          {errors.confirm_password && (
            <FieldError
              error={
                errors.confirm_password
              }
            />
          )}


          <button
            type="submit"
            disabled={submitting}
            className="btn-premium btn-sunset w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>


        <p className="mt-7 text-center text-xs font-semibold text-slate-500">
          Already have an account?{" "}

          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-0.5"
          >
            Login
          </Link>
        </p>

      </div>

    </section>
  );
}


function FormField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-premium w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-750 outline-none focus:border-indigo-500"
      />

      <FieldError error={error} />

    </div>
  );
}


function FieldError({ error }) {
  if (!error) {
    return null;
  }

  return (
    <p className="mt-2 text-xs font-semibold text-red-655">
      {Array.isArray(error)
        ? error[0]
        : error}
    </p>
  );
}


export default Register;