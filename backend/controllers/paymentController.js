const asyncHandler = require("express-async-handler");
const PDFDocument = require("pdfkit");
const Payment = require("../models/Payment");
const Fee = require("../models/Fee");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { applyPaymentToFee } = require("../services/feeService");
const { createNotification } = require("../services/notificationService");

// @desc    Record a new payment against a fee record
// @route   POST /api/payments
// @access  Private (trainer only)
const createPayment = asyncHandler(async (req, res) => {
  const { studentId, feeId, amount, method } = req.body;

  if (!studentId || !feeId || !amount) {
    throw new ApiError(400, "studentId, feeId, and amount are required");
  }

  const fee = await Fee.findById(feeId);
  if (!fee) throw new ApiError(404, "Fee record not found");

  if (fee.studentId.toString() !== studentId) {
    throw new ApiError(400, "This fee record does not belong to the given student");
  }

  const student = await Student.findById(studentId).populate("userId", "_id");
  if (!student) throw new ApiError(404, "Student not found");

  const payment = await Payment.create({
    studentId,
    feeId,
    amount,
    method,
  });

  await applyPaymentToFee(feeId, amount);

  await createNotification({
    userId: student.userId._id,
    type: "fee",
    title: "Payment Received",
    message: `Your payment of ₹${amount} was recorded successfully.`,
    relatedId: payment._id,
  });

  return sendSuccess(res, 201, "Payment recorded successfully", payment);
});

// @desc    Get payment history for a student
// @route   GET /api/payments/:studentId
// @access  Private (trainer, or the student themself)
const getStudentPayments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== studentId) {
      throw new ApiError(403, "You can only access your own payment history");
    }
  }

  const payments = await Payment.find({ studentId }).sort({ paidAt: -1 });

  return sendSuccess(res, 200, "Payment history fetched successfully", payments);
});

// @desc    Generate/download a PDF receipt for a payment
// @route   GET /api/payments/:paymentId/receipt
// @access  Private (trainer, or the student who made the payment)
const getPaymentReceipt = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId).populate({
    path: "studentId",
    populate: { path: "userId", select: "name email" },
  });

  if (!payment) throw new ApiError(404, "Payment not found");

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== payment.studentId._id.toString()) {
      throw new ApiError(403, "You can only access your own receipts");
    }
  }

  const fee = await Fee.findById(payment.feeId);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="receipt-${payment.receiptNumber}.pdf"`
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("Payment Receipt", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text("Smart Training Management System", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(12);
  doc.text(`Receipt Number: ${payment.receiptNumber}`);
  doc.text(`Transaction Ref: ${payment.transactionRef}`);
  doc.text(`Date: ${new Date(payment.paidAt).toDateString()}`);
  doc.moveDown();

  doc.text(`Student Name: ${payment.studentId.userId.name}`);
  doc.text(`Student ID: ${payment.studentId.studentId}`);
  doc.text(`Email: ${payment.studentId.userId.email}`);
  doc.moveDown();

  doc.text(`Payment Method: ${payment.method}`);
  doc.text(`Amount Paid: ₹${payment.amount}`);
  if (fee) {
    doc.text(`Total Fees: ₹${fee.totalFees}`);
    doc.text(`Total Paid To Date: ₹${fee.paidAmount}`);
    doc.text(`Pending Amount: ₹${Math.max(fee.totalFees - fee.paidAmount, 0)}`);
  }

  doc.moveDown(2);
  doc.fontSize(10).text("This is a system-generated receipt.", {
    align: "center",
  });

  doc.end();
});

module.exports = { createPayment, getStudentPayments, getPaymentReceipt };
