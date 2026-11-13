const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: ["student", "trainer", "admin"], // ADDED: "admin"
      required: [true, "Role is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ---------------- ADDED: admin details ----------------
    phone: { type: String, trim: true },
    designation: { type: String, trim: true }, // e.g. "Super Admin"
    department: { type: String, trim: true }, // e.g. "Administration"

    // ---------------- ADDED: trainer approval workflow ----------------
    // student / admin => "approved" automatically
    // trainer         => "pending" until an admin approves
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// Note: no separate schema.index({ email: 1 }) needed — `unique: true`
// on the field above already creates that index.

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure password never leaks even if select('+password') was used upstream
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);