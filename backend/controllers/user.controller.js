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
      // Step 3 — Operations
      description, restaurantPhone, managerContact, telNumber,
      openingTime, closingTime, priceRange, rating,
      // Step 4 — Documents
      fssaiNumber, idProofType, idProof,
      subscriptionPlan, subscriptionDuration, subscriptionPrice,
    } = req.body;

    // ── Safety: never store raw base64 in MongoDB (causes doc bloat / 16MB limit) ──
    // Frontend should upload to Cloudinary and send back the URL.
    // If somehow a base64 string slips through, we strip it here.
    const safePhoto  = restaurantPhoto && !restaurantPhoto.startsWith("data:") ? restaurantPhoto  : "";
    const safeIdProof = idProof        && !idProof.startsWith("data:")         ? idProof          : "";

    user.ownerStatus      = "pending";
    user.ownerApplication = {
      fullName,
      phone,
      country,
      state,
      city,
      restaurantName,
      restaurantType,
      address,
      cuisines:             cuisines       || [],
      restaurantPhoto:      safePhoto,           // ← Cloudinary URL only
      // Operations fields (Step 3)
      description:          description    || "",
      restaurantPhone:      restaurantPhone || "",
      managerContact:       managerContact  || "",
      telNumber:            telNumber       || "",
      openingTime:          openingTime     || "",
      closingTime:          closingTime     || "",
      priceRange:           priceRange      || "mid",
      rating:               Number(rating)  || 0,
      // Documents (Step 4)
      fssaiNumber:          fssaiNumber     || "",
      idProofType:          idProofType     || "aadhar",
      idProof:              safeIdProof,          // ← Cloudinary URL only
      subscriptionPlan:     subscriptionPlan     || "",
      subscriptionDuration: subscriptionDuration || "",
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
    user: req.user,
  });
};