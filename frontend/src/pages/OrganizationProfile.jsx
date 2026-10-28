import {
  Building2,
  CalendarDays,
  CheckCircle,
  Globe,
  Image,
  MapPin,
  Play,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTelegramPlane,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

import {
  FaXTwitter,
} from "react-icons/fa6";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import api from "../api/axios";


function OrganizationProfile() {
  const { organizerId } =
    useParams();

  const [profile, setProfile] =
    useState(null);

  const [events, setEvents] =
    useState([]);

  const [gallery, setGallery] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const fetchOrganizationData = useCallback(
    async () => {
      const [
        profileResponse,
        eventsResponse,
        galleryResponse,
      ] = await Promise.all([
        api.get(
          `/auth/organizers/${organizerId}/profile/`,
        ),

        api.get(
          "/events/",
          {
            params: {
              organizer:
                organizerId,
            },
          },
        ),

        api.get(
          `/auth/organizers/${organizerId}/gallery/`,
        ),
      ]);

      const eventData =
        eventsResponse.data
          .results ||
        eventsResponse.data ||
        [];

      const galleryData =
        galleryResponse.data
          .results ||
        galleryResponse.data ||
        [];

      return {
        profile: profileResponse.data,
        events: Array.isArray(
          eventData,
        )
          ? eventData
          : [],
        gallery: Array.isArray(
          galleryData,
        )
          ? galleryData
          : [],
      };
    },
    [organizerId],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setError("");

      try {
        const data =
          await fetchOrganizationData();

        if (active) {
          setProfile(data.profile);
          setEvents(data.events);
          setGallery(data.gallery);
        }
      } catch (requestError) {
        console.error(
          "Organization error:",
          requestError.response
            ?.data ||
            requestError,
        );

        if (active) {
          setError(
            requestError.response
              ?.data?.detail ||
              "Unable to load this organization.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [fetchOrganizationData]);


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <p className="text-slate-500">
          Loading
          organization...
        </p>

      </div>
    );
  }


  if (!profile) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16">

        <div className="rounded-2xl bg-red-50 p-8 text-center">

          <h1 className="text-2xl font-bold text-red-800">
            Organization
            unavailable
          </h1>


          <p className="mt-3 text-red-700">
            {error}
          </p>


          <Link
            to="/events"
            className="mt-6 inline-block rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white"
          >
            Browse Events
          </Link>

        </div>

      </section>
    );
  }


  const now = new Date();


  const upcomingEvents =
    events.filter(
      (event) =>
        new Date(
          event.start_datetime,
        ) >= now,
    );


  const pastEvents =
    events.filter(
      (event) =>
        new Date(
          event.start_datetime,
        ) < now,
    );


  return (
    <section className="bg-slate-50 pb-16">

      {/* HEADER */}

      <div className="bg-gradient-to-r from-indigo-800 to-purple-800">

        <div className="mx-auto max-w-7xl px-6 py-14 text-white">

          <div className="flex flex-col gap-6 md:flex-row md:items-center">

            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-white/15">

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
                  size={48}
                />
              )}

            </div>


            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-4xl font-bold">
                  {
                    profile.organization_name
                  }
                </h1>


                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">

                    <CheckCircle
                      size={15}
                    />

                    Verified

                  </span>
                )}

              </div>


              <p className="mt-2 text-indigo-100">
                @{profile.username}
              </p>


              {profile.city && (
                <div className="mt-3 flex items-center gap-2 text-indigo-100">

                  <MapPin
                    size={17}
                  />

                  {
                    profile.city
                  }

                </div>
              )}

            </div>

          </div>

        </div>

      </div>


      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">

        {/* ABOUT */}

        <section className="rounded-2xl bg-white p-7 shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            About the Community
          </h2>


          <p className="mt-5 whitespace-pre-line leading-8 text-slate-600">

            {profile.organization_description ||
              "No description has been added yet."}

          </p>


          {profile.address && (
            <div className="mt-6 flex items-start gap-3 text-slate-600">

              <MapPin
                size={20}
                className="mt-0.5 text-indigo-700"
              />

              <span>
                {profile.address}
              </span>

            </div>
          )}

        </section>


        {/* SOCIAL MEDIA */}

        <SocialLinks
          profile={profile}
        />


        {/* UPCOMING EVENTS */}

        <OrganizationEventsSection
          title="Upcoming Events"
          description="Events coming up from this community."
          events={
            upcomingEvents
          }
          emptyMessage="No upcoming events."
          hasError={Boolean(error)}
        />


        {/* PAST EVENTS */}

        <OrganizationEventsSection
          title="Past Events"
          description="Previously conducted events by this community."
          events={pastEvents}
          emptyMessage="No past events yet."
          hasError={Boolean(error)}
        />


        {/* GALLERY */}

        <PublicGallery
          gallery={gallery}
          hasError={Boolean(error)}
        />

      </div>

    </section>
  );
}



function PublicGallery({
  gallery,
  hasError = false,
}) {
  return (
    <section>

      <div className="mb-5">

        <h2 className="text-2xl font-bold text-slate-900">
          Community Gallery
        </h2>


        <p className="mt-1 text-slate-500">
          Photos and videos from
          previous community events.
        </p>

      </div>


      {!hasError && gallery.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

          <Image
            size={45}
            className="mx-auto text-slate-400"
          />

          <p className="mt-4 text-slate-500">
            No photos or videos
            have been added yet.
          </p>

        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {gallery.map(
            (item) => (
              <PublicGalleryCard
                key={item.id}
                item={item}
              />
            ),
          )}

        </div>
      )}

    </section>
  );
}



function PublicGalleryCard({
  item,
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      <div className="h-60 bg-slate-100">

        {item.media_type ===
        "IMAGE" ? (
          item.image ? (
            <a
              href={
                item.image
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={
                  item.image
                }
                alt={
                  item.caption ||
                  "Event gallery"
                }
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </a>
          ) : (
            <ImagePlaceholder />
          )
        ) : (
          item.video ? (
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
          )
        )}

      </div>


      <div className="p-5">

        {item.event_title && (
          <p className="text-sm font-semibold text-indigo-700">
            {
              item.event_title
            }
          </p>
        )}


        {item.caption && (
          <p className="mt-2 leading-6 text-slate-600">
            {item.caption}
          </p>
        )}

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
        title="Community event video"
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
      className="flex h-full flex-col items-center justify-center gap-3 text-indigo-700"
    >
      <Play size={50} />

      <span className="font-semibold">
        Watch Video
      </span>
    </a>
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

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }


    if (
      parsed.hostname.includes(
        "youtu.be",
      )
    ) {
      const videoId =
        parsed.pathname
          .replace("/", "")
          .split("?")[0];

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return null;
  }


  return null;
}



function ImagePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center text-slate-400">

      <Image size={50} />

    </div>
  );
}



function SocialLinks({
  profile,
}) {
  const links = [
    {
      name: "Website",
      url:
        profile.website,
      icon: (
        <Globe size={20} />
      ),
    },

    {
      name: "Instagram",
      url:
        profile.instagram_url,
      icon: <FaInstagram />,
    },

    {
      name: "Facebook",
      url:
        profile.facebook_url,
      icon: <FaFacebookF />,
    },

    {
      name: "LinkedIn",
      url:
        profile.linkedin_url,
      icon: <FaLinkedinIn />,
    },

    {
      name: "X",
      url:
        profile.twitter_url,
      icon: <FaXTwitter />,
    },

    {
      name: "YouTube",
      url:
        profile.youtube_url,
      icon: <FaYoutube />,
    },

    {
      name: "WhatsApp",
      url:
        profile.whatsapp_url,
      icon: <FaWhatsapp />,
    },

    {
      name: "Telegram",
      url:
        profile.telegram_url,
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
    <section className="rounded-2xl bg-white p-7 shadow-sm">

      <h2 className="text-2xl font-bold text-slate-900">
        Connect With Us
      </h2>


      <p className="mt-2 text-slate-500">
        Follow this community on
        social media.
      </p>


      <div className="mt-6 flex flex-wrap gap-3">

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
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 shadow-sm transition hover:-translate-y-1 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {item.icon}
            </a>
          ),
        )}

      </div>

    </section>
  );
}



function OrganizationEventsSection({
  title,
  description,
  events,
  emptyMessage,
  hasError = false,
}) {
  return (
    <section>

      <div className="mb-5">

        <h2 className="text-2xl font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-slate-500">
          {description}
        </p>

      </div>


      {!hasError && events.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

          <CalendarDays
            size={42}
            className="mx-auto text-slate-400"
          />

          <p className="mt-4 text-slate-500">
            {emptyMessage}
          </p>

        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {events.map(
            (event) => (
              <OrganizationEventCard
                key={
                  event.id
                }
                event={
                  event
                }
              />
            ),
          )}

        </div>
      )}

    </section>
  );
}



function OrganizationEventCard({
  event,
}) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >

      <div className="h-44 bg-slate-100">

        {event.banner_image ? (
          <img
            src={
              event.banner_image
            }
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">

            <CalendarDays
              size={42}
            />

          </div>
        )}

      </div>


      <div className="p-5">

        <p className="text-sm font-semibold text-indigo-700">
          {event.category_name ||
            "Event"}
        </p>


        <h3 className="mt-2 text-lg font-bold text-slate-900">
          {event.title}
        </h3>


        <p className="mt-3 text-sm text-slate-500">

          {new Date(
            event.start_datetime,
          ).toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            },
          )}

        </p>

      </div>

    </Link>
  );
}


export default OrganizationProfile;