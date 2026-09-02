const mongoose = require("mongoose");
const crypto = require("crypto");

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    feeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "other"],
      default: "other",
    },
    transactionRef: {
      type: String,
      default: () => `TXN-${crypto.randomBytes(6).toString("hex")}`,
      unique: true,
    },
    receiptNumber: {
      type: String,
      default: () => `RCPT-${crypto.randomBytes(6).toString("hex")}`,
      unique: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ studentId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
