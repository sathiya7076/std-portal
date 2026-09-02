const asyncHandler = require("express-async-handler");
const Task = require("../models/Task");
const TaskSubmission = require("../models/TaskSubmission");
const Trainer = require("../models/Trainer");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");

// @desc    Submit a task (student)
// @route   POST /api/tasks/:taskId/submit
// @access  Private (student only)
const submitTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { githubUrl, description } = req.body;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new ApiError(404, "Student profile not found");

  const isAssigned = task.assignedTo.some(
    (id) => id.toString() === student._id.toString()
  );
  if (!isAssigned) {
    throw new ApiError(403, "This task is not assigned to you");
  }

  if (!githubUrl && !description && !req.file) {
    throw new ApiError(
      400,
      "Provide at least a file, githubUrl, or description for the submission"
    );
  }

  const filePath = req.file
    ? `/uploads/submissions/${req.file.filename}`
    : undefined;

  let submission = await TaskSubmission.findOne({
    taskId,
    studentId: student._id,
  });

  if (submission) {
    // Resubmission: update existing record, only a student's own task
    if (submission.studentId.toString() !== student._id.toString()) {
      throw new ApiError(403, "You cannot submit another student's task");
    }
    submission.githubUrl = githubUrl ?? submission.githubUrl;
    submission.description = description ?? submission.description;
    if (filePath) submission.file = filePath;
    submission.status = "submitted";
    submission.submittedAt = new Date();
    await submission.save();
  } else {
    submission = await TaskSubmission.create({
      taskId,
      studentId: student._id,
      file: filePath,
      githubUrl,
      description,
      status: "submitted",
      submittedAt: new Date(),
    });
  }

  // Notify the trainer who created the task
  const trainer = await Trainer.findById(task.createdBy).populate(
    "userId",
    "_id"
  );
  if (trainer) {
    await createNotification({
      userId: trainer.userId._id,
      type: "task",
      title: "Task Submitted",
      message: `A student submitted the task "${task.title}".`,
      relatedId: submission._id,
    });
  }

  return sendSuccess(res, 201, "Task submitted successfully", submission);
});

// @desc    Get all submissions for a task
// @route   GET /api/tasks/:taskId/submissions
// @access  Private (trainer only - must own the task)
const getSubmissionsForTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer || task.createdBy.toString() !== trainer._id.toString()) {
    throw new ApiError(403, "You can only view submissions for your own tasks");
  }

  const submissions = await TaskSubmission.find({ taskId }).populate(
    "studentId",
    "studentId"
  );

  return sendSuccess(
    res,
    200,
    "Submissions fetched successfully",
    submissions
  );
});

// @desc    Evaluate a submission
// @route   PUT /api/submissions/:submissionId/evaluate
// @access  Private (trainer only - must own the parent task)
const evaluateSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { score, feedback, status } = req.body;

  const submission = await TaskSubmission.findById(submissionId).populate(
    "studentId",
    "userId"
  );
  if (!submission) throw new ApiError(404, "Submission not found");

  const task = await Task.findById(submission.taskId);
  if (!task) throw new ApiError(404, "Parent task not found");

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer || task.createdBy.toString() !== trainer._id.toString()) {
    throw new ApiError(403, "You can only evaluate submissions for your own tasks");
  }

  if (score !== undefined) submission.score = score;
  if (feedback !== undefined) submission.feedback = feedback;
  submission.status = status || "evaluated";
  submission.evaluatedAt = new Date();

  await submission.save();

  await createNotification({
    userId: submission.studentId.userId,
    type: "task",
    title: "Task Evaluated",
    message: `Your submission for "${task.title}" has been evaluated.`,
    relatedId: submission._id,
  });

  return sendSuccess(res, 200, "Submission evaluated successfully", submission);
});

module.exports = { submitTask, getSubmissionsForTask, evaluateSubmission };
