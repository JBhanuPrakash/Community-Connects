import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  const userRole = String(user.role || "")
    .trim()
    .toUpperCase();

  const normalizedAllowedRoles = allowedRoles.map(
    (role) =>
      String(role).trim().toUpperCase(),
  );

  const isAdmin =
    userRole === "ADMIN" ||
    user.is_staff === true ||
    user.is_superuser === true;

  let hasAccess =
    normalizedAllowedRoles.length === 0 ||
    normalizedAllowedRoles.includes(userRole);

  if (
    normalizedAllowedRoles.includes("ADMIN") &&
    isAdmin
  ) {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;