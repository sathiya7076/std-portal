import { Route, Navigate } from "react-router-dom";
import AdminRoute from "../../components/admin/AdminRoute";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import ManageTrainers from "./ManageTrainers";
import ManageStudents from "./ManageStudents";
import ManageCourses from "./ManageCourses";
import ManageAdmins from "./ManageAdmins";

/**
 * All admin routes in one place.
 *
 * In App.jsx:
 *   import adminRoutes from "./pages/admin/adminRoutes";
 *   ...
 *   <Routes>
 *     ...your existing routes...
 *     {adminRoutes}
 *   </Routes>
 *
 * Put {adminRoutes} directly inside <Routes> (NOT inside your student/trainer
 * ProtectedRoute wrapper), otherwise that wrapper may reject the admin role.
 */
const adminRoutes = (
  <Route path="/admin" element={<AdminRoute />}>
    <Route element={<AdminLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="trainers" element={<ManageTrainers />} />
      <Route path="students" element={<ManageStudents />} />
      <Route path="courses" element={<ManageCourses />} />
      <Route path="admins" element={<ManageAdmins />} />
    </Route>
  </Route>
);

export default adminRoutes;