const express = require("express");
const {
  createPayment,
  getStudentPayments,
  getPaymentReceipt,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", requireRole("trainer"), createPayment);

// Two-segment route (paymentId + /receipt) has a different path shape
// than the single-segment /:studentId route below, so there's no
// actual routing clash between them.
router.get("/:paymentId/receipt", getPaymentReceipt); // trainer or the paying student
router.get("/:studentId", getStudentPayments); // trainer or own student

module.exports = router;
