import { Navigate, Route } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminRoute from "../../components/AdminRoute";
import AdminDashboard from "./Admindashboard";
import ManageAdmins from "./Manageadmins";
import ManageCourses from "./Managecourse";
import ManageStudents from "./Managestudents";
import ManageTrainers from "./Managetrainers";

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
