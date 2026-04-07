import express from "express";
import {
  createOrUpdateReview,
  getReviewsByRestaurant,
  getMyReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(  "/",                         protect, createOrUpdateReview);
router.get(   "/:restaurantId",                     getReviewsByRestaurant);
router.get(   "/my/:restaurantId",         protect, getMyReview);
router.delete("/:restaurantId",            protect, deleteReview);

export default router;