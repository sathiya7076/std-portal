const asyncHandler = require("express-async-handler");
const Course = require("../models/Course");
const Trainer = require("../models/Trainer");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/paginate");
const { createBulkNotifications } = require("../services/notificationService");

// FIXED: turns the multer file into what is saved on the course.
// Disk upload (local)      -> image = "/uploads/courses/<file>"
// Memory upload (Vercel)   -> bytes go to imageBuffer, image URL is set after
//                             the course id exists (see applyUploadedImage).
const applyUploadedImage = (course, file) => {
  if (!file) return;
  if (file.buffer) {
    course.imageBuffer = file.buffer;
    course.imageType = file.mimetype;
    course.image = `/api/courses/${course._id}/image`;
  } else {
    course.image = `/uploads/courses/${file.filename}`;
  }
};

// @desc    Serve a course image stored in the database
// @route   GET /api/courses/:id/image
// @access  Public (an <img> tag cannot send the Bearer token)
const getCourseImage = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).select("+imageBuffer +imageType");
  if (!course || !course.imageBuffer) {
    throw new ApiError(404, "Image not found");
  }
  res.set("Content-Type", course.imageType || "image/jpeg");
  res.set("Cache-Control", "public, max-age=3600");
  return res.send(course.imageBuffer);
});

// @desc    Get all courses (visible to both roles)
// @route   GET /api/courses
// @access  Private
const getCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

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
  // ADDED: code
  const { name, description, technologies, roadmap, duration, fees, image, code } =
    req.body;

  if (!name || !duration || fees === undefined) {
    throw new ApiError(400, "Name, duration, and fees are required");
  }

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer) {
    throw new ApiError(404, "Trainer profile not found for this account");
  }

  // ADDED: image upload via multer's upload.single("image") -> req.file
  const course = new Course({
    name,
    description,
    technologies,
    roadmap,
    duration,
    fees,
    image, // only used when no file was uploaded
    code, // ADDED
    trainerId: trainer._id,
    status: "active",
  });
  applyUploadedImage(course, req.file);
  await course.save();

  trainer.courseIds.push(course._id);
  await trainer.save();

  const students = await Student.find().populate("userId", "_id");
  // FIXED: skip students whose user record is missing (populate -> null),
  // otherwise `s.userId._id` throws AFTER the course is saved and the trainer
  // sees a 500 error even though the course was created.
  const studentUserIds = students
    .filter((s) => s.userId && s.userId._id)
    .map((s) => s.userId._id);

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
    "code", // ADDED
    "status",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });

  // ADDED: image upload via multer's upload.single("image") -> req.file
  applyUploadedImage(course, req.file);

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
  getCourseImage,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};