const express = require("express");
const {
  getStudentFees,
  createFee,
  updateFee,
} = require("../controllers/feeController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/student/:studentId", getStudentFees); // trainer or own student
router.post("/", requireRole("trainer"), createFee);
router.put("/:id", requireRole("trainer"), updateFee);

module.exports = router;
