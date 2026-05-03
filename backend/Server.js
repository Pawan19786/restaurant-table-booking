import express      from "express";
import dotenv       from "dotenv";
import path         from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet       from "helmet";
import cors         from "cors";
import http         from "http";
import compression  from "compression";
import rateLimit    from "express-rate-limit";
import { initSocket } from "./socket.js";

import connectDB         from "./config/db.js";
import authRoutes        from "./routes/auth.routes.js";
import restaurantRoutes  from "./routes/restaurant.routes.js";
import userRoutes        from "./routes/user.routes.js";
import adminRoutes       from "./routes/admin.routes.js";
import bookingRoutes     from "./routes/Booking.routes.js";
import stripeRoutes      from "./routes/stripe.Routes.js";
import reviewRoutes      from "./routes/review.route.js";
import notificationRoutes from "./routes/notification.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const IS_PROD = process.env.NODE_ENV === "production";

connectDB();

const app = express();

// ── Performance: Compression (gzip/brotli) ──────────────────────
// Reduces JSON/text response sizes by 60-80%
app.use(compression({
  level: 6,                    // balanced speed vs compression ratio
  threshold: 1024,             // only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

// ⚠️ Stripe webhook — raw body PEHLE aana chahiye, express.json() se pehle
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeRoutes
);

// ── Normal middleware ────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));          // tightened from 10mb
app.use(express.urlencoded({ extended: false }));  // form data support
app.use(cookieParser());

// ── Security: Helmet ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,   // avoid blocking Cloudinary images
}));

// ── Security: Rate Limiting ──────────────────────────────────────
// General API rate limit — 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Strict auth rate limit — 10 requests per minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again later." },
});

app.use("/api", apiLimiter);

// ── Request Logger (dev only) ────────────────────────────────────
// console.log is synchronous I/O — skip in production for performance
if (!IS_PROD) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// ── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));

// ── Routes ──────────────────────────────────────────────────────
app.use("/api/auth",        authLimiter, authRoutes);
app.use("/api/user",        userRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/bookings",    bookingRoutes);
app.use("/api/payments",    stripeRoutes);
app.use("/api/reviews",     reviewRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  res.status(500).json({ message: IS_PROD ? "Internal server error" : err.message });
});


const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});