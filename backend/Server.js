import express      from "express";
import dotenv       from "dotenv";
import path         from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet       from "helmet";
import cors         from "cors";
import http         from "http";
import { initSocket } from "./socket.js";

import connectDB         from "./config/db.js";
import authRoutes        from "./routes/auth.routes.js";
import restaurantRoutes  from "./routes/restaurant.routes.js";
import userRoutes        from "./routes/user.routes.js";
import adminRoutes       from "./routes/admin.routes.js";
import bookingRoutes     from "./routes/Booking.routes.js";
import stripeRoutes      from "./routes/stripe.Routes.js";
import reviewRoutes      from "./routes/review.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

connectDB();

const app = express();

// ⚠️ Stripe webhook — raw body PEHLE aana chahiye, express.json() se pehle
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeRoutes
);

// Normal middleware
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
app.use("/api/payments",    stripeRoutes);   // Stripe payment routes
app.use("/api/reviews",     reviewRoutes);   // Review routes

// ── Global Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  res.status(500).json({ message: err.message });
});


const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});