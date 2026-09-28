const mongoose = require("mongoose");

/**
 * Serverless-safe MongoDB connection.
 *
 * FIXED: on Vercel the old code started connecting at cold start but never
 * waited for it, so requests that arrived first sat in Mongoose's buffer for
 * 10s and then failed (500 "buffering timed out" / frontend "timeout of
 * 15000ms exceeded"). Now the connection promise is cached and every request
 * awaits it (see the middleware in server.js). A failed attempt is NOT cached,
 * so the next request retries, and it never calls process.exit().
 */
let connectionPromise = null;

const connectDB = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000, // fail fast with a clear error instead of hanging
      maxPoolSize: 5,
    })
    .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    })
    .catch((error) => {
      connectionPromise = null; // allow retry on next request
      console.error(`MongoDB Connection Error: ${error.message}`);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;