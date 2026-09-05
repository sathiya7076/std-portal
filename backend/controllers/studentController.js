const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Student = require("../models/Student");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/paginate");
const { getStudentAttendanceSummary } = require("../services/attendanceService");

const generateShortId = (prefix) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}`;

/**
 * Resolves the Student document owned by the currently authenticated
 * student user. Throws 404 if no profile exists yet.
 */
const getOwnStudentProfile = async (userId) => {
  const student = await Student.findOne({ userId });
  if (!student) throw new ApiError(404, "Student profile not found");
  return student;
};

// @desc    Get all students (with pagination + optional course filter)
// @route   GET /api/students
// @access  Private (trainer only)
const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.courseId) filter.courseId = req.query.courseId;

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate("userId", "name email isActive")
      .populate("courseId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(filter),
  ]);

  return sendSuccess(
    res,
    200,
    "Students fetched successfully",
    students,
    buildMeta(total, page, limit)
  );
});

// @desc    Get single student by id
// @route   GET /api/students/:id
// @access  Private (trainer, or the student themself)
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate("userId", "name email isActive")
    .populate("courseId", "name duration fees");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Students may only view their own record
  if (
    req.user.role === "student" &&
    student.userId._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "You can only access your own profile");
  }

  return sendSuccess(res, 200, "Student fetched successfully", student);
});

// @desc    Create a new student (creates linked User + Student profile)
// @route   POST /api/students
// @access  Private (trainer only)
const createStudent = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, courseId } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const user = await User.create({ name, email, password, role: "student" });

  const student = await Student.create({
    userId: user._id,
    studentId: generateShortId("STU"),
    courseId: courseId || undefined,
    phone,
    address,
  });

  return sendSuccess(res, 201, "Student created successfully", student);
});

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private (trainer only)
const updateStudent = asyncHandler(async (req, res) => {
  const { phone, address, courseId, learningProgress } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (phone !== undefined) student.phone = phone;
  if (address !== undefined) student.address = address;
  if (courseId !== undefined) student.courseId = courseId;
  if (learningProgress !== undefined)
    student.learningProgress = learningProgress;

  await student.save();

  return sendSuccess(res, 200, "Student updated successfully", student);
});

// @desc    Delete a student (removes Student profile + linked User)
// @route   DELETE /api/students/:id
// @access  Private (trainer only)
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  await Student.deleteOne({ _id: student._id });
  await User.deleteOne({ _id: student.userId });

  return sendSuccess(res, 200, "Student deleted successfully", {});
});

// @desc    Get a student's learning progress + attendance summary
// @route   GET /api/students/:id/progress
// @access  Private (trainer, or the student themself)
const getStudentProgress = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (
    req.user.role === "student" &&
    student.userId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "You can only access your own progress");
  }

  const attendanceSummary = await getStudentAttendanceSummary(student._id);

  return sendSuccess(res, 200, "Student progress fetched successfully", {
    learningProgress: student.learningProgress,
    attendance: attendanceSummary,
  });
});

// @desc    Get own student profile
// @route   GET /api/student/profile
// @access  Private (student only)
const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id })
    .populate("userId", "name email")
    .populate("courseId", "name");

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return sendSuccess(res, 200, "Student profile fetched successfully", {
    name: student.userId.name,
    studentId: student.studentId,
    course: student.courseId,
    email: student.userId.email,
    phone: student.phone,
    address: student.address,
    learningProgress: student.learningProgress,
  });
});

// @desc    Get own learning progress + attendance summary
// @route   GET /api/student/progress
// @access  Private (student only)
const getMyProgress = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  const attendanceSummary = await getStudentAttendanceSummary(student._id);

  return sendSuccess(res, 200, "Student progress fetched successfully", {
    learningProgress: student.learningProgress,
    attendance: attendanceSummary,
  });
});

// @desc    Update own student profile
// @route   PUT /api/student/profile
// @access  Private (student only)
const updateMyProfile = asyncHandler(async (req, res) => {
  const { phone, address } = req.body;

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  if (phone !== undefined) student.phone = phone;
  if (address !== undefined) student.address = address;

  await student.save();

  return sendSuccess(res, 200, "Student profile updated successfully", student);
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProgress,
  getOwnStudentProfile,
  getMyProfile,
  getMyProgress,
  updateMyProfile,
  generateShortId,
};