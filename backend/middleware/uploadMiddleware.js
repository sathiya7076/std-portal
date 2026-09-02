const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../utils/ApiError");

const MATERIAL_ALLOWED_MIME = new Set([
  "application/pdf",
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-matroska", // .mkv
  "video/webm",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const SUBMISSION_ALLOWED_MIME = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
  "video/mp4",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_MATERIAL_FILE_SIZE =
  parseInt(process.env.MAX_MATERIAL_FILE_SIZE, 10) || 100 * 1024 * 1024; // 100MB
const MAX_SUBMISSION_FILE_SIZE =
  parseInt(process.env.MAX_SUBMISSION_FILE_SIZE, 10) || 50 * 1024 * 1024; // 50MB

const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const buildStorage = (subfolder) => {
  const destDir = path.join(__dirname, "..", "uploads", subfolder);
  ensureDirExists(destDir);

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
};

const materialFileFilter = (req, file, cb) => {
  // TEMP DEBUG LOGGING — remove once the 400 is resolved.
  console.log(
    "[materialFileFilter] fieldname:", file.fieldname,
    "| originalname:", file.originalname,
    "| mimetype:", file.mimetype
  );

  const ext = path.extname(file.originalname).toLowerCase();
  const isKnownMime = MATERIAL_ALLOWED_MIME.has(file.mimetype);
  const isOctetStreamPdf =
    file.mimetype === "application/octet-stream" && ext === ".pdf";

  if (!isKnownMime && !isOctetStreamPdf) {
    console.log(
      "[materialFileFilter] REJECTED — mimetype not in allowed set:",
      file.mimetype
    );
    return cb(
      new ApiError(
        400,
        "Only PDF, image, and video files are allowed for materials"
      ),
      false
    );
  }
  cb(null, true);
};

const submissionFileFilter = (req, file, cb) => {
  if (!SUBMISSION_ALLOWED_MIME.has(file.mimetype)) {
    return cb(
      new ApiError(400, "This file type is not allowed for submissions"),
      false
    );
  }
  cb(null, true);
};

const uploadMaterial = multer({
  storage: buildStorage("materials"),
  fileFilter: materialFileFilter,
  limits: { fileSize: MAX_MATERIAL_FILE_SIZE },
});

const uploadSubmission = multer({
  storage: buildStorage("submissions"),
  fileFilter: submissionFileFilter,
  limits: { fileSize: MAX_SUBMISSION_FILE_SIZE },
});

module.exports = { uploadMaterial, uploadSubmission };