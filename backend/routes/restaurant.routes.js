import express from "express";
import {
  getAllRestaurants, getRestaurantById, getMyRestaurant,
  createRestaurant, updateRestaurant, deleteRestaurant, toggleRestaurantStatus,
  getFoodItemsByRestaurant, createFoodItem, updateFoodItem,
  deleteFoodItem, toggleFoodItemAvailability,
} from "../controllers/restaurant.controller.js";
import { protect }        from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────
router.get("/",                   getAllRestaurants);
router.get("/:id",                getRestaurantById);
router.get("/:restaurantId/food", getFoodItemsByRestaurant);

// ── Owner — apna restaurant ───────────────────────────────────
router.get("/my/restaurant", protect, authorizeRoles("owner"), getMyRestaurant);
router.put("/my/restaurant",       protect, authorizeRoles("owner", "superadmin"), updateRestaurant);
router.patch("/my/restaurant/toggle", protect, authorizeRoles("owner", "superadmin"), toggleRestaurantStatus);

// ── Superadmin only ───────────────────────────────────────────
router.post(  "/",             protect, authorizeRoles("superadmin"), createRestaurant);
router.put(   "/:id",          protect, authorizeRoles("superadmin"), updateRestaurant);
router.delete("/:id",          protect, authorizeRoles("superadmin"), deleteRestaurant);
router.patch( "/:id/toggle",   protect, authorizeRoles("superadmin", "owner"), toggleRestaurantStatus);

// ── Food items — owner + superadmin ───────────────────────────
router.post(  "/food",             protect, authorizeRoles("owner", "superadmin"), createFoodItem);
router.put(   "/food/:id",         protect, authorizeRoles("owner", "superadmin"), updateFoodItem);
router.delete("/food/:id",         protect, authorizeRoles("owner", "superadmin"), deleteFoodItem);
router.patch( "/food/:id/toggle",  protect, authorizeRoles("owner", "superadmin"), toggleFoodItemAvailability);

export default router;