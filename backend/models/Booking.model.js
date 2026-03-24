import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // ── Who booked ───────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
    },

    // ── Which restaurant ─────────────────────────────────────
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Restaurant",
      required: true,
    },

    // ── Booking details ──────────────────────────────────────
    date: {
      type:     Date,
      required: true,
    },
    timeSlot: {
      type:     String,  // e.g. "7:00 PM - 8:00 PM"
      required: true,
    },
    guests: {
      type:    Number,
      required: true,
      min:     1,
      max:     20,
    },
    specialRequest: {
      type:    String,
      default: "",
      trim:    true,
    },

    // ── Status ───────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ["pending", "confirmed", "rejected", "cancelled"],
      default: "pending",
    },
    rejectionReason: {
      type:    String,
      default: "",
    },
    cancelledAt: {
      type:    Date,
      default: null,
    },
    cancelledBy: {
      type:    String,
      enum:    ["user", "owner", "superadmin", null],
      default: null,
    },

    // ── Notification flags ───────────────────────────────────
    ownerNotified:  { type: Boolean, default: false },  // owner ko naya booking notification
    userNotified:   { type: Boolean, default: false },  // user ko status change notification
  },
  { timestamps: true }
);

// Index for faster queries
bookingSchema.index({ restaurant: 1, date: 1, timeSlot: 1 });
bookingSchema.index({ user: 1, status: 1 });

export default mongoose.model("Booking", bookingSchema);