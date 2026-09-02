const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const Trainer = require("../models/Trainer");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Task = require("../models/Task");
const TaskSubmission = require("../models/TaskSubmission");
const Material = require("../models/Material");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getStudentAttendanceSummary } = require("../services/attendanceService");
const { getStudentFeeSummary } = require("../services/feeService");

// @desc    Trainer dashboard summary
// @route   GET /api/trainer/dashboard
// @access  Private (trainer only)
const getTrainerDashboard = asyncHandler(async (req, res) => {
  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer) throw new ApiError(404, "Trainer profile not found");

  const courseIds = trainer.courseIds;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalStudents,
    totalCourses,
    todayAttendance,
    trainerTasks,
    totalMaterials,
  ] = await Promise.all([
    Student.countDocuments({ courseId: { $in: courseIds } }),
    Course.countDocuments({ trainerId: trainer._id }),
    Attendance.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
      status: "present",
      studentId: {
        $in: await Student.find({ courseId: { $in: courseIds } }).distinct(
          "_id"
        ),
      },
    }),
    Task.find({ createdBy: trainer._id }).select("_id"),
    Material.countDocuments({ uploadedBy: trainer._id }),
  ]);

  const taskIds = trainerTasks.map((t) => t._id);
  const [pendingTasks, submittedTasks] = await Promise.all([
    TaskSubmission.countDocuments({
      taskId: { $in: taskIds },
      status: { $in: ["pending"] },
    }),
    TaskSubmission.countDocuments({
      taskId: { $in: taskIds },
      status: { $in: ["submitted", "evaluated", "completed"] },
    }),
  ]);

  return sendSuccess(res, 200, "Trainer dashboard fetched successfully", {
    totalStudents,
    totalCourses,
    todayAttendance,
    pendingTasks,
    submittedTasks,
    totalMaterials,
  });
});

// @desc    Student dashboard summary
// @route   GET /api/student/dashboard
// @access  Private (student only)
const getStudentDashboard = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, "Student profile not found");

  const [attendanceSummary, feeSummary, tasks, unreadNotifications] =
    await Promise.all([
      getStudentAttendanceSummary(student._id),
      getStudentFeeSummary(student._id),
      Task.find({ assignedTo: student._id }).select("_id"),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

  const taskIds = tasks.map((t) => t._id);
  const submissions = await TaskSubmission.find({
    taskId: { $in: taskIds },
    studentId: student._id,
  });
  const submissionByTask = new Map(
    submissions.map((s) => [s.taskId.toString(), s])
  );

  let completedTasks = 0;
  let pendingTasks = 0;
  for (const taskId of taskIds) {
    const submission = submissionByTask.get(taskId.toString());
    if (
      submission &&
      ["submitted", "evaluated", "completed"].includes(submission.status)
    ) {
      completedTasks += 1;
    } else {
      pendingTasks += 1;
    }
  }

  return sendSuccess(res, 200, "Student dashboard fetched successfully", {
    attendance: attendanceSummary.attendancePercentage,
    learningProgress: student.learningProgress,
    pendingTasks,
    completedTasks,
    pendingFees: feeSummary.pendingAmount,
    unreadNotifications,
  });
});

module.exports = { getTrainerDashboard, getStudentDashboard };
