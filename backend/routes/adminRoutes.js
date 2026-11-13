const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const admin = require("../controllers/adminController");

const router = express.Router();

// Every route below needs: logged in + role = admin
router.use(protect, authorize("admin"));

// Dashboard
router.get("/dashboard", admin.getDashboardStats);

// Trainer management
router.get("/trainers", admin.getTrainers);
router.get("/trainers/:id", admin.getTrainerById);
router.patch("/trainers/:id/approve", admin.approveTrainer);
router.patch("/trainers/:id/reject", admin.rejectTrainer);

// Student management
router.get("/students", admin.getStudents);
router.get("/students/:id", admin.getStudentById);

// Generic user actions (student / trainer / admin)
router.put("/users/:id", admin.updateUser);
router.patch("/users/:id/status", admin.toggleUserStatus);
router.patch("/users/:id/reset-password", admin.resetUserPassword);
router.delete("/users/:id", admin.deleteUser);

// Admin management
router.get("/admins", admin.getAdmins);
router.post("/admins", admin.createAdmin);

// Course management
router.route("/courses").get(admin.getCourses).post(admin.createCourse);
router
  .route("/courses/:id")
  .get(admin.getCourseById)
  .put(admin.updateCourse)
  .delete(admin.deleteCourse);
router.patch("/courses/:id/assign-trainer", admin.assignTrainer);
router.patch("/courses/:id/enroll", admin.enrollStudent);
router.patch("/courses/:id/unenroll", admin.unenrollStudent);

module.exports = router;