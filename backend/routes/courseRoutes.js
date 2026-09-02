const express = require("express");
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getCourses); // both roles
router.post("/", requireRole("trainer"), createCourse);

router.get("/:id", getCourseById); // both roles
router.put("/:id", requireRole("trainer"), updateCourse);
router.delete("/:id", requireRole("trainer"), deleteCourse);

module.exports = router;
