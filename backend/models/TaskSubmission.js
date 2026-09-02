const mongoose = require("mongoose");

const taskSubmissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    file: {
      type: String, // stored file path/URL
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    score: {
      type: Number,
      min: 0,
    },
    feedback: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "evaluated", "completed"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
    },
    evaluatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// A student can only have one submission record per task
taskSubmissionSchema.index({ taskId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("TaskSubmission", taskSubmissionSchema);
