import api from "./api"; // your existing axios instance (baseURL + token handled there)

/**
 * Admin API service (add-only: does not touch your existing files).
 * Uses your existing `api` instance (same one AddStudent.jsx uses).
 */
export const errMsg = (e) =>
  e?.response?.data?.message || e?.message || "Something went wrong";

// Backend responses look like { success, message, data }.
// CHANGED: works whether your api.js returns the raw axios response
// (res.data = { success, message, data }) or already unwraps it
// (res.data = the payload), so the admin pages never read `undefined`.
const unwrap = (promise) =>
  promise.then((res) => {
    const payload = res?.data;
    if (
      payload &&
      typeof payload === "object" &&
      "success" in payload &&
      "data" in payload
    ) {
      return payload.data;
    }
    return payload;
  });

export const adminService = {
  me: () => unwrap(api.get("/auth/me")),

  // Dashboard
  dashboard: () => unwrap(api.get("/admin/dashboard")),

  // Trainers (id = User _id)
  getTrainers: (params) => unwrap(api.get("/admin/trainers", { params })),
  approveTrainer: (id) => unwrap(api.patch(`/admin/trainers/${id}/approve`)),
  rejectTrainer: (id, reason) =>
    unwrap(api.patch(`/admin/trainers/${id}/reject`, { reason })),

  // Students
  getStudents: (params) => unwrap(api.get("/admin/students", { params })),

  // Generic user actions
  toggleUserStatus: (id) => unwrap(api.patch(`/admin/users/${id}/status`)),
  resetPassword: (id, newPassword) =>
    unwrap(api.patch(`/admin/users/${id}/reset-password`, { newPassword })),
  deleteUser: (id) => unwrap(api.delete(`/admin/users/${id}`)),

  // Admins
  getAdmins: () => unwrap(api.get("/admin/admins")),
  createAdmin: (body) => unwrap(api.post("/admin/admins", body)),

  // Courses
  getCourses: (params) => unwrap(api.get("/admin/courses", { params })),
  createCourse: (body) => unwrap(api.post("/admin/courses", body)),
  updateCourse: (id, body) => unwrap(api.put(`/admin/courses/${id}`, body)),
  deleteCourse: (id) => unwrap(api.delete(`/admin/courses/${id}`)),
  assignTrainer: (id, trainerId) =>
    unwrap(api.patch(`/admin/courses/${id}/assign-trainer`, { trainerId })),
};