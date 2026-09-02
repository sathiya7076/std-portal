const asyncHandler = require("express-async-handler");
const Trainer = require("../models/Trainer");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Resolves the Trainer document owned by the currently authenticated
 * trainer user. Throws 404 if no profile exists yet.
 */
const getOwnTrainerProfile = async (userId) => {
  const trainer = await Trainer.findOne({ userId });
  if (!trainer) throw new ApiError(404, "Trainer profile not found");
  return trainer;
};

// @desc    Get trainer profile (own)
// @route   GET /api/trainer/profile
// @access  Private (trainer only)
const getTrainerProfile = asyncHandler(async (req, res) => {
  const trainer = await Trainer.findOne({ userId: req.user._id })
    .populate("userId", "name email")
    .populate("courseIds", "name");

  if (!trainer) {
    throw new ApiError(404, "Trainer profile not found");
  }

  return sendSuccess(res, 200, "Trainer profile fetched successfully", {
    trainerName: trainer.userId.name,
    trainerId: trainer.trainerId,
    email: trainer.userId.email,
    phone: trainer.phone,
    teachingCourses: trainer.courseIds,
    experience: trainer.experience,
    specialization: trainer.specialization,
  });
});

// @desc    Update trainer profile (own)
// @route   PUT /api/trainer/profile
// @access  Private (trainer only)
const updateTrainerProfile = asyncHandler(async (req, res) => {
  const { phone, experience, specialization } = req.body;

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer) {
    throw new ApiError(404, "Trainer profile not found");
  }

  if (phone !== undefined) trainer.phone = phone;
  if (experience !== undefined) trainer.experience = experience;
  if (specialization !== undefined) trainer.specialization = specialization;

  await trainer.save();

  return sendSuccess(res, 200, "Trainer profile updated successfully", trainer);
});

module.exports = { getTrainerProfile, updateTrainerProfile, getOwnTrainerProfile };
