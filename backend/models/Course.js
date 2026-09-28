const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    roadmap: {
      type: String, // could be a longer text/markdown outline
    },
    duration: {
      type: String, // e.g. "6 Months"
      required: true,
    },
    fees: {
      type: Number,
      required: [true, "Course fees is required"],
      min: 0,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
    },
    image: {
      type: String, // URL / path to image (or data URI on serverless hosts)
    },
    // ADDED: on read-only hosts (Vercel) the uploaded image bytes are kept here.
    // select:false keeps them out of list/detail responses (they made the
    // response huge -> 500/timeouts); they are served by GET /api/courses/:id/image.
    imageBuffer: { type: Buffer, select: false },
    imageType: { type: String, select: false },
    // FIXED: `code` was sent by the controller/frontend but missing here, so
    // Mongoose (strict mode) silently dropped it.
    code: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
    // FIXED: frontend reads `course.id` (CourseCard link, CourseDetails match,
    // MyCourse, materials fetch) but Mongo only returns `_id`. Expose `id` too.
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.imageBuffer;
        delete ret.imageType;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

courseSchema.index({ status: 1 });
courseSchema.index({ trainerId: 1 });

module.exports = mongoose.model("Course", courseSchema);