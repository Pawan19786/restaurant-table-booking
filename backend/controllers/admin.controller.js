import User       from "../models/User.model.js";
import Restaurant from "../models/Restaurant.model.js";

// ── GET all users ─────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .populate("restaurant", "name city _id");
    res.status(200).json({ success: true, users });
  } catch {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ── UPDATE user role ──────────────────────────────────────────
export const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const allowedRoles = ["user", "owner", "superadmin"];
    if (!allowedRoles.includes(role))
      return res.status(400).json({ message: "Invalid role" });
    if (userId === req.user._id.toString())
      return res.status(400).json({ message: "You cannot change your own role" });
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true, select: "-password" });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, message: `Role updated to ${role}`, user });
  } catch {
    res.status(500).json({ message: "Failed to update role" });
  }
};

// ── GET all owner requests (pending) ─────────────────────────
export const getOwnerRequests = async (req, res) => {
  try {
    const requests = await User.find({ ownerStatus: "pending" }).select("-password");
    res.status(200).json({ success: true, requests });
  } catch {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// ── APPROVE owner + auto-create & assign restaurant ──────────
export const approveOwner = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role        = "owner";
    user.ownerStatus = "approved";

    const app = user.ownerApplication;
    if (app && app.restaurantName) {
      let restaurant = await Restaurant.findOne({ addedBy: userId });
      if (!restaurant) {
        restaurant = await Restaurant.create({
          name:         app.restaurantName,
          description:  "",
          address:      app.address        || "",
          city:         app.city           || "",
          cuisineTypes: app.cuisines       || [],
          phoneNumber:  app.phone          || "",
          priceRange:   "₹₹",
          rating:       0,
          isActive:     true,
          image:        app.restaurantPhoto || "",
          addedBy:      userId,
        });
      }
      user.restaurant = restaurant._id;
    }

    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: "Owner approved and restaurant assigned!", user });
  } catch (error) {
    console.error("Approve Owner Error:", error);
    res.status(500).json({ message: "Failed to approve owner" });
  }
};

// ── REJECT owner request ──────────────────────────────────────
export const rejectOwner = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.ownerStatus = "rejected";
    await user.save();
    res.status(200).json({ success: true, message: "Owner request rejected" });
  } catch {
    res.status(500).json({ message: "Failed to reject request" });
  }
};

// ── DELETE user ───────────────────────────────────────────────
// 🔧 FIX: Owner delete hone par uska restaurant "unassigned" ho jata hai (delete nahi)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString())
      return res.status(400).json({ message: "Cannot delete yourself" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Agar owner hai toh uske saare restaurants ka addedBy null karo
    // Restaurant DELETE mat karo — sirf unassign karo taaki admin naya owner assign kar sake
    if (user.role === "owner") {
      await Restaurant.updateMany(
        { addedBy: userId },
        { $set: { addedBy: null } }
      );
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({
      success: true,
      message: "User deleted. Linked restaurants are now unassigned and visible in admin panel."
    });
  } catch {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// ── REMOVE owner from restaurant (unassign only, user account bana rahe) ─
export const removeOwnerFromRestaurant = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Saare linked restaurants unassign karo
    await Restaurant.updateMany(
      { addedBy: userId },
      { $set: { addedBy: null } }
    );

    // User ka restaurant field aur role reset karo
    user.restaurant  = null;
    user.ownerStatus = "none";
    user.role        = "user";
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Owner removed. Restaurant is now unassigned. User account still exists as regular user."
    });
  } catch (err) {
    console.error("Remove Owner Error:", err);
    res.status(500).json({ message: "Failed to remove owner" });
  }
};

// ── ASSIGN restaurant to owner (manual) ──────────────────────
export const assignRestaurant = async (req, res) => {
  try {
    const { userId, restaurantId } = req.body;
    if (!userId || !restaurantId)
      return res.status(400).json({ message: "userId and restaurantId required" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "owner")
      return res.status(400).json({ message: "User must have owner role first" });

    await Restaurant.findByIdAndUpdate(restaurantId, { addedBy: userId });
    user.restaurant  = restaurantId;
    user.ownerStatus = "approved";
    await user.save();

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("restaurant", "name city _id");
    res.status(200).json({ success: true, message: "Restaurant assigned to owner!", user: updatedUser });
  } catch {
    res.status(500).json({ message: "Failed to assign restaurant" });
  }
};

// ── BLOCK / UNBLOCK user ──────────────────────────────────────
export const blockUser = async (req, res) => {
  try {
    const { userId, isBlocked } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    if (userId === req.user._id.toString())
      return res.status(400).json({ message: "You cannot block yourself" });
    const user = await User.findByIdAndUpdate(userId, { isBlocked }, { new: true, select: "-password" });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, message: isBlocked ? "User blocked" : "User unblocked", user });
  } catch {
    res.status(500).json({ message: "Failed to update user status" });
  }
};