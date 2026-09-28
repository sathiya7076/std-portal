const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    type: {
      type: String,
      enum: ["PDF", "VIDEO", "IMAGE"],
      required: true,
    },
    fileUrl: {
      type: String,
      // set right after create when the file is stored in the database
    },
    // ADDED: file bytes for read-only hosts (Vercel). select:false keeps them out
    // of list responses; served by GET /api/materials/:id/file.
    fileBuffer: { type: Buffer, select: false },
    fileType: { type: String, select: false },
    fileName: { type: String },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },
    uploadedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.fileBuffer;
        delete ret.fileType;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Material", materialSchema);