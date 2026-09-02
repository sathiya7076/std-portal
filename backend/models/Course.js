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
      type: String, // URL / path to image
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

courseSchema.index({ status: 1 });
courseSchema.index({ trainerId: 1 });

module.exports = mongoose.model("Course", courseSchema);
