import express from "express";
import {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getOwnerBookingCount,
  updateBookingStatus,
  cancelBooking,
  getAvailableSlots,
  getAllBookings,
} from "../controllers/Booking.Controller.js";
import { protect }        from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// ── User routes ───────────────────────────────────────────────
router.post("/",                protect, authorizeRoles("user","owner","superadmin"), createBooking);
router.get("/my",               protect, authorizeRoles("user","owner","superadmin"), getMyBookings);
router.patch("/:bookingId/cancel", protect, authorizeRoles("user","owner","superadmin"), cancelBooking);

// ── Slot availability (public) ────────────────────────────────
router.get("/slots/:restaurantId", protect, getAvailableSlots);

// ── Owner routes ──────────────────────────────────────────────
router.get("/owner",            protect, authorizeRoles("owner","superadmin"), getOwnerBookings);
router.get("/owner/count",      protect, authorizeRoles("owner","superadmin"), getOwnerBookingCount);
router.patch("/:bookingId/status", protect, authorizeRoles("owner","superadmin"), updateBookingStatus);

// ── Superadmin routes ─────────────────────────────────────────
router.get("/all",              protect, authorizeRoles("superadmin"), getAllBookings);

export default router;