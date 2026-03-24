import express      from "express";
import dotenv       from "dotenv";
import path         from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet       from "helmet";
import cors         from "cors";

import connectDB         from "./config/db.js";
import authRoutes        from "./routes/auth.routes.js";
import restaurantRoutes  from "./routes/restaurant.routes.js";
import userRoutes        from "./routes/user.routes.js";
import adminRoutes       from "./routes/admin.routes.js";
import bookingRoutes     from "./routes/Booking.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

connectDB();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(helmet({ contentSecurityPolicy: false }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/user",        userRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/bookings",    bookingRoutes);

// ── Global Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});