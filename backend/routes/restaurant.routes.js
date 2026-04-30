import express from "express";
import {
  getAllRestaurants, getRestaurantById, getMyRestaurant, getMyRestaurants,
  createRestaurant, updateRestaurant, deleteRestaurant, toggleRestaurantStatus,
  getFoodItemsByRestaurant, createFoodItem, updateFoodItem,
  deleteFoodItem, toggleFoodItemAvailability,
} from "../controllers/restaurant.controller.js";
import { protect }        from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { cacheResponse }  from "../middleware/cache.middleware.js";

const router = express.Router();

// ── Public (cached) ──────────────────────────────────────────────
router.get("/",                   cacheResponse(30), getAllRestaurants);   // 30s cache

// ── Owner — apna restaurant (MUST be before /:id wildcard!) ──
router.get("/my/restaurant",   protect, authorizeRoles("owner"), getMyRestaurant);
router.get("/my/restaurants",  protect, authorizeRoles("owner"), getMyRestaurants);
router.post("/my/restaurant",  protect, authorizeRoles("owner"), createRestaurant);
router.put("/my/restaurant",   protect, authorizeRoles("owner", "superadmin"), updateRestaurant);
router.patch("/my/restaurant/toggle", protect, authorizeRoles("owner", "superadmin"), toggleRestaurantStatus);

// ── Food items — owner + superadmin ───────────────────────────
router.post(  "/food",             protect, authorizeRoles("owner", "superadmin"), createFoodItem);
router.put(   "/food/:id",         protect, authorizeRoles("owner", "superadmin"), updateFoodItem);
router.delete("/food/:id",         protect, authorizeRoles("owner", "superadmin"), deleteFoodItem);
router.patch( "/food/:id/toggle",  protect, authorizeRoles("owner", "superadmin"), toggleFoodItemAvailability);

// ── Wildcard by ID — MUST come after all specific routes ─────
router.get(   "/:id",          cacheResponse(60), getRestaurantById);     // 60s cache
router.get(   "/:restaurantId/food", cacheResponse(30), getFoodItemsByRestaurant);  // 30s cache

// ── Superadmin only ───────────────────────────────────────────
router.post(  "/",             protect, authorizeRoles("superadmin"), createRestaurant);
router.put(   "/:id",          protect, authorizeRoles("superadmin"), updateRestaurant);
router.delete("/:id",          protect, authorizeRoles("superadmin"), deleteRestaurant);
router.patch( "/:id/toggle",   protect, authorizeRoles("superadmin", "owner"), toggleRestaurantStatus);

export default router;