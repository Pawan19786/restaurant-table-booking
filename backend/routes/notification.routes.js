import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  notifyCartAdd
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(protect); // All routes require authentication

router.get("/", getUserNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.post("/cart-add", notifyCartAdd);

export default router;
