import Stripe from "stripe";

// ✅ Lazy init — dotenv load hone ke baad call hoga
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// ── POST /api/payments/create-intent ─────────────────────────────────────────
export const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripe();
    const { amount, restaurantId, items } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // ₹ → paise
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        restaurantId: restaurantId || "",
        itemCount: items?.length?.toString() || "0",
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe Error:", err.message);
    res.status(500).json({ message: "Payment setup failed", error: err.message });
  }
};

// ── POST /api/payments/webhook ────────────────────────────────────────────────
export const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("✅ Payment succeeded:", event.data.object.id);
      break;
    case "payment_intent.payment_failed":
      console.log("❌ Payment failed:", event.data.object.id);
      break;
    default:
      break;
  }

  res.json({ received: true });
};