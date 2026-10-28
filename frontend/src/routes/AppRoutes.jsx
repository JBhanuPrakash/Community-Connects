import {
  lazy,
  Suspense,
} from "react";
import {
  Route,
  Routes,
} from "react-router-dom";


const AdminDashboard = lazy(
  () => import("../pages/AdminDashboard"),
);

const AdminEvents = lazy(
  () => import("../pages/AdminEvents"),
);

const ChangePassword = lazy(
  () => import("../pages/ChangePassword"),
);

const CreateEvent = lazy(
  () => import("../pages/CreateEvent"),
);

const EditEvent = lazy(
  () => import("../pages/EditEvent"),
);

const EditProfile = lazy(
  () => import("../pages/EditProfile"),
);

const EventDetails = lazy(
  () => import("../pages/EventDetails"),
);

const EventParticipants = lazy(
  () => import("../pages/EventParticipants"),
);

const Events = lazy(
  () => import("../pages/Events"),
);

const ForgotPassword = lazy(
  () => import("../pages/ForgotPassword"),
);

const Home = lazy(() => import("../pages/Home"));

const Login = lazy(() => import("../pages/Login"));

const MyTickets = lazy(
  () => import("../pages/MyTickets"),
);

const NearbyEvents = lazy(
  () => import("../pages/NearbyEvents"),
);

const NotFound = lazy(
  () => import("../pages/NotFound"),
);

const Notifications = lazy(
  () => import("../pages/Notifications"),
);

const OrganizationProfile = lazy(
  () => import("../pages/OrganizationProfile"),
);

const OrganizerDashboard = lazy(
  () => import("../pages/OrganizerDashboard"),
);

const OrganizerProfile = lazy(
  () => import("../pages/OrganizerProfile"),
);

const Profile = lazy(() => import("../pages/Profile"));

const Register = lazy(
  () => import("../pages/Register"),
);

const ResetPassword = lazy(
  () => import("../pages/ResetPassword"),
);

const SavedEvents = lazy(
  () => import("../pages/SavedEvents"),
);

const TicketDetails = lazy(
  () => import("../pages/TicketDetails"),
);

const UserDashboard = lazy(
  () => import("../pages/UserDashboard"),
);

const VerifyEmail = lazy(
  () => import("../pages/VerifyEmail"),
);

const VerifyTicket = lazy(
  () => import("../pages/VerifyTicket"),
);

const AdminUsers = lazy(
  () => import("../pages/AdminUsers"),
);

const AdminCategories = lazy(
  () => import("../pages/AdminCategories"),
);

import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";


function SuspenseFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-16">

      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent motion-reduce:animate-none" />

    </div>
  );
}


function AppRoutes() {
  return (
    <Suspense
      fallback={<SuspenseFallback />}
    >
      <Routes>

        <Route element={<MainLayout />}>

          {/* =========================
              PUBLIC ROUTES
          ========================= */}

          <Route
            index
            element={<Home />}
          />


          <Route
            path="events"
            element={<Events />}
          />


          <Route
            path="events/:id"
            element={<EventDetails />}
          />


          <Route
            path="login"
            element={<Login />}
          />


          <Route
            path="register"
            element={<Register />}
          />


          <Route
            path="forgot-password"
            element={<ForgotPassword />}
          />


          <Route
            path="reset-password"
            element={<ResetPassword />}
          />


          <Route
            path="nearby-events"
            element={<NearbyEvents />}
          />


          <Route
            path="organizations/:organizerId"
            element={
              <OrganizationProfile />
            }
          />


          {/* =========================
              AUTHENTICATED COMMON
          ========================= */}

          <Route
            element={
              <ProtectedRoute />
            }
          >

            <Route
              path="profile"
              element={<Profile />}
            />


            <Route
              path="profile/edit"
              element={
                <EditProfile />
              }
            />


            <Route
              path="notifications"
              element={
                <Notifications />
              }
            />


            <Route
              path="change-password"
              element={
                <ChangePassword />
              }
            />


            <Route
              path="verify-email"
              element={
                <VerifyEmail />
              }
            />

          </Route>


          {/* =========================
              USER ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "USER",
                ]}
              />
            }
          >

            <Route
              path="dashboard"
              element={
                <UserDashboard />
              }
            />


            <Route
              path="saved-events"
              element={
                <SavedEvents />
              }
            />


            <Route
              path="tickets"
              element={<MyTickets />}
            />


            <Route
              path="tickets/:id"
              element={
                <TicketDetails />
              }
            />

          </Route>


          {/* =========================
              ORGANIZER ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ORGANIZER",
                ]}
              />
            }
          >

            <Route
              path="organizer/dashboard"
              element={
                <OrganizerDashboard />
              }
            />


            <Route
              path="organizer/profile"
              element={
                <OrganizerProfile />
              }
            />


            <Route
              path="organizer/events/create"
              element={
                <CreateEvent />
              }
            />


            <Route
              path="organizer/events/:id/edit"
              element={
                <EditEvent />
              }
            />


            <Route
              path="organizer/events/:id/participants"
              element={
                <EventParticipants />
              }
            />


            <Route
              path="organizer/tickets/verify"
              element={
                <VerifyTicket />
              }
            />

          </Route>


          {/* =========================
              ADMIN ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                ]}
              />
            }
          >

            <Route
              path="admin/dashboard"
              element={
                <AdminDashboard />
              }
            />


            <Route
              path="admin/events"
              element={
                <AdminEvents />
              }
            />

            <Route
              path="admin/users"
              element={
                <AdminUsers />}
            />

            <Route
              path="admin/categories"
              element={
                <AdminCategories />
              }
            />

          </Route>


          {/* =========================
              404
          ========================= */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Route>

      </Routes>
    </Suspense>
  );
}


export default AppRoutes;