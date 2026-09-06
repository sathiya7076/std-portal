const asyncHandler = require("express-async-handler");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getStudentFeeSummary } = require("../services/feeService");
const { createNotification } = require("../services/notificationService");
const PDFDocument = require("pdfkit"); // npm install pdfkit

// @desc    Get fee records + summary for a student
// @route   GET /api/fees/student/:studentId
// @access  Private (trainer, or the student themself)
const getStudentFees = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== studentId) {
      throw new ApiError(403, "You can only access your own fee records");
    }
  } else {
    const exists = await Student.findById(studentId);
    if (!exists) throw new ApiError(404, "Student not found");
  }

  const summary = await getStudentFeeSummary(studentId);

  return sendSuccess(res, 200, "Fee details fetched successfully", summary);
});

// @desc    Create a fee record for a student
// @route   POST /api/fees
// @access  Private (trainer only)
const createFee = asyncHandler(async (req, res) => {
  const { studentId, courseId, totalFees, dueDate } = req.body;

  if (!studentId || !courseId || totalFees === undefined) {
    throw new ApiError(400, "studentId, courseId, and totalFees are required");
  }

  const student = await Student.findById(studentId).populate("userId", "_id");
  if (!student) throw new ApiError(404, "Student not found");

  const fee = await Fee.create({
    studentId,
    courseId,
    totalFees,
    dueDate,
  });

  await createNotification({
    userId: student.userId._id,
    type: "fee",
    title: "Fee Record Created",
    message: `A fee of ₹${totalFees} has been assigned for your course.`,
    relatedId: fee._id,
  });

  return sendSuccess(res, 201, "Fee record created successfully", fee);
});

// @desc    Update a fee record
// @route   PUT /api/fees/:id
// @access  Private (trainer only)
const updateFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) throw new ApiError(404, "Fee record not found");

  const { totalFees, paidAmount, dueDate } = req.body;
  if (totalFees !== undefined) fee.totalFees = totalFees;
  if (paidAmount !== undefined) fee.paidAmount = paidAmount;
  if (dueDate !== undefined) fee.dueDate = dueDate;

  await fee.save();

  return sendSuccess(res, 200, "Fee record updated successfully", fee);
});

// @desc    Record a payment against a fee record
// @route   POST /api/fees/:feeId/pay
// @access  Private (trainer, or the student themself)
const payFee = asyncHandler(async (req, res) => {
  const { feeId } = req.params;
  const { amount, method } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, "A valid payment amount is required");
  }

  const fee = await Fee.findById(feeId).populate("studentId");
  if (!fee) throw new ApiError(404, "Fee record not found");

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== fee.studentId._id.toString()) {
      throw new ApiError(403, "You can only pay your own fees");
    }
  }

  const pending = Math.max(fee.totalFees - fee.paidAmount, 0);
  if (amount > pending) {
    throw new ApiError(400, `Amount exceeds pending balance of ₹${pending}`);
  }

  const payment = await Payment.create({
    studentId: fee.studentId._id,
    feeId: fee._id,
    amount,
    method: method || "other",
  });

  fee.paidAmount += amount;
  await fee.save();

  await createNotification({
    userId: fee.studentId.userId,
    type: "fee",
    title: "Payment Received",
    message: `Your payment of ₹${amount} has been recorded. Receipt: ${payment.receiptNumber}`,
    relatedId: payment._id,
  });

  return sendSuccess(res, 201, "Payment recorded successfully", payment);
});

// @desc    Download a PDF receipt for a payment
// @route   GET /api/fees/receipt/:receiptNumber
// @access  Private (trainer, or the student themself)
const downloadReceipt = asyncHandler(async (req, res) => {
  const { receiptNumber } = req.params;

  const payment = await Payment.findOne({ receiptNumber })
    .populate("studentId")
    .populate("feeId");
  if (!payment) throw new ApiError(404, "Receipt not found");

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== payment.studentId._id.toString()) {
      throw new ApiError(403, "You can only access your own receipts");
    }
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${receiptNumber}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("Payment Receipt", { align: "center" });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Receipt Number: ${payment.receiptNumber}`);
  doc.text(`Transaction Ref: ${payment.transactionRef}`);
  doc.text(`Date: ${payment.paidAt.toISOString().slice(0, 10)}`);
  doc.moveDown();
  // Adjust `payment.studentId.name` to whatever field your Student schema uses for display name
  doc.text(`Student: ${payment.studentId.name || payment.studentId._id}`);
  doc.text(`Payment Method: ${payment.method}`);
  doc.text(`Amount Paid: Rs. ${payment.amount.toLocaleString("en-IN")}`);
  doc.moveDown();
  doc.text(`Total Fees: Rs. ${payment.feeId.totalFees.toLocaleString("en-IN")}`);
  doc.text(`Paid So Far: Rs. ${payment.feeId.paidAmount.toLocaleString("en-IN")}`);
  doc.text(
    `Pending Balance: Rs. ${Math.max(payment.feeId.totalFees - payment.feeId.paidAmount, 0).toLocaleString("en-IN")}`
  );
  doc.moveDown(2);
  doc.fontSize(10).fillColor("gray").text("This is a system-generated receipt.", { align: "center" });

  doc.end();
});

module.exports = { getStudentFees, createFee, updateFee, payFee, downloadReceipt };