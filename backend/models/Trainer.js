const mongoose = require("mongoose");

const trainerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    trainerId: {
      type: String,
      required: [true, "Trainer ID is required"],
      unique: true,
      trim: true,
    },
    experience: {
      type: Number, // years of experience
      default: 0,
    },
    specialization: {
      type: String,
      trim: true,
    },
    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    phone: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// trainerId already has a unique index via `unique: true` above.

module.exports = mongoose.model("Trainer", trainerSchema);
