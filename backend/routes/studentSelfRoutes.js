// studentRoutes.js
const express = require("express");
const {
  getMyProfile,
  updateMyProfile,
  getMyProgress, // NEW: add this controller
} = require("../controllers/studentController");
const { getStudentDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// Mounted at /api/student (singular) — distinct from /api/students (CRUD)
const router = express.Router();

router.use(protect, requireRole("student"));

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/progress", getMyProgress); // NEW: fixes the missing progress endpoint
router.get("/dashboard", getStudentDashboard);

module.exports = router;