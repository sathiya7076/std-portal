const asyncHandler = require("express-async-handler");
const FingerprintRegistration = require("../models/FingerprintRegistration");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Biometric simulation only. No raw fingerprint image/template is ever
 * accepted or stored — we simply generate an opaque registration
 * reference and mark the student as registered. This keeps the schema
 * and API contract stable so real fingerprint hardware/SDK integration
 * can be swapped in later without breaking the frontend.
 */

// @desc    Register (simulate) a student's fingerprint
// @route   POST /api/fingerprint/register
// @access  Private (trainer only)
const registerFingerprint = asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    throw new ApiError(400, "studentId is required");
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const existing = await FingerprintRegistration.findOne({ studentId });
  if (existing) {
    existing.status = "registered";
    existing.registeredAt = new Date();
    await existing.save();
    return sendSuccess(
      res,
      200,
      "Fingerprint registration updated successfully",
      existing
    );
  }

  const registration = await FingerprintRegistration.create({
    studentId,
    status: "registered",
    registeredAt: new Date(),
  });

  return sendSuccess(
    res,
    201,
    "Fingerprint registered successfully",
    registration
  );
});

// @desc    Get fingerprint registration status for a student
// @route   GET /api/fingerprint/student/:studentId
// @access  Private (trainer, or the student themself)
const getFingerprintStatus = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== studentId) {
      throw new ApiError(
        403,
        "You can only access your own fingerprint status"
      );
    }
  }

  const registration = await FingerprintRegistration.findOne({ studentId });
  if (!registration) {
    throw new ApiError(
      404,
      "No fingerprint registration found for this student"
    );
  }

  return sendSuccess(
    res,
    200,
    "Fingerprint registration status fetched successfully",
    registration
  );
});

module.exports = { registerFingerprint, getFingerprintStatus };
