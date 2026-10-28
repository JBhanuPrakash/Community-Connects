import { CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

function EventCard({ event }) {
  const startDate = new Date(event.start_datetime);

  return (
    <article className="glass-card glass-card-hover group flex flex-col overflow-hidden rounded-2xl">
      {/* Banner Image Container */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
        {event.banner_image ? (
          <img
            src={event.banner_image}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50 text-slate-400 font-medium text-sm">
            No event image
          </div>
        )}
        {/* Soft Inner Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/25 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Details Container */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {/* Tags */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="rounded-lg bg-indigo-50/80 border border-indigo-100/50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 shadow-sm">
              {event.category_name}
            </span>

            <span
              className={`text-xs font-extrabold rounded-lg px-2.5 py-1 shadow-sm ${
                Number(event.price) === 0
                  ? "bg-amber-50 border border-amber-200/60 text-amber-700"
                  : "bg-slate-50 border border-slate-200/50 text-slate-800"
              }`}
            >
              {Number(event.price) === 0 ? "Free" : `₹${event.price}`}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-1">
            {event.title}
          </h2>

          {/* Description */}
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {event.short_description || event.description}
          </p>

          {/* Metadata Grid */}
          <div className="mt-5 space-y-2.5 border-t border-slate-100/60 pt-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-indigo-500" />
              <span>
                {startDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-indigo-500" />
              <span className="truncate">
                {event.mode === "ONLINE"
                  ? "Online"
                  : `${event.venue_name || "Venue"}, ${event.city}`}
              </span>
            </div>

            {event.capacity && (
              <div className="flex items-center gap-2">
                <Users size={15} className="text-indigo-500" />
                <span>{event.capacity} seats</span>
              </div>
            )}
          </div>
        </div>

        {/* View Details Action */}
        <Link
          to={`/events/${event.id}`}
          className="btn-premium btn-sunset mt-6 block rounded-xl py-3 text-center text-sm font-bold text-white active:scale-[0.98] transition-all"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export default EventCard;
