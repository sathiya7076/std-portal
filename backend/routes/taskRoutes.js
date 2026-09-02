const express = require("express");
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const {
  submitTask,
  getSubmissionsForTask,
} = require("../controllers/taskSubmissionController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { uploadSubmission } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getTasks); // trainer: created tasks; student: assigned tasks
router.post("/", requireRole("trainer"), createTask);

router.get("/:id", getTaskById);
router.put("/:id", requireRole("trainer"), updateTask);
router.delete("/:id", requireRole("trainer"), deleteTask);

// Submission sub-routes, nested under /api/tasks per spec
router.post(
  "/:taskId/submit",
  requireRole("student"),
  uploadSubmission.single("file"),
  submitTask
);
router.get(
  "/:taskId/submissions",
  requireRole("trainer"),
  getSubmissionsForTask
);

module.exports = router;
