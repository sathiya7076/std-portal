const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Material = require("../models/Material");
const Trainer = require("../models/Trainer");
const Student = require("../models/Student");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/paginate");
const { createBulkNotifications } = require("../services/notificationService");

// Deletes a just-uploaded file from disk. Used to clean up orphaned
// uploads when validation fails AFTER multer has already saved the file.
const cleanupUploadedFile = (file) => {
  // FIXED: memory uploads (Vercel) have no file.path; fs.unlink(undefined) throws.
  if (!file || !file.path) return;
  fs.unlink(file.path, () => {}); // best-effort, ignore errors
};

// Only files saved on disk (/uploads/...) can be unlinked; DB-stored files can't.
const removeDiskFile = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;
  fs.unlink(path.join(__dirname, "..", fileUrl), () => {});
};

// @desc    Stream a material stored in the database
// @route   GET /api/materials/:id/file
// @access  Public (opened via window.open / <a>, which can't send the Bearer token)
const getMaterialFile = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid material id");
  }
  const material = await Material.findById(req.params.id).select("+fileBuffer +fileType");
  if (!material || !material.fileBuffer) {
    throw new ApiError(404, "File not found");
  }
  res.set("Content-Type", material.fileType || "application/octet-stream");
  res.set(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(material.fileName || "material")}"`
  );
  res.set("Cache-Control", "private, max-age=3600");
  return res.send(material.fileBuffer);
});

// @desc    Get materials (optionally filtered by course)
// @route   GET /api/materials
// @access  Private
const getMaterials = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.courseId) filter.courseId = req.query.courseId;

  if (req.user.role === "student" && !req.query.courseId) {
    const student = await Student.findOne({ userId: req.user._id });
    if (student && student.courseId) {
      filter.courseId = student.courseId;
    }
  }

  const [materials, total] = await Promise.all([
    Material.find(filter)
      .populate("courseId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Material.countDocuments(filter),
  ]);

  return sendSuccess(
    res,
    200,
    "Materials fetched successfully",
    materials,
    buildMeta(total, page, limit)
  );
});

// @desc    Get single material
// @route   GET /api/materials/:id
// @access  Private
const getMaterialById = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).populate(
    "courseId",
    "name"
  );

  if (!material) {
    throw new ApiError(404, "Material not found");
  }

  return sendSuccess(res, 200, "Material fetched successfully", material);
});

// @desc    Upload a new material
// @route   POST /api/materials
// @access  Private (trainer only)
const createMaterial = asyncHandler(async (req, res) => {
  const { title, description, courseId, type } = req.body;

  // Validate required fields — clean up the uploaded file if any check fails,
  // since multer already wrote it to disk before this code runs.
  if (!title || !courseId || !type) {
    cleanupUploadedFile(req.file);
    throw new ApiError(400, "title, courseId, and type are required");
  }

  // FIXED: the model and the upload form both support IMAGE, but the controller
  // rejected it with a 400.
  if (!["PDF", "VIDEO", "IMAGE"].includes(type)) {
    cleanupUploadedFile(req.file);
    throw new ApiError(400, "type must be 'PDF', 'VIDEO' or 'IMAGE'");
  }

  if (!req.file) {
    throw new ApiError(400, "A file is required");
  }

  if (!mongoose.isValidObjectId(courseId)) {
    cleanupUploadedFile(req.file);
    throw new ApiError(400, "Invalid courseId");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    cleanupUploadedFile(req.file);
    throw new ApiError(404, "Course not found");
  }

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer) {
    cleanupUploadedFile(req.file);
    throw new ApiError(404, "Trainer profile not found");
  }

  const material = new Material({
    title,
    description,
    courseId,
    type,
    fileName: req.file.originalname,
    uploadedBy: trainer._id,
  });
  if (req.file.buffer) {
    // read-only host (Vercel): keep the bytes in MongoDB
    material.fileBuffer = req.file.buffer;
    material.fileType = req.file.mimetype;
    material.fileUrl = `/api/materials/${material._id}/file`;
  } else {
    material.fileUrl = `/uploads/materials/${req.file.filename}`;
  }
  await material.save();

  // Notify enrolled students — best-effort, and skip any student record
  // whose linked user account no longer exists (e.g. deleted user) so
  // one bad record doesn't fail the whole upload response.
  try {
    const studentsInCourse = await Student.find({ courseId }).populate(
      "userId",
      "_id"
    );
    const userIds = studentsInCourse
      .filter((s) => s.userId)
      .map((s) => s.userId._id);

    if (userIds.length > 0) {
      await createBulkNotifications({
        userIds,
        type: "material",
        title: "New Study Material Added",
        message: `New material "${material.title}" was added to your course.`,
        relatedId: material._id,
      });
    }
  } catch (notifyErr) {
    // Material was already created successfully — don't fail the whole
    // request just because notifications had a problem.
    console.error("Failed to send material notifications:", notifyErr);
  }

  return sendSuccess(res, 201, "Material uploaded successfully", material);
});

// @desc    Update material metadata (and optionally replace file)
// @route   PUT /api/materials/:id
// @access  Private (trainer only - must own it)
const updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    cleanupUploadedFile(req.file);
    throw new ApiError(404, "Material not found");
  }

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer || material.uploadedBy.toString() !== trainer._id.toString()) {
    cleanupUploadedFile(req.file);
    throw new ApiError(403, "You can only update your own materials");
  }

  const { title, description, type } = req.body;
  if (title !== undefined) material.title = title;
  if (description !== undefined) material.description = description;
  if (type !== undefined) {
    if (!["PDF", "VIDEO", "IMAGE"].includes(type)) {
      cleanupUploadedFile(req.file);
      throw new ApiError(400, "type must be 'PDF', 'VIDEO' or 'IMAGE'");
    }
    material.type = type;
  }

  if (req.file) {
    removeDiskFile(material.fileUrl);
    material.fileName = req.file.originalname;
    if (req.file.buffer) {
      material.fileBuffer = req.file.buffer;
      material.fileType = req.file.mimetype;
      material.fileUrl = `/api/materials/${material._id}/file`;
    } else {
      material.fileUrl = `/uploads/materials/${req.file.filename}`;
    }
  }

  await material.save();

  return sendSuccess(res, 200, "Material updated successfully", material);
});

// @desc    Delete a material
// @route   DELETE /api/materials/:id
// @access  Private (trainer only - must own it)
const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) throw new ApiError(404, "Material not found");

  const trainer = await Trainer.findOne({ userId: req.user._id });
  if (!trainer || material.uploadedBy.toString() !== trainer._id.toString()) {
    throw new ApiError(403, "You can only delete your own materials");
  }

  removeDiskFile(material.fileUrl);

  await Material.deleteOne({ _id: material._id });

  return sendSuccess(res, 200, "Material deleted successfully", {});
});

module.exports = {
  getMaterialFile,
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
};