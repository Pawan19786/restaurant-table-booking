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

    // ── Added by ────────────────────────────────────────────────
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);