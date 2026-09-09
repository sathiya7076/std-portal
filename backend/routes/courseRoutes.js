const express = require("express");
const multer = require("multer");
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

// Adjust destination/limits to match your other upload routes if any exist.
const upload = multer({
  dest: "uploads/courses/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.use(protect);

router.get("/", getCourses); // both roles
router.post("/", requireRole("trainer"), upload.single("image"), createCourse);

router.get("/:id", getCourseById); // both roles
router.put("/:id", requireRole("trainer"), upload.single("image"), updateCourse);
router.delete("/:id", requireRole("trainer"), deleteCourse);

module.exports = router;