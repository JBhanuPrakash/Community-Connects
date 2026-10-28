import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";

const initialFormData = {
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
};

function CreateEvent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [bannerImage, setBannerImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    const response = await api.get("/categories/");
    return response.data;
  }, []);

  useEffect(() => {
    let active = true;

    fetchCategories()
      .then((data) => {
        if (active) {
          setCategories(data);
          setCategoriesLoading(false);
        }
      })
      .catch((requestError) => {
        if (active) {
          setCategoriesError(
            requestError.response?.data?.detail ||
              "Unable to load event categories.",
          );
          setCategoriesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchCategories]);

  const handleRetryCategories = () => {
    setCategoriesLoading(true);
    setCategoriesError("");

    fetchCategories()
      .then((data) => setCategories(data))
      .catch((requestError) =>
        setCategoriesError(
          requestError.response?.data?.detail ||
            "Unable to load event categories.",
        ),
      )
      .finally(() => setCategoriesLoading(false));
  };

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
    const file = event.target.files?.[0] || null;
    setBannerImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrors({});
    setSubmitting(true);

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

      await api.post("/events/", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/organizer/dashboard");
    } catch (err) {
      const apiErrors = err.response?.data;

      if (apiErrors && typeof apiErrors === "object") {
        setErrors(apiErrors);
      } else {
        setErrors({
          general: "Unable to create event.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Create Event
        </h1>

        <p className="mt-3 text-slate-600">
          Add the complete event information. The event will be sent
          to the administrator for approval.
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

      {categoriesError && !categoriesLoading && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-red-700">
          <span>{categoriesError}</span>

          <button
            type="button"
            onClick={handleRetryCategories}
            className="rounded-md border border-red-300 px-3 py-1 text-sm font-semibold hover:bg-red-100"
          >
            Retry
          </button>
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
              disabled={categoriesLoading}
              required
            >
              <option value="">
                {categoriesLoading
                  ? "Loading categories..."
                  : "Select category"}
              </option>

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

          <div>
            <label
              htmlFor="banner_image"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Event banner
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
            className="rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating Event..." : "Create Event"}
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
  disabled = false,
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
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
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

export default CreateEvent;