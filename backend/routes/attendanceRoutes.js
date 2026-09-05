const express = require("express");
const {
  markAttendance,
  markMyAttendance, // NEW
  getAttendanceRecords,
  getAttendanceSummary,
  getMyAttendanceSummary,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", requireRole("trainer"), markAttendance);
router.post("/checkin", requireRole("student"), markMyAttendance); // NEW: student self check-in
router.get("/", getAttendanceRecords); // trainer sees all, student sees own
router.get("/me", requireRole("student"), getMyAttendanceSummary);
router.get("/summary/:studentId", getAttendanceSummary); // trainer or own student — ⚠️ verify ownership check exists inside this controller

module.exports = router;