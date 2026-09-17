const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Student = require("../models/Student");
const Trainer = require("../models/Trainer");
const generateToken = require("../utils/generateToken");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Generates a simple unique-ish sequential-style ID prefix
 * (e.g. STU-<timestamp36>) to seed studentId/trainerId when
 * not supplied at registration time.
 */
const generateShortId = (prefix) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}`;

// @desc    Register a new user (student or trainer)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, courseId } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  if (!["student", "trainer"].includes(role)) {
    throw new ApiError(400, "Role must be either 'student' or 'trainer'");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const user = await User.create({ name, email, password, role });

  // DEBUG: confirm what was actually stored at registration time
  console.log("[REGISTER] Created user:", {
    id: user._id,
    email: user.email,
  });

  let profile;
  if (role === "student") {
    profile = await Student.create({
      userId: user._id,
      studentId: generateShortId("STU"),
      courseId: courseId || undefined,
      phone,
    });
  } else {
    profile = await Trainer.create({
      userId: user._id,
      trainerId: generateShortId("TRN"),
      phone,
    });
  }

  const token = generateToken(user._id, user.role);

  return sendSuccess(res, 201, "Registration successful", {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    profile,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // DEBUG: see exactly what the frontend sent, including hidden whitespace
  console.log("[LOGIN] Raw request body:", {
    email: JSON.stringify(email),
    password: JSON.stringify(password),
  });

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  // DEBUG: confirm whether a User document was found at all
  console.log("[LOGIN] Lookup result:", {
    searchedEmail: email.toLowerCase(),
    userFound: !!user,
    storedEmail: user ? user.email : null,
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);

  // DEBUG: confirm whether bcrypt.compare succeeded
  console.log("[LOGIN] Password match:", isMatch);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  const token = generateToken(user._id, user.role);

  return sendSuccess(res, 200, "Login successful", {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  let profile = null;
  if (user.role === "student") {
    profile = await Student.findOne({ userId: user._id }).populate(
      "courseId",
      "name duration fees"
    );
  } else {
    profile = await Trainer.findOne({ userId: user._id }).populate(
      "courseIds",
      "name"
    );
  }

  return sendSuccess(res, 200, "Current user fetched successfully", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    profile,
  });
});

module.exports = { register, login, getMe };