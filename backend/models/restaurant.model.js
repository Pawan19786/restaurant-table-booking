import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Location ────────────────────────────────────────────────
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    // ── Contact ─────────────────────────────────────────────────
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    managerContact: {
      type: String,
      trim: true,
      default: "",
    },
    telNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Cuisine ─────────────────────────────────────────────────
    cuisineTypes: {
      type: [String],   // ["Indian", "Italian", "Chinese"]
      default: [],
    },

    // ── Timing ──────────────────────────────────────────────────
    openingTime: {
      type: String,     // "09:00"
      default: "",
    },
    closingTime: {
      type: String,     // "23:00"
      default: "",
    },

    // ── Photo ───────────────────────────────────────────────────
    image: {
      type: String,     // Cloudinary URL
      default: "",
    },
    imagePublicId: {
      type: String,     // Cloudinary public_id (delete ke liye)
      default: "",
    },

    // ── Ratings & Price ─────────────────────────────────────────
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    priceRange: {
      type: String,
      enum: ["₹", "₹₹", "₹₹₹"],
      default: "₹₹",
    },

    // ── Status ──────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Nightlife Extended Fields ───────────────────────────────
    venueType: {
      type: String,
      enum: ["dining", "club", "pub", "lounge", "rooftop", "live_music"],
      default: "dining"
    },
    events: [
      {
        eventName: { type: String, required: true },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        artist: { type: String },
        entryFee: { type: String, default: "Free" }
      }
    ],
    offers: [
      {
        title: { type: String, required: true },
        description: { type: String },
        validTime: { type: String }
      }
    ],

    // ── Added by ────────────────────────────────────────────────
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);