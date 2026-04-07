import express from "express";
import { createPaymentIntent, stripeWebhook } from "../controllers/stripe.Controller.js";
import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/create-intent", protect, createPaymentIntent);
router.post("/webhook", stripeWebhook);

export default router;