import {
  Building2,
  CalendarDays,
  CheckCircle,
  Edit,
  Globe,
  Image,
  MapPin,
  Play,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTelegramPlane,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

import { useEffect, useState } from "react";

import api from "../api/axios";
import { SkeletonCardGrid } from "../components/Skeleton";


const initialFormData = {
  organization_name: "",
  organization_description: "",
  website: "",
  instagram_url: "",
  facebook_url: "",
  linkedin_url: "",
  twitter_url: "",
  youtube_url: "",
  whatsapp_url: "",
  telegram_url: "",
  address: "",
};


const initialGalleryForm = {
  media_type: "IMAGE",
  event: "",
  caption: "",
  video_url: "",
};


function OrganizerProfile() {
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] =
    useState(initialFormData);

  const [
    verificationDocument,
    setVerificationDocument,
  ] = useState(null);

  const [editing, setEditing] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [errors, setErrors] =
    useState({});


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(
          "/auth/organizer-profile/",
        );

        const profileData = response.data;

        setProfile(profileData);

        setFormData({
          organization_name:
            profileData.organization_name ||
            "",

          organization_description:
            profileData.organization_description ||
            "",

          website:
            profileData.website || "",

          instagram_url:
            profileData.instagram_url || "",

          facebook_url:
            profileData.facebook_url || "",

          linkedin_url:
            profileData.linkedin_url || "",

          twitter_url:
            profileData.twitter_url || "",

          youtube_url:
            profileData.youtube_url || "",

          whatsapp_url:
            profileData.whatsapp_url || "",

          telegram_url:
            profileData.telegram_url || "",

          address:
            profileData.address || "",
        });
      } catch (requestError) {
        console.error(
          "Organizer profile error:",
          requestError.response?.data ||
            requestError,
        );

        setError(
          requestError.response?.data?.detail ||
            "Unable to load organization profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);


  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };


  const handleFileChange = (
    event,
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      setVerificationDocument(file);
    }
  };


  const handleEdit = () => {
    setEditing(true);
    setMessage("");
    setError("");
  };


  const handleCancel = () => {
    setEditing(false);

    setVerificationDocument(null);

    setErrors({});

    if (!profile) {
      return;
    }

    setFormData({
      organization_name:
        profile.organization_name || "",

      organization_description:
        profile.organization_description || "",

      website:
        profile.website || "",

      instagram_url:
        profile.instagram_url || "",

      facebook_url:
        profile.facebook_url || "",

      linkedin_url:
        profile.linkedin_url || "",

      twitter_url:
        profile.twitter_url || "",

      youtube_url:
        profile.youtube_url || "",

      whatsapp_url:
        profile.whatsapp_url || "",

      telegram_url:
        profile.telegram_url || "",

      address:
        profile.address || "",
    });
  };


  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");
    setErrors({});

    try {
      const data =
        new FormData();

      Object.entries(
        formData,
      ).forEach(
        ([key, value]) => {
          data.append(
            key,
            value || "",
          );
        },
      );

      if (verificationDocument) {
        data.append(
          "verification_document",
          verificationDocument,
        );
      }

      const response =
        await api.patch(
          "/auth/organizer-profile/",
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          },
        );

      setProfile(response.data);

      setFormData({
        organization_name:
          response.data
            .organization_name || "",

        organization_description:
          response.data
            .organization_description ||
          "",

        website:
          response.data.website || "",

        instagram_url:
          response.data
            .instagram_url || "",

        facebook_url:
          response.data
            .facebook_url || "",

        linkedin_url:
          response.data
            .linkedin_url || "",

        twitter_url:
          response.data
            .twitter_url || "",

        youtube_url:
          response.data
            .youtube_url || "",

        whatsapp_url:
          response.data
            .whatsapp_url || "",

        telegram_url:
          response.data
            .telegram_url || "",

        address:
          response.data.address || "",
      });

      setVerificationDocument(
        null,
      );

      setEditing(false);

      setMessage(
        "Organization profile updated successfully.",
      );
    } catch (requestError) {
      const apiErrors =
        requestError.response?.data;

      console.error(
        "Profile update error:",
        apiErrors ||
          requestError,
      );

      if (
        apiErrors &&
        typeof apiErrors ===
          "object"
      ) {
        setErrors(apiErrors);
      }

      setError(
        apiErrors?.detail ||
          "Unable to update organization profile.",
      );
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-500">
          Loading organization
          profile...
        </p>
      </div>
    );
  }


  if (!profile) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16">

        <div className="rounded-2xl bg-red-50 p-8 text-center">

          <h1 className="text-2xl font-bold text-red-800">
            Organization profile
            unavailable
          </h1>

          <p className="mt-3 text-red-700">
            {error ||
              "Unable to load your organization profile."}
          </p>

        </div>

      </section>
    );
  }


  return (
    <section className="mx-auto max-w-6xl px-6 py-12">

      {/* HEADER */}

      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Organizer
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Organization Profile
          </h1>

          <p className="mt-3 text-slate-600">
            Manage your community
            information, social media
            accounts and event gallery.
          </p>

        </div>


        {!editing && (
          <button
            type="button"
            onClick={handleEdit}
            className="btn-sunset inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold"
          >
            <Edit size={18} />

            Edit Profile
          </button>
        )}

      </div>


      {message && (
        <div className="mb-6 rounded-xl bg-green-50 px-5 py-4 text-green-700">
          {message}
        </div>
      )}


      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}


      {editing ? (
        <OrganizerEditForm
          formData={formData}
          errors={errors}
          saving={saving}
          verificationDocument={
            verificationDocument
          }
          profile={profile}
          onChange={handleChange}
          onFileChange={
            handleFileChange
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      ) : (
        <OrganizerProfileView
          profile={profile}
        />
      )}


      {/* GALLERY MANAGEMENT */}

      <GalleryManagement />

    </section>
  );
}



function OrganizerProfileView({
  profile,
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

      <div className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-amber-400 px-8 py-10 text-white">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-2 ring-white/40">

            {profile.profile_image ? (
              <img
                src={
                  profile.profile_image
                }
                alt={
                  profile.organization_name
                }
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2
                size={38}
              />
            )}

          </div>


          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="text-3xl font-bold">
                {profile.organization_name ||
                  "Organization"}
              </h2>


              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/40">

                  <CheckCircle
                    size={15}
                  />

                  Verified

                </span>
              )}

            </div>


            <p className="mt-2 text-white/85">
              Member since{" "}
              {formatMemberSince(
                profile.created_at,
              )}
            </p>

          </div>

        </div>

      </div>


      <div className="p-8">

        <section>

          <h3 className="text-2xl font-bold text-slate-900">
            About the Community
          </h3>


          <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
            {profile.organization_description ||
              "No organization description has been added yet."}
          </p>

        </section>


        <section className="mt-10 grid gap-6 md:grid-cols-2">

          <InfoCard
            icon={
              <Globe size={21} />
            }
            label="Website"
            value={
              profile.website ||
              "Not provided"
            }
            link={
              profile.website
            }
          />


          <InfoCard
            icon={
              <MapPin size={21} />
            }
            label="Address"
            value={
              profile.address ||
              "Not provided"
            }
          />


          <InfoCard
            icon={
              <ShieldCheck
                size={21}
              />
            }
            label="Verification Status"
            value={
              profile.is_verified
                ? "Verified Organizer"
                : "Verification Pending"
            }
          />


          <InfoCard
            icon={
              <CalendarDays
                size={21}
              />
            }
            label="Member Since"
            value={formatMemberSince(
              profile.created_at,
            )}
          />

        </section>


        <SocialLinks
          profile={profile}
        />

      </div>

    </div>
  );
}



function OrganizerEditForm({
  formData,
  errors,
  saving,
  verificationDocument,
  profile,
  onChange,
  onFileChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl bg-white p-8 shadow-sm"
    >

      <h2 className="text-2xl font-bold text-slate-900">
        Edit Organization
      </h2>


      <div className="mt-8 space-y-8">

        <section>

          <h3 className="mb-5 text-lg font-bold text-slate-900">
            Basic Information
          </h3>


          <div className="space-y-5">

            <FormField
              label="Organization Name"
              name="organization_name"
              value={
                formData.organization_name
              }
              onChange={onChange}
              error={
                errors.organization_name
              }
              placeholder="Example: Live Runner Club"
              required
            />


            <div>

              <label
                htmlFor="organization_description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Organization
                Description
              </label>


              <textarea
                id="organization_description"
                name="organization_description"
                rows={6}
                value={
                  formData.organization_description
                }
                onChange={
                  onChange
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
                placeholder="Tell users about your community..."
              />


              <FieldError
                error={
                  errors.organization_description
                }
              />

            </div>


            <FormField
              label="Address"
              name="address"
              value={
                formData.address
              }
              onChange={onChange}
              error={
                errors.address
              }
              placeholder="Organization address"
            />


            <FormField
              label="Website"
              name="website"
              type="url"
              value={
                formData.website
              }
              onChange={onChange}
              error={
                errors.website
              }
              placeholder="https://yourcommunity.com"
            />

          </div>

        </section>


        <section className="border-t border-slate-200 pt-8">

          <h3 className="text-lg font-bold text-slate-900">
            Social Media
          </h3>


          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <FormField
              label="Instagram"
              name="instagram_url"
              type="url"
              value={
                formData.instagram_url
              }
              onChange={onChange}
              error={
                errors.instagram_url
              }
              placeholder="https://instagram.com/..."
            />

            <FormField
              label="Facebook"
              name="facebook_url"
              type="url"
              value={
                formData.facebook_url
              }
              onChange={onChange}
              error={
                errors.facebook_url
              }
              placeholder="https://facebook.com/..."
            />

            <FormField
              label="LinkedIn"
              name="linkedin_url"
              type="url"
              value={
                formData.linkedin_url
              }
              onChange={onChange}
              error={
                errors.linkedin_url
              }
              placeholder="https://linkedin.com/company/..."
            />

            <FormField
              label="X / Twitter"
              name="twitter_url"
              type="url"
              value={
                formData.twitter_url
              }
              onChange={onChange}
              error={
                errors.twitter_url
              }
              placeholder="https://x.com/..."
            />

            <FormField
              label="YouTube"
              name="youtube_url"
              type="url"
              value={
                formData.youtube_url
              }
              onChange={onChange}
              error={
                errors.youtube_url
              }
              placeholder="https://youtube.com/@..."
            />

            <FormField
              label="WhatsApp"
              name="whatsapp_url"
              type="url"
              value={
                formData.whatsapp_url
              }
              onChange={onChange}
              error={
                errors.whatsapp_url
              }
              placeholder="https://wa.me/91..."
            />

            <FormField
              label="Telegram"
              name="telegram_url"
              type="url"
              value={
                formData.telegram_url
              }
              onChange={onChange}
              error={
                errors.telegram_url
              }
              placeholder="https://t.me/..."
            />

          </div>

        </section>


        {!profile.is_verified && (
          <section className="border-t border-slate-200 pt-8">

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Verification
              Document
            </label>


            <input
              type="file"
              onChange={
                onFileChange
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
            />


            {verificationDocument && (
              <p className="mt-2 text-sm text-green-700">
                Selected:{" "}
                {
                  verificationDocument.name
                }
              </p>
            )}

          </section>
        )}


        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold transition hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-700"
          >
            <X size={18} />

            Cancel
          </button>


          <button
            type="submit"
            disabled={saving}
            className="btn-sunset inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold disabled:opacity-60"
          >
            <Save size={18} />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </div>

    </form>
  );
}



function GalleryManagement() {
  const [gallery, setGallery] =
    useState([]);

  const [events, setEvents] =
    useState([]);

  const [form, setForm] =
    useState(initialGalleryForm);

  const [imageFile, setImageFile] =
    useState(null);

  const [videoFile, setVideoFile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  useEffect(() => {
    loadGalleryData();
  }, []);


  async function loadGalleryData() {
    try {
      const [
        galleryResponse,
        eventsResponse,
      ] = await Promise.all([
        api.get(
          "/auth/organizer/gallery/",
        ),

        api.get(
          "/organizer/events/",
        ),
      ]);


      setGallery(
        galleryResponse.data.results ||
          galleryResponse.data ||
          [],
      );


      const eventData =
        eventsResponse.data.results ||
        eventsResponse.data ||
        [];


      setEvents(
        Array.isArray(eventData)
          ? eventData
          : [],
      );
    } catch (requestError) {
      console.error(
        requestError,
      );

      setError(
        "Unable to load gallery.",
      );
    } finally {
      setLoading(false);
    }
  }


  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const data =
        new FormData();

      data.append(
        "media_type",
        form.media_type,
      );

      data.append(
        "caption",
        form.caption,
      );


      if (form.event) {
        data.append(
          "event",
          form.event,
        );
      }


      if (
        form.media_type ===
        "IMAGE"
      ) {
        if (!imageFile) {
          setError(
            "Please select an image.",
          );

          setSubmitting(false);

          return;
        }

        data.append(
          "image",
          imageFile,
        );
      }


      if (
        form.media_type ===
        "VIDEO"
      ) {
        if (videoFile) {
          data.append(
            "video",
            videoFile,
          );
        } else {
          if (!form.video_url) {
            setError(
              "Please upload a video file or enter a video URL.",
            );

            setSubmitting(false);

            return;
          }

          data.append(
            "video_url",
            form.video_url,
          );
        }
      }


      await api.post(
        "/auth/organizer/gallery/",
        data,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
      );


      setMessage(
        "Gallery item added successfully.",
      );


      setForm(
        initialGalleryForm,
      );

      setImageFile(null);

      setVideoFile(null);

      await loadGalleryData();
    } catch (requestError) {
      const apiError =
        requestError.response?.data;

      console.error(
        "Gallery upload error:",
        apiError ||
          requestError,
      );

      setError(
        apiError?.detail ||
          apiError?.image?.[0] ||
          apiError?.video_url?.[0] ||
          apiError?.event?.[0] ||
          "Unable to add gallery item.",
      );
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async (
    galleryId,
  ) => {
    const confirmed =
      window.confirm(
        "Delete this gallery item?",
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      galleryId,
    );

    try {
      await api.delete(
        `/auth/organizer/gallery/${galleryId}/`,
      );

      setGallery(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              galleryId,
          ),
      );
    } catch {
      setError(
        "Unable to delete gallery item.",
      );
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <section className="mt-10 rounded-3xl bg-white p-8 shadow-sm">

      <div>

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
          Media
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Event Gallery
        </h2>

        <p className="mt-2 text-slate-500">
          Add photos and video
          highlights from your
          previous events.
        </p>

      </div>


      {message && (
        <div className="mt-6 rounded-xl bg-green-50 px-5 py-4 text-green-700">
          {message}
        </div>
      )}


      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}


      {/* ADD MEDIA FORM */}

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-slate-200 p-6"
      >

        <div className="grid gap-5 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-medium">
              Media Type
            </label>

            <select
              name="media_type"
              value={
                form.media_type
              }
              onChange={
                handleChange
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
            >
              <option value="IMAGE">
                Image
              </option>

              <option value="VIDEO">
                Video
              </option>
            </select>

          </div>


          <div>

            <label className="mb-2 block text-sm font-medium">
              Related Event
            </label>

            <select
              name="event"
              value={form.event}
              onChange={
                handleChange
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
            >

              <option value="">
                No specific event
              </option>


              {events.map(
                (event) => (
                  <option
                    key={
                      event.id
                    }
                    value={
                      event.id
                    }
                  >
                    {
                      event.title
                    }
                  </option>
                ),
              )}

            </select>

          </div>

        </div>


        <div className="mt-5">

          <label className="mb-2 block text-sm font-medium">
            Caption
          </label>

          <input
            name="caption"
            value={
              form.caption
            }
            onChange={
              handleChange
            }
            placeholder="Example: Highlights from our Sunday run"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
          />

        </div>


        {form.media_type ===
          "IMAGE" && (
          <div className="mt-5">

            <label className="mb-2 block text-sm font-medium">
              Upload Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(
                event,
              ) =>
                setImageFile(
                  event.target
                    .files?.[0] ||
                    null,
                )
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
            />

          </div>
        )}


        {form.media_type ===
          "VIDEO" && (
          <>
            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium">
                Video file (optional)
              </label>

              <input
                type="file"
                accept="video/*"
                onChange={(
                  event,
                ) =>
                  setVideoFile(
                    event.target
                      .files?.[0] ||
                      null,
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
              />

            </div>

            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium">
                YouTube / Video URL
              </label>

              <input
                name="video_url"
                type="url"
                value={
                  form.video_url
                }
                onChange={
                  handleChange
                }
                placeholder="https://youtube.com/watch?v=..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
              />

            </div>
          </>
        )}


        <button
          type="submit"
          disabled={
            submitting
          }
          className="btn-sunset mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold disabled:opacity-60"
        >
          <Upload size={18} />

          {submitting
            ? "Adding..."
            : "Add to Gallery"}
        </button>

      </form>


      {/* GALLERY ITEMS */}

      <div className="mt-10">

        <h3 className="text-xl font-bold text-slate-900">
          Your Gallery
        </h3>


        {loading ? (
          <SkeletonCardGrid
            count={6}
            variant="gallery"
          />
        ) : !error && gallery.length ===
          0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-10 text-center">

            <Image
              size={42}
              className="mx-auto text-slate-400"
            />

            <p className="mt-4 text-slate-500">
              No gallery items
              added yet.
            </p>

          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {gallery.map(
              (item) => (
                <GalleryItemCard
                  key={item.id}
                  item={item}
                  deleting={
                    deletingId ===
                    item.id
                  }
                  onDelete={
                    handleDelete
                  }
                />
              ),
            )}

          </div>
        )}

      </div>

    </section>
  );
}



function GalleryItemCard({
  item,
  deleting,
  onDelete,
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200">

      <div className="relative h-52 bg-slate-100">

        {item.media_type ===
        "IMAGE" ? (
          item.image ? (
            <img
              src={item.image}
              alt={
                item.caption ||
                "Gallery"
              }
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlaceholder />
          )
        ) : item.video ? (
          <video
            controls
            preload="metadata"
            playsInline
            className="h-full w-full object-cover"
          >
            <source
              src={item.video}
            />

            Your browser does not
            support video playback.
          </video>
        ) : (
          <VideoPreview
            url={
              item.video_url
            }
          />
        )}

      </div>


      <div className="p-5">

        {item.event_title && (
          <p className="text-sm font-semibold text-fuchsia-600">
            {
              item.event_title
            }
          </p>
        )}


        <p className="mt-2 text-slate-600">
          {item.caption ||
            "No caption"}
        </p>


        <button
          type="button"
          disabled={deleting}
          onClick={() =>
            onDelete(item.id)
          }
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600"
        >
          <Trash2 size={16} />

          {deleting
            ? "Deleting..."
            : "Delete"}
        </button>

      </div>

    </article>
  );
}



function VideoPreview({
  url,
}) {
  const embedUrl =
    getVideoEmbedUrl(url);

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title="Event video"
        className="h-full w-full"
        allowFullScreen
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full items-center justify-center text-fuchsia-600"
    >
      <Play size={48} />
    </a>
  );
}



function ImagePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center text-slate-400">
      <Image size={45} />
    </div>
  );
}



function getVideoEmbedUrl(
  url,
) {
  if (!url) {
    return null;
  }

  try {
    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes(
        "youtube.com",
      )
    ) {
      const videoId =
        parsed.searchParams.get(
          "v",
        );

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    }


    if (
      parsed.hostname.includes(
        "youtu.be",
      )
    ) {
      const videoId =
        parsed.pathname.replace(
          "/",
          "",
        );

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}



function formatMemberSince(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}



function SocialLinks({
  profile,
}) {
  const links = [
    {
      name: "Website",
      url: profile?.website,
      icon: (
        <Globe size={20} />
      ),
    },

    {
      name: "Instagram",
      url:
        profile?.instagram_url,
      icon: <FaInstagram />,
    },

    {
      name: "Facebook",
      url:
        profile?.facebook_url,
      icon: <FaFacebookF />,
    },

    {
      name: "LinkedIn",
      url:
        profile?.linkedin_url,
      icon: <FaLinkedinIn />,
    },

    {
      name: "X",
      url:
        profile?.twitter_url,
      icon: <FaXTwitter />,
    },

    {
      name: "YouTube",
      url:
        profile?.youtube_url,
      icon: <FaYoutube />,
    },

    {
      name: "WhatsApp",
      url:
        profile?.whatsapp_url,
      icon: <FaWhatsapp />,
    },

    {
      name: "Telegram",
      url:
        profile?.telegram_url,
      icon: (
        <FaTelegramPlane />
      ),
    },
  ];


  const availableLinks =
    links.filter(
      (item) =>
        item.url,
    );


  if (
    availableLinks.length === 0
  ) {
    return null;
  }


  return (
    <section className="mt-10">

      <h3 className="text-xl font-bold text-slate-900">
        Connect With Us
      </h3>


      <div className="mt-5 flex flex-wrap gap-3">

        {availableLinks.map(
          (item) => (
            <a
              key={
                item.name
              }
              href={
                item.url
              }
              target="_blank"
              rel="noopener noreferrer"
              title={
                item.name
              }
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-600"
            >
              {item.icon}
            </a>
          ),
        )}

      </div>

    </section>
  );
}



function InfoCard({
  icon,
  label,
  value,
  link,
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 p-5">

      <div className="rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 p-3 text-fuchsia-700">
        {icon}
      </div>


      <div>

        <p className="text-sm text-slate-500">
          {label}
        </p>


        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-semibold text-fuchsia-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 font-semibold text-slate-900">
            {value}
          </p>
        )}

      </div>

    </div>
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
        placeholder={
          placeholder
        }
        required={required}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200"
      />


      <FieldError
        error={error}
      />

    </div>
  );
}



function FieldError({
  error,
}) {
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


export default OrganizerProfile;