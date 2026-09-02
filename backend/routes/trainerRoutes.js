const express = require("express");
const {
  getTrainerProfile,
  updateTrainerProfile,
} = require("../controllers/trainerController");
const { getTrainerDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// Mounted at /api/trainer (singular)
const router = express.Router();

router.use(protect, requireRole("trainer"));

router.get("/profile", getTrainerProfile);
router.put("/profile", updateTrainerProfile);
router.get("/dashboard", getTrainerDashboard);

module.exports = router;
