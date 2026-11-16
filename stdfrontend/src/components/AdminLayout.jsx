import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Dashboard link is /admin/dashboard, because Login.jsx redirects with
// navigate(`/${user.role}/dashboard`) => /admin/dashboard.
const links = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/trainers", label: "Trainers" },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/courses", label: "Courses" },
  { to: "/admin/admins", label: "Admins" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // FIXED: now uses your AuthContext logout (clears stms_user / stms_token
  // and the in-memory user). The earlier version cleared the wrong
  // localStorage keys, so you stayed logged in after clicking Logout.
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <aside
        className="bg-dark text-white p-3 d-flex flex-column"
        style={{ width: 230 }}
      >
        <h5 className="mb-1">Admin Panel</h5>
        {user?.name && <div className="small text-white-50 mb-4">{user.name}</div>}
        <nav className="nav flex-column gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `nav-link rounded text-white ${isActive ? "bg-primary" : ""}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn-outline-light mt-auto" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="flex-grow-1 bg-light p-4" style={{ minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}