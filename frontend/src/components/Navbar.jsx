import {
  Bell,
  Bookmark,
  Building2,
  CalendarDays,
  Home,
  KeyRound,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  QrCode,
  ShieldCheck,
  Tags,
  Ticket,
  User,
  Users,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";


function Navbar() {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const [menuOpen, setMenuOpen] =
    useState(false);


  // --------------------------------
  // ROLE
  // --------------------------------

  const userRole = String(
    user?.role || "",
  )
    .trim()
    .toUpperCase();


  const isAdmin =
    userRole === "ADMIN" ||
    user?.is_staff ||
    user?.is_superuser;


  const isOrganizer =
    userRole === "ORGANIZER";


  const isRegularUser =
    userRole === "USER";


  // --------------------------------
  // MENU
  // --------------------------------

  const closeMenu = () => {
    setMenuOpen(false);
  };


  // --------------------------------
  // LOGOUT
  // --------------------------------

  const handleLogout = () => {
    closeMenu();

    logout();

    navigate("/login");
  };


  // --------------------------------
  // PROFILE ROUTE
  // --------------------------------

  const getProfilePath = () => {
    /*
      Organizer organization profile
      is separate.

      The navbar "Profile" should normally
      point to the user's personal profile.
    */

    return "/profile";
  };


  // --------------------------------
  // LOCK PAGE SCROLL
  // --------------------------------

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [menuOpen]);


  // --------------------------------
  // ESCAPE KEY CLOSES MENU
  // --------------------------------

  useEffect(() => {
    const handleKeyDown = (
      event,
    ) => {
      if (
        event.key === "Escape"
      ) {
        closeMenu();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);


  return (
    <>
      {/* ========================================
          NAVBAR
      ======================================== */}

      <header className="sticky top-0 z-50 relative bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300">

        {/* Sunset gradient underline */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-fuchsia-500 via-violet-500 to-amber-400" />

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* ====================================
              LOGO
          ==================================== */}

          <Link
            to="/"
            className="group flex items-center gap-3"
          >

            <div className="btn-premium flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100/40 group-hover:scale-[1.03] transition-all">

              <Users size={20} className="group-hover:rotate-[6deg] transition-transform duration-300" />

            </div>


            <span className="hidden text-xl font-extrabold tracking-tight text-slate-900 sm:block">
              Community<span className="text-gradient-sunset">Connect</span>
            </span>

          </Link>


          {/* ====================================
              RIGHT NAVIGATION
          ==================================== */}

          <nav className="flex items-center gap-1 sm:gap-2">

            {/* EVENTS */}

            <NavLink
              to="/events"
              className={({
                isActive,
              }) =>
                `hidden rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 sm:inline-flex ${
                  isActive
                    ? "bg-gradient-to-r from-fuchsia-500/15 to-amber-400/15 text-fuchsia-700 shadow-sm border border-fuchsia-200/60"
                    : "text-slate-600 hover:bg-slate-50 hover:text-fuchsia-600"
                }`
              }
            >
              Events
            </NavLink>


            {/* ==================================
                LOGGED OUT
            ================================== */}

            {!isAuthenticated && (
              <>

                {/* LOGIN */}

                <NavLink
                  to="/login"
                  className={({
                    isActive,
                  }) =>
                    `rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
                      isActive
                        ? "bg-gradient-to-r from-fuchsia-500/15 to-amber-400/15 text-fuchsia-700 shadow-sm border border-fuchsia-200/60"
                        : "text-slate-600 hover:bg-slate-50 hover:text-fuchsia-600"
                    }`
                  }
                >
                  Login
                </NavLink>


                {/* REGISTER */}

                <NavLink
                  to="/register"
                  className="btn-premium btn-sunset hidden items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold text-white active:scale-[0.97] sm:inline-flex"
                >
                  Register
                </NavLink>

              </>
            )}


            {/* ==================================
                LOGGED IN
            ================================== */}

            {isAuthenticated && (
              <>

                {/* PROFILE */}

                <NavLink
                  to={getProfilePath()}
                  title="Profile"
                  className={({
                    isActive,
                  }) =>
                    `flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 sm:px-3.5 ${
                      isActive
                        ? "bg-gradient-to-r from-fuchsia-500/15 to-amber-400/15 text-fuchsia-700 shadow-sm border border-fuchsia-200/60"
                        : "text-slate-600 hover:bg-slate-50 hover:text-fuchsia-600"
                    }`
                  }
                >

                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-600 border border-indigo-200/50 shadow-inner">

                    {user?.profile_image ? (
                      <img
                        src={
                          user.profile_image
                        }
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User
                        size={16}
                      />
                    )}

                  </div>


                  <span className="hidden lg:inline">
                    Profile
                  </span>

                </NavLink>


                {/* NOTIFICATION */}

                <div
                  className="flex items-center"
                  title="Notifications"
                >
                  <NotificationBell />
                </div>


                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  title="Logout"
                  aria-label="Logout"
                  className="btn-premium hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50/70 sm:flex active:scale-[0.97]"
                >

                  <LogOut
                    size={17}
                  />

                  <span className="hidden lg:inline">
                    Logout
                  </span>

                </button>

              </>
            )}


            {/* ==================================
                MENU BUTTON
            ================================== */}

            <button
              type="button"
              onClick={() =>
                setMenuOpen(true)
              }
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              title="Menu"
              className="btn-premium flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-fuchsia-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.97]"
            >

              <Menu size={22} />

            </button>

          </nav>

        </div>

      </header>


      {/* ========================================
          DARK OVERLAY
      ======================================== */}

      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMenu}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px]"
        />
      )}


      {/* ========================================
          RIGHT SIDE DRAWER
      ======================================== */}

      <aside
        id="mobile-nav-drawer"
        aria-label="Navigation menu"
        aria-hidden={!menuOpen}
        aria-modal={menuOpen ? true : undefined}
        role={menuOpen ? "dialog" : undefined}
        inert={!menuOpen}
        className={`fixed right-0 top-0 z-[70] h-full w-[340px] max-w-[88vw] border-l border-slate-100 bg-white/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out ${
          menuOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >

        {/* ====================================
            DRAWER HEADER
        ==================================== */}

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5.5">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              CommunityConnect
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-slate-900 tracking-tight">
              Menu
            </h2>

          </div>


          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className="btn-premium flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-indigo-600 active:scale-[0.97]"
          >

            <X size={20} />

          </button>

        </div>


        {/* ====================================
            USER INFORMATION
        ==================================== */}

        {isAuthenticated && (
          <div className="border-b border-slate-100 px-6 py-6 bg-slate-50/40">

            <div className="flex items-center gap-3.5">

              {/* PROFILE IMAGE */}

              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100/40">

                {user?.profile_image ? (
                  <img
                    src={
                      user.profile_image
                    }
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={20} />
                )}

              </div>


              {/* USER INFO */}

              <div className="min-w-0">

                <p className="truncate text-base font-bold text-slate-900">

                  {user?.first_name
                    ? `${user.first_name} ${
                        user?.last_name ||
                        ""
                      }`
                    : user?.username}

                </p>


                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mt-0.5">

                  {isAdmin
                    ? "Administrator"
                    : isOrganizer
                      ? "Organizer"
                      : "Community Member"}

                </p>

              </div>

            </div>

          </div>
        )}


        {/* ====================================
            DRAWER CONTENT
        ==================================== */}

        <div className="h-[calc(100vh-95px)] overflow-y-auto px-4 pb-8 pt-4">

          <div className="space-y-1">

            {/* ==================================
                GENERAL
            ================================== */}

            <MenuSection
              title="Explore"
            />


            <DrawerLink
              to="/"
              icon={
                <Home size={19} />
              }
              label="Home"
              closeMenu={
                closeMenu
              }
            />


            <DrawerLink
              to="/events"
              icon={
                <CalendarDays
                  size={19}
                />
              }
              label="Events"
              closeMenu={
                closeMenu
              }
            />


            <DrawerLink
              to="/nearby-events"
              icon={
                <MapPin size={19} />
              }
              label="Nearby Events"
              closeMenu={
                closeMenu
              }
            />


            {/* ==================================
                REGULAR USER
            ================================== */}

            {isAuthenticated &&
              isRegularUser && (
                <>

                  <MenuSection
                    title="My Account"
                  />


                  <DrawerLink
                    to="/dashboard"
                    icon={
                      <Home
                        size={19}
                      />
                    }
                    label="Dashboard"
                    closeMenu={
                      closeMenu
                    }
                  />


                  <DrawerLink
                    to="/saved-events"
                    icon={
                      <Bookmark
                        size={19}
                      />
                    }
                    label="Saved Events"
                    closeMenu={
                      closeMenu
                    }
                  />


                  <DrawerLink
                    to="/tickets"
                    icon={
                      <Ticket
                        size={19}
                      />
                    }
                    label="My Tickets"
                    closeMenu={
                      closeMenu
                    }
                  />

                </>
              )}


            {/* ==================================
                ORGANIZER
            ================================== */}

            {isAuthenticated &&
              isOrganizer && (
                <>

                  <MenuSection
                    title="Organizer"
                  />


                  <DrawerLink
                    to="/organizer/dashboard"
                    icon={
                      <Home
                        size={19}
                      />
                    }
                    label="Organizer Dashboard"
                    closeMenu={
                      closeMenu
                    }
                  />


                  <DrawerLink
                    to="/organizer/events/create"
                    icon={
                      <PlusCircle
                        size={19}
                      />
                    }
                    label="Create Event"
                    closeMenu={
                      closeMenu
                    }
                  />


                  <DrawerLink
                    to="/organizer/profile"
                    icon={
                      <Building2
                        size={19}
                      />
                    }
                    label="Organization Profile"
                    closeMenu={
                      closeMenu
                    }
                  />


                  <DrawerLink
                    to="/organizer/tickets/verify"
                    icon={
                      <QrCode
                        size={19}
                      />
                    }
                    label="Verify Ticket"
                    closeMenu={
                      closeMenu
                    }
                  />

                </>
              )}


            {/* ==================================
                ADMIN
            ================================== */}

            {isAuthenticated &&
              isAdmin && (
                <>

                  <MenuSection
                    title="Administration"
                  />


                  <DrawerLink
                    to="/admin/dashboard"
                    icon={
                      <ShieldCheck
                        size={19}
                      />
                    }
                    label="Admin Dashboard"
                    closeMenu={
                      closeMenu
                    }
                  />


                  <DrawerLink
                    to="/admin/users"
                    icon={
                      <Users
                        size={19}
                      />
                    }
                    label="Manage Users"
                    closeMenu={
                      closeMenu
                    }
                  />


                  <DrawerLink
                    to="/admin/events"
                    icon={
                      <CalendarDays
                        size={19}
                      />
                    }
                    label="Manage Events"
                    closeMenu={
                      closeMenu
                    }
                  />


                  <DrawerLink
                    to="/admin/categories"
                    icon={
                      <Tags
                        size={19}
                      />
                    }
                    label="Categories"
                    closeMenu={
                      closeMenu
                    }
                  />

                </>
              )}


            {/* ==================================
                LOGGED-IN COMMON
            ================================== */}

            {isAuthenticated && (
              <>

                <MenuSection
                  title="Settings"
                />


                <DrawerLink
                  to="/profile"
                  icon={
                    <User
                      size={19}
                    />
                  }
                  label="My Profile"
                  closeMenu={
                    closeMenu
                  }
                />


                <DrawerLink
                  to="/notifications"
                  icon={
                    <Bell
                      size={19}
                    />
                  }
                  label="Notifications"
                  closeMenu={
                    closeMenu
                  }
                />


                <DrawerLink
                  to="/change-password"
                  icon={
                    <KeyRound
                      size={19}
                    />
                  }
                  label="Change Password"
                  closeMenu={
                    closeMenu
                  }
                />


                {/* LOGOUT IN DRAWER */}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold text-red-600 transition hover:bg-red-50"
                >

                  <LogOut
                    size={19}
                  />

                  Logout

                </button>

              </>
            )}


            {/* ==================================
                LOGGED OUT
            ================================== */}

            {!isAuthenticated && (
              <>

                <MenuSection
                  title="Account"
                />


                <DrawerLink
                  to="/login"
                  icon={
                    <User
                      size={19}
                    />
                  }
                  label="Login"
                  closeMenu={
                    closeMenu
                  }
                />


                <DrawerLink
                  to="/register"
                  icon={
                    <Users
                      size={19}
                    />
                  }
                  label="Create Account"
                  closeMenu={
                    closeMenu
                  }
                />

              </>
            )}

          </div>

        </div>

      </aside>
    </>
  );
}


/* ==========================================
   DRAWER LINK COMPONENT
========================================== */

function DrawerLink({
  to,
  icon,
  label,
  closeMenu,
}) {
  return (
    <NavLink
      to={to}
      onClick={closeMenu}
      className={({
        isActive,
      }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
          isActive
            ? "bg-gradient-to-r from-fuchsia-500/15 to-amber-400/15 text-fuchsia-700 shadow-sm border border-fuchsia-200/30"
            : "text-slate-600 hover:bg-slate-50 hover:text-fuchsia-600"
        }`
      }
    >

      <span className="shrink-0">
        {icon}
      </span>

      <span>
        {label}
      </span>

    </NavLink>
  );
}


/* ==========================================
   MENU SECTION COMPONENT
========================================== */

function MenuSection({
  title,
}) {
  return (
    <p className="mb-2 mt-5 px-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
      {title}
    </p>
  );
}


export default Navbar;