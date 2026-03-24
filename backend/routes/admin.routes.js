import express from "express";
import {
  getAllUsers, updateUserRole, deleteUser,
  getOwnerRequests, approveOwner, rejectOwner,
  assignRestaurant, removeOwnerFromRestaurant,
  blockUser,
} from "../controllers/admin.controller.js";
import { protect }        from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// All routes — superadmin only
router.get(   "/users",                protect, authorizeRoles("superadmin"), getAllUsers);
router.patch( "/users/role",           protect, authorizeRoles("superadmin"), updateUserRole);
router.delete("/users/:userId",        protect, authorizeRoles("superadmin"), deleteUser);
router.patch( "/users/block",          protect, authorizeRoles("superadmin"), blockUser);

// 🔧 NEW: Remove owner (restaurant unassign, role reset to user, account bana rahe)
router.patch("/users/:userId/remove-owner", protect, authorizeRoles("superadmin"), removeOwnerFromRestaurant);

// Owner requests
router.get(   "/owner-requests",                 protect, authorizeRoles("superadmin"), getOwnerRequests);
router.patch( "/owner-requests/:userId/approve", protect, authorizeRoles("superadmin"), approveOwner);
router.patch( "/owner-requests/:userId/reject",  protect, authorizeRoles("superadmin"), rejectOwner);

// Assign restaurant to owner
router.patch("/assign-restaurant", protect, authorizeRoles("superadmin"), assignRestaurant);

export default router;