const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Biometric simulation model.
 * IMPORTANT: We never store raw fingerprint images/templates.
 * Only a safe, opaque registration reference + status is stored,
 * so real biometric hardware/SDKs can be wired in later without
 * changing the schema shape consumed by the frontend.
 */
const fingerprintRegistrationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },
    registrationId: {
      type: String,
      required: true,
      unique: true,
      default: () => `FP-${crypto.randomBytes(8).toString("hex")}`,
    },
    status: {
      type: String,
      enum: ["pending", "registered", "failed", "revoked"],
      default: "pending",
    },
    registeredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "FingerprintRegistration",
  fingerprintRegistrationSchema
);
