import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    timeSlot: {
      type: String,
      default: "",
      trim: true,
    },

    orderType: {
      type: String,
      enum: ["table", "delivery"],
      default: "table",
    },

    guests: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },

    specialRequest: {
      type: String,
      default: "",
      trim: true,
    },

    foodItems: [
      {
        foodId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "FoodItem",
          default: null,
        },
        name: {
          type: String,
          default: "",
          trim: true,
        },
        price: {
          type: Number,
          default: 0,
          min: 0,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        image: {
          type: String,
          default: "",
        },
      },
    ],

    deliveryDetails: {
      fullName: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      addressLine1: { type: String, default: "", trim: true },
      addressLine2: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      pincode: { type: String, default: "", trim: true },
      landmark: { type: String, default: "", trim: true },
      deliverySlot: { type: String, default: "ASAP", trim: true },
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cod"],
      default: "pending",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "rejected",
        "cancelled",
      ],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ["user", "owner", "superadmin", null],
      default: null,
    },

    ownerNotified: {
      type: Boolean,
      default: false,
    },

    userNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ restaurant: 1, date: 1, timeSlot: 1 });
bookingSchema.index({ user: 1, status: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);