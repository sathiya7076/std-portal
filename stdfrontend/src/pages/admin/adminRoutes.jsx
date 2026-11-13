import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Guards all /admin/* pages.
 *
 * CHANGED: it now uses your AuthContext (same source your ProtectedRoute
 * uses) instead of calling GET /auth/me. Before, any hiccup in that extra
 * request (response shape, token timing) sent the admin straight back to
 * /login right after a successful login, which looks like "login works but
 * it doesn't open the admin page".
 *
 * Security is NOT weakened by this: every /api/admin/* request is still
 * verified by the backend (protect + authorize("admin")), so a non-admin
 * could open the page shell but never load any data.
 */
export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== "admin") {
    // logged in, but not an admin -> send them to their own dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
}