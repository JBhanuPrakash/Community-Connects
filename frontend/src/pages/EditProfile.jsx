import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";

function EditProfile() {
  const navigate = useNavigate();
  const { user, loading, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    city: "",
    bio: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextFormData = {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      city: user.city || "",
      bio: user.bio || "",
    };

    const nextPreview = user.profile_image || "";

    Promise.resolve().then(() => {
      setFormData(nextFormData);
      setPreview(nextPreview);
    });
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      general: "",
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    setProfileImage(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setErrors({});

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      if (profileImage) {
        payload.append("profile_image", profileImage);
      }

      await api.patch("/auth/profile/", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await refreshProfile();
      navigate("/profile");
    } catch (error) {
      const apiErrors = error.response?.data;

      if (apiErrors && typeof apiErrors === "object") {
        setErrors(apiErrors);
      } else {
        setErrors({
          general: "Unable to update your profile.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <div className="h-9 w-40">
            <Skeleton className="h-full w-full" />
          </div>

          <div className="mt-3 h-5 w-72">
            <Skeleton className="h-full w-full" />
          </div>
        </div>

        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex justify-center">
            <div className="h-32 w-32 rounded-full">
              <Skeleton className="h-full w-full rounded-full" />
            </div>
          </div>

          <div className="h-11">
            <Skeleton className="h-full w-full" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="h-11">
              <Skeleton className="h-full w-full" />
            </div>

            <div className="h-11">
              <Skeleton className="h-full w-full" />
            </div>
          </div>

          <div className="h-11">
            <Skeleton className="h-full w-full" />
          </div>

          <div className="h-24">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Profile unavailable
          </h1>

          <p className="mt-3 text-slate-600">
            Please log in to edit your profile.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
          >
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Edit Profile
        </h1>

        <p className="mt-3 text-slate-600">
          Update your personal and contact information.
        </p>
      </div>

      {errors.general && (
        <ErrorBox error={errors.general} />
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-32 w-32 overflow-hidden rounded-full bg-slate-200">
            {preview ? (
              <img
                src={preview}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                No image
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          <FieldError error={errors.profile_image} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="First name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
          />

          <FormField
            label="Last name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
          />
        </div>

        <FormField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Phone number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            error={errors.phone_number}
          />

          <FormField
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            error={errors.city}
          />
        </div>

        <div>
          <label
            htmlFor="bio"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Biography
          </label>

          <textarea
            id="bio"
            name="bio"
            rows={6}
            value={formData.bio}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
          />

          <FieldError error={errors.bio} />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
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
    <p className="mt-1 text-sm text-red-600">
      {Array.isArray(error) ? error[0] : error}
    </p>
  );
}

function ErrorBox({ error }) {
  return (
    <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">
      {Array.isArray(error) ? error[0] : error}
    </div>
  );
}

export default EditProfile;