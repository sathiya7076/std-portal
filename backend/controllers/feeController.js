const asyncHandler = require("express-async-handler");
const Fee = require("../models/Fee");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getStudentFeeSummary } = require("../services/feeService");
const { createNotification } = require("../services/notificationService");

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

module.exports = { getStudentFees, createFee, updateFee };
