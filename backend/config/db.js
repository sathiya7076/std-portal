const mongoose = require("mongoose");

/**
 * Establishes connection to MongoDB using the URI from environment variables.
 * On serverless (Vercel), a single failed connection must never call
 * process.exit() — that kills the whole function instance and takes down
 * every route, not just DB-dependent ones. Instead we log and rethrow, so
 * whichever request triggered this cold start gets a proper 500 JSON
 * response via errorHandler, and the next cold start gets a fresh chance
 * to connect.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;