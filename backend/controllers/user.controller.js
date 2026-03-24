import User from "../models/User.model.js";

export const applyForOwner = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "owner" || user.role === "superadmin")
      return res.status(400).json({ message: "You are already an owner or admin" });

    if (user.ownerStatus === "pending")
      return res.status(400).json({ message: "Your application is already under review" });

    const {
      fullName, phone, country, state, city,
      restaurantName, restaurantType, address, cuisines, restaurantPhoto,
      fssaiNumber, idProofType, idProof,
      subscriptionPlan, subscriptionDuration, subscriptionPrice,
    } = req.body;

    user.ownerStatus      = "pending";
    user.ownerApplication = {
      fullName, phone, country, state, city,
      restaurantName, restaurantType, address,
      cuisines:             cuisines || [],
      restaurantPhoto:      restaurantPhoto || "",
      fssaiNumber,
      idProofType:          idProofType || "aadhar",
      idProof:              idProof || "",
      subscriptionPlan,
      subscriptionDuration,
      subscriptionPrice:    Number(subscriptionPrice) || 0,
      appliedAt:            new Date(),
    };

    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "Application submitted! SuperAdmin will review it shortly." });
  } catch (error) {
    console.error("Apply Owner Error:", error);
    res.status(500).json({ message: "Failed to submit application", error: error.message });
  }
};

export const getProfile = (req, res) => {


  res.status(200).json({
    message: "Profile fetched successfully",
    user: req.user
  });
};
