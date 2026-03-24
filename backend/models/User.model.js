import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false },

    // ✅ 3 levels: user → owner → superadmin
    role: {
      type: String,
      enum: ["user", "owner", "superadmin"],
      default: "user",
    },

    // Owner ke liye — kaun sa restaurant manage karta hai
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },

    isBlocked: { type: Boolean, default: false },

    // Owner approval status
    ownerStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: null,   // null = normal user, pending/approved/rejected = owner request
    },

    ownerApplication: {
  fullName:            { type: String, default: "" },
  phone:               { type: String, default: "" },
  country:             { type: String, default: "" },
  state:               { type: String, default: "" },
  city:                { type: String, default: "" },
  restaurantName:      { type: String, default: "" },
  restaurantType:      { type: String, default: "" },
  address:             { type: String, default: "" },
  cuisines:            { type: [String], default: [] },
  restaurantPhoto:     { type: String, default: "" },
  fssaiNumber:         { type: String, default: "" },
  idProofType:         { type: String, default: "" },
  idProof:             { type: String, default: "" },
  subscriptionPlan:    { type: String, default: "" },
  subscriptionDuration:{ type: String, default: "" },
  subscriptionPrice:   { type: Number, default: 0 },
  appliedAt:           { type: Date, default: null },
},

    picture:      { type: String,  default: null },
    googleId:     { type: String,  default: null },
    isGoogleUser: { type: Boolean, default: false },
    resetPasswordToken:  { type: String, default: undefined, select: false },
    resetPasswordExpire: { type: Date,   default: undefined, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.password) return;
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);