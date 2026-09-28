const express = require("express");
const {
  getCourseImage,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { uploadCourseImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// ADDED: public image route — must be BEFORE protect, <img> can't send a token
router.get("/:id/image", getCourseImage);

router.use(protect);

router.get("/", getCourses);
router.post("/", requireRole("trainer"), uploadCourseImage.single("image"), createCourse);

router.get("/:id", getCourseById);
router.put("/:id", requireRole("trainer"), uploadCourseImage.single("image"), updateCourse);
router.delete("/:id", requireRole("trainer"), deleteCourse);

module.exports = router;