const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      // normalized to midnight in the pre-validate hook below
    },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },
    checkInTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Normalize date to midnight (UTC) so duplicate checks work per calendar day
attendanceSchema.pre("validate", function (next) {
  if (this.date) {
    const d = new Date(this.date);
    d.setUTCHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

// Prevent duplicate attendance records for same student + date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
