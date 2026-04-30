import mongoose from "mongoose";

const IS_PROD = process.env.NODE_ENV === "production";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // ── Connection Pool ────────────────────────────────────────
      maxPoolSize: 10,                  // max concurrent connections
      minPoolSize: 2,                   // keep 2 warm connections
      // ── Timeouts ───────────────────────────────────────────────
      serverSelectionTimeoutMS: 5000,   // fail fast if no server
      socketTimeoutMS: 45000,           // close idle sockets after 45s
      // ── Performance ────────────────────────────────────────────
      autoIndex: !IS_PROD,              // don't auto-create indexes in prod
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
