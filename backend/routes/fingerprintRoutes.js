const express = require("express");
const {
  registerFingerprint,
  getFingerprintStatus,
} = require("../controllers/fingerprintController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.post("/register", requireRole("trainer"), registerFingerprint);
router.get("/student/:studentId", getFingerprintStatus); // trainer or own student

module.exports = router;
