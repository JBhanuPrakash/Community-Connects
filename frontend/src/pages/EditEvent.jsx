import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";

function formatDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    short_description: "",
    description: "",
    mode: "OFFLINE",
    venue_name: "",
    address: "",
    city: "",
    state: "",
    latitude: "",
    longitude: "",
    online_event_url: "",
    start_datetime: "",
    end_datetime: "",
    registration_deadline: "",
    capacity: "",
    price: "0",
  });

  const [bannerImage, setBannerImage] = useState(null);
  const [currentBanner, setCurrentBanner] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);

      try {
        const [eventResponse, categoryResponse] =
          await Promise.all([
            api.get(`/organizer/events/${id}/`),
            api.get("/categories/"),
          ]);

        const event = eventResponse.data;

        setCategories(categoryResponse.data);
        setCurrentBanner(event.banner_image || "");

        setFormData({
          category: event.category ?? "",
          title: event.title ?? "",
          short_description: event.short_description ?? "",
          description: event.description ?? "",
          mode: event.mode ?? "OFFLINE",
          venue_name: event.venue_name ?? "",
          address: event.address ?? "",
          city: event.city ?? "",
          state: event.state ?? "",
          latitude: event.latitude ?? "",
          longitude: event.longitude ?? "",
          online_event_url: event.online_event_url ?? "",
          start_datetime: formatDateTimeLocal(
            event.start_datetime,
          ),
          end_datetime: formatDateTimeLocal(
            event.end_datetime,
          ),
          registration_deadline: formatDateTimeLocal(
            event.registration_deadline,
          ),
          capacity: event.capacity ?? "",
          price: event.price ?? "0",
        });
      } catch (error) {
        setLoadFailed(true);
        setErrors({
          general:
            error.response?.data?.detail ||
            "Unable to load event information.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [id]);

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

  const handleFileChange = (event) => {
    setBannerImage(event.target.files?.[0] || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setErrors({});

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "") {
          payload.append(key, value);
        }
      });

      if (bannerImage) {
        payload.append("banner_image", bannerImage);
      }

      payload.set("price", "0");

      payload.set(
        "start_datetime",
        new Date(formData.start_datetime).toISOString(),
      );

      payload.set(
        "end_datetime",
        new Date(formData.end_datetime).toISOString(),
      );

      if (formData.registration_deadline) {
        payload.set(
          "registration_deadline",
          new Date(formData.registration_deadline).toISOString(),
        );
      }

      await api.patch(
        `/organizer/events/${id}/`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      navigate("/organizer/dashboard");
    } catch (error) {
      const apiErrors = error.response?.data;

      if (apiErrors && typeof apiErrors === "object") {
        setErrors(apiErrors);
      } else {
        setErrors({
          general: "Unable to update the event.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading event information...
      </div>
    );
  }

  if (loadFailed) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Event unavailable
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          {errors.general ||
            "This event could not be loaded. It may have been removed or you may not have permission to edit it."}
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/organizer/dashboard")}
            className="rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800"
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/events")}
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Browse Events
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Edit Event
        </h1>

        <p className="mt-3 text-slate-600">
          Updating an approved event will send it back for
          administrator approval.
        </p>
      </div>

      {errors.general && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">
          {errors.general}
        </div>
      )}

      {errors.non_field_errors && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">
          {Array.isArray(errors.non_field_errors)
            ? errors.non_field_errors[0]
            : errors.non_field_errors}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl bg-white p-8 shadow-sm"
      >
        <FormSection title="Basic Information">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Event title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              required
            />

            <SelectField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={errors.category}
              required
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </SelectField>
          </div>

          <FormField
            label="Short description"
            name="short_description"
            value={formData.short_description}
            onChange={handleChange}
            error={errors.short_description}
            maxLength={300}
          />

          <TextAreaField
            label="Full description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            required
          />

          {currentBanner && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Current banner
              </p>

              <img
                src={currentBanner}
                alt="Current event banner"
                className="h-48 w-full max-w-md rounded-xl object-cover"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="banner_image"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Replace banner
            </label>

            <input
              id="banner_image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />

            <ErrorText error={errors.banner_image} />
          </div>
        </FormSection>

        <FormSection title="Event Type and Location">
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Event mode"
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              error={errors.mode}
            >
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </SelectField>

            {(formData.mode === "ONLINE" ||
              formData.mode === "HYBRID") && (
              <FormField
                label="Online event URL"
                name="online_event_url"
                type="url"
                value={formData.online_event_url}
                onChange={handleChange}
                error={errors.online_event_url}
                required={formData.mode === "ONLINE"}
              />
            )}
          </div>

          {(formData.mode === "OFFLINE" ||
            formData.mode === "HYBRID") && (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Venue name"
                  name="venue_name"
                  value={formData.venue_name}
                  onChange={handleChange}
                  error={errors.venue_name}
                  required
                />

                <FormField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  error={errors.city}
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  error={errors.state}
                />

                <FormField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  error={errors.latitude}
                />

                <FormField
                  label="Longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  error={errors.longitude}
                />
              </div>
            </>
          )}
        </FormSection>

        <FormSection title="Date and Registration">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Start date and time"
              name="start_datetime"
              type="datetime-local"
              value={formData.start_datetime}
              onChange={handleChange}
              error={errors.start_datetime}
              required
            />

            <FormField
              label="End date and time"
              name="end_datetime"
              type="datetime-local"
              value={formData.end_datetime}
              onChange={handleChange}
              error={errors.end_datetime}
              required
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Registration deadline"
              name="registration_deadline"
              type="datetime-local"
              value={formData.registration_deadline}
              onChange={handleChange}
              error={errors.registration_deadline}
            />

            <FormField
              label="Capacity"
              name="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              error={errors.capacity}
            />
          </div>
        </FormSection>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/organizer/dashboard")}
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
          >
            {submitting ? "Updating Event..." : "Update Event"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FormSection({ title, children }) {
  return (
    <section>
      <h2 className="mb-5 border-b border-slate-200 pb-3 text-xl font-bold text-slate-900">
        {title}
      </h2>

      <div className="space-y-5">{children}</div>
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
  ...inputProps
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
        {...inputProps}
      />

      <ErrorText error={error} />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
      >
        {children}
      </select>

      <ErrorText error={error} />
    </div>
  );
}

function TextAreaField({
  label,
  name,
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
        {required && <span className="text-red-600"> *</span>}
      </label>

      <textarea
        id={name}
        name={name}
        rows={7}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
      />

      <ErrorText error={error} />
    </div>
  );
}

function ErrorText({ error }) {
  if (!error) {
    return null;
  }

  return (
    <p className="mt-1 text-sm text-red-600">
      {Array.isArray(error) ? error[0] : error}
    </p>
  );
}

export default EditEvent;