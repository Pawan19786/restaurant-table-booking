import express from "express";
import { getProfile, applyForOwner } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile",      protect, getProfile);
router.post("/apply-owner", protect, applyForOwner);

export default router;