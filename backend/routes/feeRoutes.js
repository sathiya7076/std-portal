const express = require("express");
const {
  getStudentFees,
  createFee,
  updateFee,
  payFee,
  downloadReceipt,
} = require("../controllers/feeController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/student/:studentId", getStudentFees); // trainer or own student
router.post("/", requireRole("trainer"), createFee);
router.put("/:id", requireRole("trainer"), updateFee);
router.post("/:feeId/pay", payFee); // ownership check happens inside the controller
router.get("/receipt/:receiptNumber", downloadReceipt);

module.exports = router;