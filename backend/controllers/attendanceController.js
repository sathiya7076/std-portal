const asyncHandler = require("express-async-handler");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/paginate");
const { getStudentAttendanceSummary } = require("../services/attendanceService");
const { createNotification } = require("../services/notificationService");

// @desc    Mark attendance for a student
// @route   POST /api/attendance
// @access  Private (trainer only)
const markAttendance = asyncHandler(async (req, res) => {
  const { studentId, date, status, checkInTime } = req.body;

  if (!studentId || !date || !status) {
    throw new ApiError(400, "studentId, date, and status are required");
  }

  const student = await Student.findById(studentId).populate("userId", "_id");
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  let attendance;
  try {
    attendance = await Attendance.create({
      studentId,
      date,
      status,
      checkInTime,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "Attendance already recorded for this student on this date"
      );
    }
    throw error;
  }

  // Automatic notifications
  if (status === "present") {
    await createNotification({
      userId: student.userId._id,
      type: "attendance",
      title: "Attendance Marked Present",
      message: `Your attendance was marked present on ${new Date(
        date
      ).toDateString()}.`,
      relatedId: attendance._id,
    });
  } else if (status === "absent") {
    await createNotification({
      userId: student.userId._id,
      type: "attendance",
      title: "Attendance Marked Absent",
      message: `Your attendance was marked absent on ${new Date(
        date
      ).toDateString()}.`,
      relatedId: attendance._id,
    });
  } else if (status === "late") {
    await createNotification({
      userId: student.userId._id,
      type: "late",
      title: "Late Arrival",
      message: `You were marked late on ${new Date(date).toDateString()}.`,
      relatedId: attendance._id,
    });
  }

  return sendSuccess(res, 201, "Attendance marked successfully", attendance);
});

// @desc    Student self check-in for today's attendance
// @route   POST /api/attendance/checkin
// @access  Private (student only)
const markMyAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  const now = new Date();

  let attendance;
  try {
    attendance = await Attendance.create({
      studentId: student._id,
      date: now,
      status: "present",
      checkInTime: now,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Attendance already recorded for today");
    }
    throw error;
  }

  await createNotification({
    userId: req.user._id,
    type: "attendance",
    title: "Attendance Marked Present",
    message: `Your attendance was marked present on ${now.toDateString()}.`,
    relatedId: attendance._id,
  });

  return sendSuccess(res, 201, "Attendance marked successfully", attendance);
});

// @desc    Get attendance records (filterable by student/date range)
// @route   GET /api/attendance
// @access  Private (trainer sees all, student sees own only)
const getAttendanceRecords = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found");
    filter.studentId = student._id;
  } else if (req.query.studentId) {
    filter.studentId = req.query.studentId;
  }

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate("studentId", "studentId")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter),
  ]);

  return sendSuccess(
    res,
    200,
    "Attendance records fetched successfully",
    records,
    buildMeta(total, page, limit)
  );
});

// @desc    Get attendance summary for a student
// @route   GET /api/attendance/summary/:studentId
// @access  Private (trainer, or the student themself)
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || student._id.toString() !== studentId) {
      throw new ApiError(403, "You can only access your own attendance");
    }
  }

  const summary = await getStudentAttendanceSummary(studentId);

  return sendSuccess(
    res,
    200,
    "Attendance summary fetched successfully",
    summary
  );
});

// @desc    Get own attendance summary — no :studentId param needed
// @route   GET /api/attendance/me
// @access  Private (student only)
const getMyAttendanceSummary = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  const summary = await getStudentAttendanceSummary(student._id);

  return sendSuccess(
    res,
    200,
    "Attendance summary fetched successfully",
    summary
  );
});

module.exports = {
  markAttendance,
  markMyAttendance,
  getAttendanceRecords,
  getAttendanceSummary,
  getMyAttendanceSummary,
};