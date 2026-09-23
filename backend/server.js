require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const { notFound } = require("./middleware/notFoundMiddleware");
const { errorHandler } = require("./middleware/errorMiddleware");

// Route imports
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const studentSelfRoutes = require("./routes/studentSelfRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const courseRoutes = require("./routes/courseRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const fingerprintRoutes = require("./routes/fingerprintRoutes");
const taskRoutes = require("./routes/taskRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const materialRoutes = require("./routes/materialRoutes");
const feeRoutes = require("./routes/feeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// IMPORTANT: connectDB() now rejects instead of calling process.exit() on
// failure (see config/db.js). A bare `connectDB();` here would leave that
// rejection unhandled — and on Node 15+, an unhandled promise rejection
// crashes the whole process by default, producing the exact same
// "Node.js process exited with exit status: 1" symptom we were trying to
// eliminate. The .catch() below is what actually prevents that.
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB on startup:", err.message);
});

const app = express();

// --- CORS ---
// Production origins come from CLIENT_URL (comma-separated list, e.g.
// "https://std-portal.vercel.app,https://myapp.com"). Localhost on any
// port is ALWAYS allowed, regardless of what CLIENT_URL is set to, so
// local dev (Vite on :5173, etc.) can hit this deployed backend without
// needing localhost added to a Vercel env var. Auth uses a Bearer token
// (see authMiddleware.js), not cookies, so credentials: true isn't needed.
const configuredOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const isLocalhost = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl/Postman/server-to-server
      if (isLocalhost(origin)) return callback(null, true);
      if (configuredOrigins.length === 0) return callback(null, true);
      if (configuredOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Static file serving for uploaded materials/submissions
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is healthy" });
});

// Mounted routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/student", studentSelfRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fingerprint", fingerprintRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 + centralized error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
    );
  });
}

module.exports = app;