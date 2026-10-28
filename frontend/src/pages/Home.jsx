import { Link } from "react-router-dom";
import {
  ArrowRight,
  Trophy,
  Laptop,
  Palette,
  GraduationCap,
  Calendar,
  Users,
  MapPin,
  Sparkles
} from "lucide-react";

const categories = [
  {
    name: "Sports",
    description: "Find local running groups, tournaments, yoga sessions, and fitness meets.",
    icon: Trophy,
    colorClass: "bg-blue-50 text-blue-600 border-blue-100/50",
    gradient: "from-blue-500 to-indigo-500"
  },
  {
    name: "Technology",
    description: "Join local hackathons, developer meets, design seminars, and coding bootcamps.",
    icon: Laptop,
    colorClass: "bg-indigo-50 text-indigo-600 border-indigo-100/50",
    gradient: "from-indigo-500 to-violet-500"
  },
  {
    name: "Art & Culture",
    description: "Explore pottery, painting workshops, live plays, music gigs, and exhibitions.",
    icon: Palette,
    colorClass: "bg-rose-50 text-rose-600 border-rose-100/50",
    gradient: "from-rose-500 to-pink-500"
  },
  {
    name: "Workshops",
    description: "Upskill with hands-on cooking, photography, writing, and leadership classes.",
    icon: GraduationCap,
    colorClass: "bg-amber-50 text-amber-600 border-amber-100/50",
    gradient: "from-amber-500 to-orange-500"
  }
];

const stats = [
  { value: "50k+", label: "Active Members", desc: "Connecting daily in communities", icon: Users },
  { value: "12k+", label: "Events Hosted", desc: "Interests turned into realities", icon: Calendar },
  { value: "100+", label: "Cities Covered", desc: "Spreading connections nationwide", icon: MapPin }
];

function Home() {
  return (
    <div className="relative min-h-screen bg-[#fafbfe]">
      {/* ========================================
          HERO SECTION (DARK TECH-FORWARD GLOW)
      ======================================== */}
      <section className="relative overflow-hidden bg-[#1a0f2e] px-6 py-28 text-center text-white lg:py-36">
        {/* Ambient Glow Blobs */}
        <div className="ambient-glow animate-pulse-slow absolute -left-20 -top-20 h-[380px] w-[380px] bg-fuchsia-600/25 motion-reduce:animate-none" />
        <div className="ambient-glow animate-pulse-slow absolute -right-20 -bottom-20 h-[380px] w-[380px] bg-amber-500/20 motion-reduce:animate-none" />
        <div className="ambient-glow animate-pulse-slow absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 bg-violet-600/20 motion-reduce:animate-none" />

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Tagline Badge */}
          <div className="animate-fade-in inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-indigo-300 uppercase mb-8 shadow-sm">
            <Sparkles size={12} className="animate-pulse" />
            <span>Discover. Connect. Participate.</span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in font-sans text-5xl font-extrabold tracking-tight leading-tight sm:text-6xl md:text-7xl">
            Discover Events
            <span className="text-gradient-sunset-light mt-2 block">
              Happening Near You
            </span>
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg md:text-xl leading-relaxed">
            Find running clubs, pottery classes, hackathons, art workshops, and vibrant community activities—all from one cohesive, premium platform.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:items-center">
            <Link
              to="/events"
              className="btn-premium btn-sunset flex items-center justify-center gap-2 rounded-xl px-8 py-4 font-bold text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Events
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/register"
              className="btn-premium rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-4 font-bold text-slate-100 hover:text-white transition-all duration-200 active:scale-[0.98]"
            >
              Join CommunityConnect
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          STATS SECTION (FLOATING GLASS BANNER)
      ======================================== */}
      <section className="relative z-20 -mt-10 mx-auto max-w-6xl px-6">
        <div className="glass-card rounded-2xl p-8 md:p-10 shadow-xl shadow-slate-950/[0.02]">
          <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-slate-200/60">
            {stats.map((stat, index) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center md:items-start md:text-left md:px-8 first:pl-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                      <StatIcon size={20} />
                    </div>
                    <span className="text-gradient-sunset text-3xl font-extrabold tracking-tight">
                      {stat.value}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-slate-800">
                    {stat.label}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {stat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================
          POPULAR CATEGORIES
      ======================================== */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Popular Categories
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
            Browse hand-picked events tailored to your specific passions and professional goals.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <article
                key={category.name}
                className="glass-card glass-card-hover group flex flex-col justify-between rounded-2xl p-8 border border-slate-200/50 shadow-sm"
              >
                <div>
                  {/* Category Icon */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${category.colorClass} shadow-inner transition-transform group-hover:scale-105 duration-300`}>
                    <IconComponent size={24} />
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {category.name}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {category.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100/50">
                  <Link
                    to={`/events?category=${encodeURIComponent(category.name)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 uppercase tracking-wider"
                  >
                    <span>View Events</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Home;