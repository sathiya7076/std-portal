const express = require("express");
const { evaluateSubmission } = require("../controllers/taskSubmissionController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.put("/:submissionId/evaluate", requireRole("trainer"), evaluateSubmission);

module.exports = router;
