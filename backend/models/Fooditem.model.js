import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Food item name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Pricing ─────────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    offer: {
      type: Number,   // discount % — e.g. 20 means 20% off
      min: 0,
      max: 100,
      default: 0,
    },

    // ── Category ────────────────────────────────────────────────
    category: {
      type: String,
      enum: ["Starter", "Main Course", "Dessert", "Beverage", "Snacks", "Breads", "Rice & Biryani", "Other"],
      default: "Other",
    },

    // ── Tags ────────────────────────────────────────────────────
    isVeg: {
      type: Boolean,
      default: true,   // true = Veg 🟢, false = Non-Veg 🔴
    },
    spicyLevel: {
      type: String,
      enum: ["No Spicy", "Mild", "Medium", "Hot", "Extra Hot"],
      default: "Medium",
    },

    // ── Photo ───────────────────────────────────────────────────
    image: {
      type: String,   // Cloudinary URL
      default: "",
    },
    imagePublicId: {
      type: String,   // Cloudinary public_id
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },

    // ── Availability ────────────────────────────────────────────
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // ── Belongs to which restaurant ─────────────────────────────
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // ── Added by ────────────────────────────────────────────────
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// ── Performance Indexes ─────────────────────────────────────────
foodItemSchema.index({ restaurant: 1, category: 1 });     // food items by restaurant

export default mongoose.models.FoodItem || mongoose.model("FoodItem", foodItemSchema);