import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";


function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear old error when user starts typing again
    if (error) {
      setError("");
    }
  };


  // Handle login
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(formData);

      // ADMIN
      if (
        loggedInUser.role === "ADMIN" ||
        loggedInUser.is_staff ||
        loggedInUser.is_superuser
      ) {
        navigate("/admin/dashboard");
        return;
      }

      // ORGANIZER
      if (loggedInUser.role === "ORGANIZER") {
        navigate("/organizer/dashboard");
        return;
      }

      // NORMAL USER
      navigate("/dashboard");
    } catch (err) {
      console.error(
        "Login error:",
        err.response?.data || err
      );

      const apiError = err.response?.data;

      if (typeof apiError === "string") {
        setError(apiError);
      } else if (apiError?.non_field_errors) {
        setError(apiError.non_field_errors[0]);
      } else if (apiError?.detail) {
        setError(apiError.detail);
      } else if (apiError?.message) {
        setError(apiError.message);
      } else if (apiError?.username) {
        setError(
          Array.isArray(apiError.username)
            ? apiError.username[0]
            : apiError.username
        );
      } else if (apiError?.password) {
        setError(
          Array.isArray(apiError.password)
            ? apiError.password[0]
            : apiError.password
        );
      } else {
        setError("Invalid username or password.");
      }
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-6 py-16 bg-slate-50/40">
      {/* Ambient background glows */}
      <div className="ambient-glow bg-fuchsia-500/5 h-[300px] w-[300px] -left-20 top-10 animate-pulse-slow motion-reduce:animate-none" />
      <div className="ambient-glow bg-amber-500/5 h-[320px] w-[320px] -right-20 bottom-10 animate-pulse-slow motion-reduce:animate-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl glass-card p-8 sm:p-10 shadow-xl shadow-slate-200/40 border border-slate-200/50">

        {/* Heading */}
        <h1 className="text-gradient-sunset text-center text-3xl font-extrabold tracking-tight">
          Welcome Back
        </h1>

        <p className="mt-2.5 text-center text-sm font-medium text-slate-500 leading-relaxed">
          Log in to continue to <span className="font-semibold text-indigo-600">CommunityConnect</span>.
        </p>


        {/* Error Message */}
        {error && (
          <div className="mt-6 rounded-xl bg-rose-50/50 border border-rose-100/40 px-4 py-3 text-xs font-semibold text-rose-600">
            {error}
          </div>
        )}


        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              disabled={submitting}
              placeholder="Enter your username"
              className="input-premium w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>


          {/* Password */}
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
          />


          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>


          {/* Login Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-premium btn-sunset w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Logging in..."
              : "Login"}
          </button>

        </form>


        {/* Register */}
        <p className="mt-7 text-center text-xs font-semibold text-slate-500">
          Don&apos;t have an account?{" "}

          <Link
            to="/register"
            className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-0.5"
          >
            Register
          </Link>
        </p>

      </div>

    </section>
  );
}


export default Login;