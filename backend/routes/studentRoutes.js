const express = require("express");
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProgress,
} = require("../controllers/studentController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

// NOTE: /api/student/profile and /api/student/dashboard live in
// studentSelfRoutes.js (singular "student" namespace), separate from
// this plural "students" CRUD namespace used by trainers.

router.get("/", requireRole("trainer"), getStudents);
router.post("/", requireRole("trainer"), createStudent);

router.get("/:id", getStudentById); // trainer or the student themself (checked in controller)
router.put("/:id", requireRole("trainer"), updateStudent);
router.delete("/:id", requireRole("trainer"), deleteStudent);
router.get("/:id/progress", getStudentProgress); // trainer or the student themself

module.exports = router;
