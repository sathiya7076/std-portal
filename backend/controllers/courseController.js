const asyncHandler = require("express-async-handler");
const Course = require("../models/Course");
const Trainer = require("../models/Trainer");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/paginate");
const { createBulkNotifications } = require("../services/notificationService");

// @desc    Get all courses (visible to both roles)
// @route   GET /api/courses
// @access  Private
const getCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  // Students only ever see active courses in the general listing
  if (req.user.role === "student") {
    filter.status = "active";
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("trainerId", "trainerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments(filter),
  ]);

  return sendSuccess(
    res,
    200,
    "Courses fetched successfully",
    courses,
    buildMeta(total, page, limit)
  );
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate(
    "trainerId",
    "trainerId specialization"
  );

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return sendSuccess(res, 200, "Course fetched successfully", course);
});

// @desc    Create a course
// @route   POST /api/courses
// @access  Private (trainer only)
const createCourse = asyncHandler(async (req, res) => {
  const { name, description, technologies, roadmap, duration, fees, image } =
    req.body;

  if (!name || !duration || fees === undefined) {
    throw new ApiError(400, "Name, duration, and fees are required");
  }

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer) {
    throw new ApiError(404, "Trainer profile not found for this account");
  }

  const course = await Course.create({
    name,
    description,
    technologies,
    roadmap,
    duration,
    fees,
    image,
    trainerId: trainer._id,
    status: "active",
  });

  trainer.courseIds.push(course._id);
  await trainer.save();

  // Course becomes available to students -> notify all students
  const students = await Student.find().populate("userId", "_id");
  const studentUserIds = students.map((s) => s.userId._id);

  await createBulkNotifications({
    userIds: studentUserIds,
    type: "course",
    title: "New Course Added",
    message: `A new course "${course.name}" is now available.`,
    relatedId: course._id,
  });

  return sendSuccess(res, 201, "Course created successfully", course);
});

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (trainer only - must own the course)
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer || course.trainerId.toString() !== trainer._id.toString()) {
    throw new ApiError(403, "You can only update your own courses");
  }

  const updatableFields = [
    "name",
    "description",
    "technologies",
    "roadmap",
    "duration",
    "fees",
    "image",
    "status",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });

  await course.save();

  return sendSuccess(res, 200, "Course updated successfully", course);
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (trainer only - must own the course)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer || course.trainerId.toString() !== trainer._id.toString()) {
    throw new ApiError(403, "You can only delete your own courses");
  }

  await Course.deleteOne({ _id: course._id });
  trainer.courseIds = trainer.courseIds.filter(
    (id) => id.toString() !== course._id.toString()
  );
  await trainer.save();

  return sendSuccess(res, 200, "Course deleted successfully", {});
});

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
