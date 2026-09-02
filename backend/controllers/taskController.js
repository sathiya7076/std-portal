const asyncHandler = require("express-async-handler");
const Task = require("../models/Task");
const Trainer = require("../models/Trainer");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/paginate");
const { createBulkNotifications } = require("../services/notificationService");

// @desc    Get tasks (trainer: own created tasks; student: assigned tasks)
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role === "trainer") {
    const trainer = await Trainer.findOne({ userId: req.user._id });
    if (!trainer) throw new ApiError(404, "Trainer profile not found");
    filter.createdBy = trainer._id;
  } else {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found");
    filter.assignedTo = student._id;
  }

  if (req.query.courseId) filter.courseId = req.query.courseId;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate("courseId", "name")
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return sendSuccess(
    res,
    200,
    "Tasks fetched successfully",
    tasks,
    buildMeta(total, page, limit)
  );
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("courseId", "name")
    .populate("assignedTo", "studentId");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user._id });
    const isAssigned = task.assignedTo.some(
      (s) => s._id.toString() === student._id.toString()
    );
    if (!isAssigned) {
      throw new ApiError(403, "This task is not assigned to you");
    }
  }

  return sendSuccess(res, 200, "Task fetched successfully", task);
});

// @desc    Create + assign a task
// @route   POST /api/tasks
// @access  Private (trainer only)
const createTask = asyncHandler(async (req, res) => {
  const { title, description, courseId, assignedTo, dueDate, maxScore } =
    req.body;

  if (!title || !courseId || !dueDate) {
    throw new ApiError(400, "title, courseId, and dueDate are required");
  }

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer) throw new ApiError(404, "Trainer profile not found");

  // If assignedTo is not provided, assign to all students in the course
  let assignedStudentIds = assignedTo;
  if (!assignedStudentIds || assignedStudentIds.length === 0) {
    const studentsInCourse = await Student.find({ courseId });
    assignedStudentIds = studentsInCourse.map((s) => s._id);
  }

  const task = await Task.create({
    title,
    description,
    courseId,
    assignedTo: assignedStudentIds,
    createdBy: trainer._id,
    dueDate,
    maxScore,
  });

  const assignedStudents = await Student.find({
    _id: { $in: assignedStudentIds },
  }).populate("userId", "_id");
  const userIds = assignedStudents.map((s) => s.userId._id);

  await createBulkNotifications({
    userIds,
    type: "task",
    title: "New Task Assigned",
    message: `A new task "${task.title}" has been assigned to you.`,
    relatedId: task._id,
  });

  return sendSuccess(res, 201, "Task created successfully", task);
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (trainer only - must own the task)
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer || task.createdBy.toString() !== trainer._id.toString()) {
    throw new ApiError(403, "You can only update your own tasks");
  }

  const updatableFields = [
    "title",
    "description",
    "dueDate",
    "maxScore",
    "assignedTo",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();

  return sendSuccess(res, 200, "Task updated successfully", task);
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (trainer only - must own the task)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer || task.createdBy.toString() !== trainer._id.toString()) {
    throw new ApiError(403, "You can only delete your own tasks");
  }

  await Task.deleteOne({ _id: task._id });

  return sendSuccess(res, 200, "Task deleted successfully", {});
});

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
