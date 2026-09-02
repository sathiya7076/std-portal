const express = require("express");
const {
  markAttendance,
  getAttendanceRecords,
  getAttendanceSummary,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", requireRole("trainer"), markAttendance);
router.get("/", getAttendanceRecords); // trainer sees all, student sees own
router.get("/summary/:studentId", getAttendanceSummary); // trainer or own student

module.exports = router;
