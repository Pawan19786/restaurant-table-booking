import { useState, useEffect } from "react";
import api from "../api/api";
import { toast } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface FoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  offer: number;
  category: string;
  isVeg: boolean;
  image: string;
  isAvailable: boolean;
}

interface Restaurant {
  _id: string;
  name: string;
  address: string;
  city: string;
  openingTime: string;
  closingTime: string;
  image: string;
}

interface SelectedFoodItem extends FoodItem {
  qty: number;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  preSelectedItem?: FoodItem | null;
  isDark?: boolean;
}

const today = () => new Date().toISOString().split("T")[0];

const formatTime = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m === 0 ? "00" : String(m).padStart(2, "0")} ${ampm}`;
};

// ── Inner form (needs Stripe hooks — must be inside <Elements>) ───────────────
function OrderForm({
  restaurant,
  preSelectedItem,
  isDark,
  onClose,
}: {
  restaurant: Restaurant;
  preSelectedItem?: FoodItem | null;
  isDark: boolean;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedFoodItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [specialReq, setSpecialReq] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(today());
  const [payMethod, setPayMethod] = useState<"card" | "cod">("card");
  const [cardError, setCardError] = useState("");
  const [cardFocused, setCardFocused] = useState(false);

  // ── Load menu ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurant._id) return;
    api
      .get(`/restaurants/${restaurant._id}`)
      .then((res) => setFoodItems((res.data.foodItems || []).filter((f: FoodItem) => f.isAvailable)))
      .catch(() => setFoodItems([]));
  }, [restaurant._id]);

  useEffect(() => {
    if (preSelectedItem) setSelectedItems([{ ...preSelectedItem, qty: 1 }]);
    else setSelectedItems([]);
  }, [preSelectedItem]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const totalFood = selectedItems.reduce((sum, item) => {
    const price = item.offer > 0 ? item.price * (1 - item.offer / 100) : item.price;
    return sum + price * item.qty;
  }, 0);

  const addItem = (item: FoodItem) =>
    setSelectedItems((prev) => {
      const ex = prev.find((i) => i._id === item._id);
      return ex
        ? prev.map((i) => (i._id === item._id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...item, qty: 1 }];
    });

  const removeItem = (id: string) =>
    setSelectedItems((prev) => {
      const ex = prev.find((i) => i._id === id);
      if (!ex) return prev;
      return ex.qty === 1 ? prev.filter((i) => i._id !== id) : prev.map((i) => (i._id === id ? { ...i, qty: i.qty - 1 } : i));
    });

  const getQty = (id: string) => selectedItems.find((i) => i._id === id)?.qty || 0;

  // ── Submit: Stripe Payment Intent → save booking ──────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    if (!phone.trim() || phone.length < 10) { toast.error("Valid phone required"); return; }
    if (!address.trim()) { toast.error("Address required"); return; }

    setSubmitting(true);
    try {
      let paymentStatus = "pending";

      if (payMethod === "card") {
        // 1️⃣ Create PaymentIntent on backend
        const intentRes = await api.post(
          "/payments/create-intent",
          {
            amount: Math.round(totalFood),
            restaurantId: restaurant._id,
            items: selectedItems.map((i) => ({ id: i._id, qty: i.qty })),
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        const { clientSecret } = intentRes.data;
        if (!clientSecret) throw new Error("Payment setup failed");

        // 2️⃣ Confirm card with Stripe
        const cardElement = elements?.getElement(CardElement);
        if (!cardElement || !stripe) throw new Error("Stripe not loaded");

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement, billing_details: { name, phone } },
        });

        if (stripeError) { toast.error(stripeError.message || "Payment failed"); setSubmitting(false); return; }
        if (paymentIntent?.status !== "succeeded") { toast.error("Payment not completed"); setSubmitting(false); return; }

        paymentStatus = "paid";
      }

      // 3️⃣ Save booking — orderType: "delivery" skips slot duplicate check
      const res = await api.post(
        "/bookings",
        {
          restaurantId: restaurant._id,
          date: deliveryDate,
          timeSlot: "Delivery ASAP",
          orderType: "delivery",          // ← tells backend to skip slot check
          guests: 1,
          specialRequest: specialReq,
          foodItems: selectedItems.map((i) => ({
            foodItemId: i._id,
            name: i.name,
            qty: i.qty,
            price: i.price,
            offer: i.offer,
          })),
          deliveryDetails: { name, phone, address, payMethod },
          totalAmount: Math.round(totalFood),
          paymentStatus,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setOrderId(res.data.booking?._id || `ORD${Date.now()}`);
      setDone(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Order failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1); setDone(false); setSelectedItems([]);
    setName(localStorage.getItem("name") || ""); setPhone(""); setAddress("");
    setSpecialReq(""); setDeliveryDate(today()); setPayMethod("card"); setCardError("");
    onClose();
  };

  const th = isDark ? "dark" : "light";

  const cardElementOptions = {
    style: {
      base: {
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "13px",
        color: isDark ? "#f0e8ff" : "#1a0840",
        "::placeholder": { color: isDark ? "rgba(160,96,240,0.4)" : "rgba(90,30,140,0.35)" },
        iconColor: isDark ? "#c090ff" : "#5b21b6",
      },
      invalid: { color: "#f87171", iconColor: "#f87171" },
    },
    hidePostalCode: true,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Montserrat:wght@300;400;500;600;700&display=swap');

        @keyframes om-in   { from{opacity:0;transform:translateY(40px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes om-spin { to{transform:rotate(360deg)} }
        @keyframes om-done { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
        @keyframes om-tick { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }

        .om-overlay { position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(4,2,15,0.85);backdrop-filter:blur(12px); }
        .om-box { width:100%;max-width:620px;max-height:90vh;border-radius:24px;overflow:hidden;display:flex;flex-direction:column;animation:om-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .om-box.dark  { background:rgba(8,4,22,0.97);border:1px solid rgba(160,96,240,0.2);box-shadow:0 40px 100px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.04); }
        .om-box.light { background:rgba(255,255,255,0.97);border:1px solid rgba(120,60,200,0.15);box-shadow:0 40px 80px rgba(80,30,160,0.12); }

        .om-header { display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;flex-shrink:0; }
        .dark  .om-header { border-bottom:1px solid rgba(160,96,240,0.1); }
        .light .om-header { border-bottom:1px solid rgba(120,60,200,0.08); }
        .om-rest-info { display:flex;align-items:center;gap:12px; }
        .om-rest-img  { width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0; }
        .om-rest-img-ph { width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0; }
        .dark  .om-rest-img-ph { background:rgba(160,96,240,0.15); }
        .light .om-rest-img-ph { background:rgba(124,58,237,0.08); }
        .om-rest-name { font-family:'Cinzel',serif;font-size:14px;font-weight:500;letter-spacing:0.04em; }
        .dark  .om-rest-name { color:#e8d8ff; }
        .light .om-rest-name { color:#2e1065; }
        .om-rest-loc { font-size:11px;margin-top:2px; }
        .dark  .om-rest-loc { color:rgba(180,140,255,0.45); }
        .light .om-rest-loc { color:rgba(90,30,140,0.5); }
        .om-close { background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;transition:all 0.2s;font-size:18px;line-height:1; }
        .dark  .om-close { color:rgba(200,160,255,0.5); }
        .light .om-close { color:rgba(90,30,140,0.4); }

        .om-steps { display:flex;align-items:center;padding:14px 24px;flex-shrink:0; }
        .dark  .om-steps { border-bottom:1px solid rgba(160,96,240,0.08); }
        .light .om-steps { border-bottom:1px solid rgba(120,60,200,0.06); }
        .om-step-item { display:flex;align-items:center;gap:8px;flex:1; }
        .om-step-num  { width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;transition:all 0.3s; }
        .om-step-num.done   { background:linear-gradient(135deg,#7030d0,#a060f0);color:#fff; }
        .om-step-num.active { background:rgba(160,96,240,0.2);color:#c090ff;border:1.5px solid rgba(160,96,240,0.5); }
        .dark  .om-step-num:not(.done):not(.active) { background:rgba(255,255,255,0.04);color:rgba(180,140,255,0.3);border:1px solid rgba(160,96,240,0.12); }
        .light .om-step-num:not(.done):not(.active) { background:rgba(120,60,200,0.05);color:rgba(90,30,140,0.3);border:1px solid rgba(120,60,200,0.1); }
        .om-step-label { font-size:11px;font-weight:500;letter-spacing:0.04em;white-space:nowrap; }
        .om-step-label.active { color:#c090ff; }
        .dark  .om-step-label:not(.active) { color:rgba(180,140,255,0.35); }
        .light .om-step-label:not(.active) { color:rgba(90,30,140,0.35); }
        .om-step-line { flex:1;height:1px;margin:0 8px; }
        .dark  .om-step-line { background:rgba(160,96,240,0.12); }
        .light .om-step-line { background:rgba(120,60,200,0.1); }
        .om-step-line.done { background:linear-gradient(90deg,#7030d0,#a060f0); }

        .om-body { flex:1;overflow-y:auto;padding:20px 24px; }
        .om-body::-webkit-scrollbar { width:4px; }
        .om-body::-webkit-scrollbar-thumb { background:rgba(160,96,240,0.25);border-radius:2px; }

        .om-sec-label { font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:12px; }
        .dark  .om-sec-label { color:rgba(160,96,240,0.6); }
        .light .om-sec-label { color:rgba(100,40,160,0.55); }

        .om-food-grid { display:flex;flex-direction:column;gap:10px;margin-bottom:24px; }
        .om-food-card { display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;transition:all 0.2s; }
        .dark  .om-food-card { background:rgba(255,255,255,0.03);border:1px solid rgba(160,96,240,0.1); }
        .light .om-food-card { background:rgba(255,255,255,0.7);border:1px solid rgba(120,60,200,0.1); }
        .om-food-img  { width:56px;height:56px;border-radius:10px;object-fit:cover;flex-shrink:0; }
        .om-food-img-ph { width:56px;height:56px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0; }
        .dark  .om-food-img-ph { background:rgba(160,96,240,0.12); }
        .light .om-food-img-ph { background:rgba(124,58,237,0.07); }
        .om-food-info { flex:1;min-width:0; }
        .om-food-name { font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .dark  .om-food-name { color:#e8d8ff; }
        .light .om-food-name { color:#2e1065; }
        .om-food-desc { font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .dark  .om-food-desc { color:rgba(180,140,255,0.4); }
        .light .om-food-desc { color:rgba(90,30,140,0.45); }
        .om-food-price { font-size:12px;font-weight:600;margin-top:4px; }
        .dark  .om-food-price { color:#c090ff; }
        .light .om-food-price { color:#5b21b6; }
        .om-food-offer { font-size:10px;text-decoration:line-through;margin-left:4px; }
        .dark  .om-food-offer { color:rgba(180,140,255,0.3); }
        .light .om-food-offer { color:rgba(90,30,140,0.3); }
        .om-qty-ctrl { display:flex;align-items:center;gap:8px;flex-shrink:0; }
        .om-qty-btn  { width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;font-size:16px;font-weight:700;transition:all 0.2s; }
        .dark  .om-qty-btn { background:rgba(160,96,240,0.15);color:#c090ff; }
        .light .om-qty-btn { background:rgba(124,58,237,0.1);color:#5b21b6; }
        .om-qty-btn.add { background:linear-gradient(135deg,#7030d0,#a060f0);color:#fff; }
        .om-qty-num  { font-size:13px;font-weight:700;min-width:20px;text-align:center; }
        .dark  .om-qty-num { color:#e8d8ff; }
        .light .om-qty-num { color:#2e1065; }

        .om-divider { height:1px;margin:16px 0; }
        .dark  .om-divider { background:rgba(160,96,240,0.1); }
        .light .om-divider { background:rgba(120,60,200,0.08); }

        .om-field { display:flex;flex-direction:column;gap:6px;margin-bottom:14px; }
        .om-label { font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase; }
        .dark  .om-label { color:rgba(180,140,255,0.5); }
        .light .om-label { color:rgba(90,30,140,0.5); }
        .om-input { width:100%;padding:11px 14px;border-radius:10px;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;transition:all 0.25s;border:1px solid; }
        .dark  .om-input { background:rgba(255,255,255,0.04);border-color:rgba(160,96,240,0.18);color:#f0e8ff; }
        .light .om-input { background:rgba(255,255,255,0.8);border-color:rgba(120,60,200,0.15);color:#1a0840; }
        .om-input:focus { border-color:rgba(160,96,240,0.55);box-shadow:0 0 0 3px rgba(160,96,240,0.1); }
        .om-input::placeholder { color:rgba(160,96,240,0.3); }
        .om-grid2 { display:grid;grid-template-columns:1fr 1fr;gap:12px; }

        /* ── Stripe card wrapper ── */
        .om-stripe-wrap { padding:12px 14px;border-radius:10px;border:1px solid;transition:all 0.25s; }
        .dark  .om-stripe-wrap { background:rgba(255,255,255,0.04);border-color:rgba(160,96,240,0.18); }
        .light .om-stripe-wrap { background:rgba(255,255,255,0.8);border-color:rgba(120,60,200,0.15); }
        .om-stripe-wrap.focused { border-color:rgba(160,96,240,0.55);box-shadow:0 0 0 3px rgba(160,96,240,0.1); }
        .om-stripe-wrap.errored { border-color:rgba(248,113,113,0.6);box-shadow:0 0 0 3px rgba(248,113,113,0.08); }
        .om-card-error  { font-size:11px;color:#f87171;margin-top:6px; }
        .om-stripe-secure { display:flex;align-items:center;gap:6px;font-size:10px;margin-top:8px;opacity:0.5; }
        .dark  .om-stripe-secure { color:#c090ff; }
        .light .om-stripe-secure { color:#5b21b6; }

        .om-pay-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px; }
        .om-pay-btn  { display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border-radius:12px;border:none;cursor:pointer;transition:all 0.25s;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.04em; }
        .dark  .om-pay-btn { background:rgba(255,255,255,0.04);color:rgba(200,170,255,0.55);border:1.5px solid rgba(160,96,240,0.12); }
        .light .om-pay-btn { background:rgba(255,255,255,0.6);color:rgba(90,30,150,0.5);border:1.5px solid rgba(120,60,200,0.12); }
        .om-pay-btn.sel { background:rgba(160,96,240,0.15);color:#c090ff;border-color:rgba(160,96,240,0.45);box-shadow:0 0 16px rgba(160,96,240,0.2); }
        .light .om-pay-btn.sel { background:rgba(124,58,237,0.1);color:#5b21b6; }
        .om-pay-icon { font-size:22px; }

        .om-cart-bar { display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:12px;margin-bottom:16px; }
        .dark  .om-cart-bar { background:rgba(160,96,240,0.1);border:1px solid rgba(160,96,240,0.2); }
        .light .om-cart-bar { background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.15); }
        .om-cart-count { font-size:12px; }
        .dark  .om-cart-count { color:rgba(200,160,255,0.7); }
        .light .om-cart-count { color:rgba(90,30,140,0.6); }
        .om-cart-total { font-family:'Cinzel',serif;font-size:16px;font-weight:500; }
        .dark  .om-cart-total { color:#d4a0ff; }
        .light .om-cart-total { color:#5b21b6; }

        .om-summary-row { display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px; }
        .dark  .om-summary-row { color:rgba(200,170,255,0.55); }
        .light .om-summary-row { color:rgba(90,30,140,0.5); }
        .om-summary-row.total { font-size:16px;font-weight:700;margin-top:8px;padding-top:12px;border-top:1px solid; }
        .dark  .om-summary-row.total { color:#e8d8ff;border-color:rgba(160,96,240,0.15); }
        .light .om-summary-row.total { color:#2e1065;border-color:rgba(120,60,200,0.1); }

        .om-footer { display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 24px;flex-shrink:0; }
        .dark  .om-footer { border-top:1px solid rgba(160,96,240,0.1); }
        .light .om-footer { border-top:1px solid rgba(120,60,200,0.08); }
        .om-btn-back { padding:11px 20px;border-radius:10px;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.06em;transition:all 0.2s; }
        .dark  .om-btn-back { background:rgba(255,255,255,0.04);color:rgba(200,160,255,0.6);border:1px solid rgba(160,96,240,0.18); }
        .light .om-btn-back { background:rgba(255,255,255,0.6);color:rgba(90,30,140,0.5);border:1px solid rgba(120,60,200,0.15); }
        .om-btn-next { flex:1;padding:12px 24px;border-radius:10px;border:none;cursor:pointer;background:linear-gradient(135deg,#7030d0,#a060f0);color:#fff;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.06em;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(112,48,208,0.35); }
        .om-btn-next:hover:not(:disabled) { filter:brightness(1.1);transform:translateY(-1px); }
        .om-btn-next:disabled { opacity:0.6;cursor:wait; }
        .om-spinner { width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;animation:om-spin 0.7s linear infinite; }

        .om-done { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:48px 24px;text-align:center;animation:om-done 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .om-done-circle { width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#7030d0,#a060f0);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(160,96,240,0.5); }
        .om-done-tick { stroke-dasharray:50;stroke-dashoffset:0;animation:om-tick 0.6s ease 0.3s both; }
        .om-done-title { font-family:'Cinzel',serif;font-size:22px;font-weight:500; }
        .dark  .om-done-title { color:#e8d8ff; }
        .light .om-done-title { color:#2e1065; }
        .om-done-sub { font-size:13px;line-height:1.7;max-width:360px; }
        .dark  .om-done-sub { color:rgba(200,170,255,0.55); }
        .light .om-done-sub { color:rgba(90,30,140,0.5); }
        .om-done-id { font-size:11px;padding:6px 14px;border-radius:20px;font-weight:600;letter-spacing:0.08em; }
        .dark  .om-done-id { background:rgba(160,96,240,0.12);color:#c090ff;border:1px solid rgba(160,96,240,0.2); }
        .light .om-done-id { background:rgba(124,58,237,0.08);color:#5b21b6;border:1px solid rgba(124,58,237,0.18); }

        @media (max-width:640px) { .om-grid2 { grid-template-columns:1fr; } }
      `}</style>

      <div className="om-overlay" onClick={handleClose}>
        <div className={`om-box ${th}`} onClick={(e) => e.stopPropagation()}>

          {/* ── SUCCESS SCREEN ── */}
          {done ? (
            <div className="om-done">
              <div className="om-done-circle">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path className="om-done-tick" d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="om-done-title">Order Placed!</div>
              <div className="om-done-sub">
                {payMethod === "card"
                  ? "Payment confirmed via Stripe. Your order is being prepared!"
                  : "Order placed! Pay cash when it arrives."}
              </div>
              <div className="om-done-id">ORDER ID · {orderId}</div>
              <button className="om-btn-next" style={{ maxWidth: 240, marginTop: 8 }} onClick={handleClose}>Done</button>
            </div>

          ) : (
            <>
              {/* ── HEADER ── */}
              <div className="om-header">
                <div className="om-rest-info">
                  {restaurant.image
                    ? <img src={restaurant.image} alt={restaurant.name} className="om-rest-img" />
                    : <div className="om-rest-img-ph">🏪</div>}
                  <div>
                    <div className="om-rest-name">{restaurant.name}</div>
                    <div className="om-rest-loc">{restaurant.city} · {formatTime(restaurant.openingTime)} – {formatTime(restaurant.closingTime)}</div>
                  </div>
                </div>
                <button className="om-close" onClick={handleClose}>✕</button>
              </div>

              {/* ── STEPS ── */}
              <div className="om-steps">
                {["Select Food", "Delivery", "Payment"].map((label, i) => {
                  const n = i + 1;
                  return (
                    <div key={n} className="om-step-item">
                      <div className={`om-step-num ${step > n ? "done" : step === n ? "active" : ""}`}>
                        {step > n ? "✓" : n}
                      </div>
                      <span className={`om-step-label ${step === n ? "active" : ""}`}>{label}</span>
                      {i < 2 && <div className={`om-step-line ${step > n ? "done" : ""}`} />}
                    </div>
                  );
                })}
              </div>

              {/* ── BODY ── */}
              <div className="om-body">

                {/* STEP 1 — Food selection */}
                {step === 1 && (
                  <>
                    <div className="om-sec-label">Choose from the menu</div>
                    {selectedItems.length > 0 && (
                      <div className="om-cart-bar">
                        <span className="om-cart-count">🛒 {selectedItems.reduce((s, i) => s + i.qty, 0)} item{selectedItems.reduce((s, i) => s + i.qty, 0) > 1 ? "s" : ""}</span>
                        <span className="om-cart-total">₹{Math.round(totalFood).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="om-food-grid">
                      {foodItems.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.5, fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>Loading menu...
                        </div>
                      ) : foodItems.map((item) => {
                        const qty = getQty(item._id);
                        const dp = item.offer > 0 ? item.price * (1 - item.offer / 100) : item.price;
                        return (
                          <div key={item._id} className="om-food-card">
                            {item.image ? <img src={item.image} alt={item.name} className="om-food-img" /> : <div className="om-food-img-ph">🍱</div>}
                            <div className="om-food-info">
                              <div className="om-food-name">{item.name}</div>
                              <div className="om-food-desc">{item.description}</div>
                              <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                                <span className="om-food-price">₹{Math.round(dp)}</span>
                                {item.offer > 0 && <span className="om-food-offer">₹{item.price}</span>}
                                <span style={{ fontSize: 10, marginLeft: 6 }}>{item.isVeg ? "🟢" : "🔴"}</span>
                              </div>
                            </div>
                            <div className="om-qty-ctrl">
                              {qty > 0 ? (
                                <>
                                  <button className="om-qty-btn" onClick={() => removeItem(item._id)}>−</button>
                                  <span className="om-qty-num">{qty}</span>
                                  <button className="om-qty-btn add" onClick={() => addItem(item)}>+</button>
                                </>
                              ) : (
                                <button className="om-qty-btn add" onClick={() => addItem(item)}>+</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* STEP 2 — Delivery details */}
                {step === 2 && (
                  <>
                    {selectedItems.length > 0 && (
                      <div className="om-cart-bar" style={{ marginBottom: 20 }}>
                        <span className="om-cart-count">🛒 {selectedItems.reduce((s, i) => s + i.qty, 0)} item(s)</span>
                        <span className="om-cart-total">₹{Math.round(totalFood).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="om-sec-label">Delivery Details</div>
                    <div className="om-grid2">
                      <div className="om-field">
                        <label className="om-label">Full Name *</label>
                        <input className="om-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="om-field">
                        <label className="om-label">Phone *</label>
                        <input className="om-input" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} type="tel" />
                      </div>
                    </div>
                    <div className="om-field">
                      <label className="om-label">Delivery Address *</label>
                      <input className="om-input" placeholder="Full address with area & city" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="om-grid2">
                      <div className="om-field">
                        <label className="om-label">Preferred Date</label>
                        <input className="om-input" type="date" value={deliveryDate} min={today()} onChange={(e) => setDeliveryDate(e.target.value)} />
                      </div>
                      <div className="om-field">
                        <label className="om-label">Delivery Mode</label>
                        <input className="om-input" value="Home Delivery" readOnly />
                      </div>
                    </div>
                    <div className="om-field">
                      <label className="om-label">Delivery Notes</label>
                      <textarea className="om-input" rows={3} style={{ resize: "none" }} placeholder="Landmark, gate number, allergies…" value={specialReq} onChange={(e) => setSpecialReq(e.target.value)} />
                    </div>
                  </>
                )}

                {/* STEP 3 — Payment */}
                {step === 3 && (
                  <>
                    <div className="om-sec-label">Order Summary</div>
                    <div style={{ marginBottom: 20 }}>
                      {selectedItems.map((i) => (
                        <div className="om-summary-row" key={i._id}>
                          <span>{i.name} × {i.qty}</span>
                          <span>₹{Math.round((i.offer > 0 ? i.price * (1 - i.offer / 100) : i.price) * i.qty)}</span>
                        </div>
                      ))}
                      <div className="om-summary-row"><span>Delivery Date</span><span>{deliveryDate}</span></div>
                      <div className="om-summary-row"><span>Delivery Slot</span><span style={{ color: "#60d090" }}>ASAP</span></div>
                      <div className="om-summary-row total"><span>Total</span><span>₹{Math.round(totalFood).toLocaleString()}</span></div>
                    </div>

                    <div className="om-divider" />
                    <div className="om-sec-label">Payment Method</div>

                    <div className="om-pay-grid">
                      {([
                        { id: "card", icon: "💳", label: "Pay by Card" },
                        { id: "cod", icon: "💵", label: "Cash on Delivery" },
                      ] as const).map((p) => (
                        <button key={p.id} className={`om-pay-btn ${payMethod === p.id ? "sel" : ""}`} onClick={() => setPayMethod(p.id)}>
                          <span className="om-pay-icon">{p.icon}</span>
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* ── REAL Stripe Card Element ── */}
                    {payMethod === "card" && (
                      <div className="om-field">
                        <label className="om-label">Card Details</label>
                        <div className={`om-stripe-wrap ${cardError ? "errored" : cardFocused ? "focused" : ""}`}>
                          <CardElement
                            options={cardElementOptions}
                            onFocus={() => setCardFocused(true)}
                            onBlur={() => setCardFocused(false)}
                            onChange={(e) => setCardError(e.error?.message || "")}
                          />
                        </div>
                        {cardError && <div className="om-card-error">⚠ {cardError}</div>}
                        <div className="om-stripe-secure">
                          <svg width="11" height="13" viewBox="0 0 24 28" fill="currentColor">
                            <path d="M12 0L2 4v8c0 7.18 4.27 13.87 10 16 5.73-2.13 10-8.82 10-16V4L12 0z" />
                          </svg>
                          Secured by Stripe · 256-bit SSL
                        </div>
                      </div>
                    )}

                    {payMethod === "cod" && (
                      <div style={{ padding: "12px 16px", borderRadius: 10, fontSize: 12, opacity: 0.7 }}>
                        💵 Pay cash when your order arrives at your door.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── FOOTER ── */}
              <div className="om-footer">
                {step > 1
                  ? <button className="om-btn-back" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>← Back</button>
                  : <button className="om-btn-back" onClick={handleClose}>Cancel</button>}

                {step < 3 ? (
                  <button className="om-btn-next" onClick={() => {
                    if (step === 1 && selectedItems.length === 0) { toast.error("Please add at least one item"); return; }
                    if (step === 2 && (!name.trim() || !phone.trim() || !address.trim())) { toast.error("Please fill all required fields"); return; }
                    setStep((s) => (s + 1) as 1 | 2 | 3);
                  }}>
                    {step === 1 ? `Continue · ₹${Math.round(totalFood).toLocaleString()}` : "Review & Pay →"}
                  </button>
                ) : (
                  <button className="om-btn-next" disabled={submitting || (payMethod === "card" && !!cardError)} onClick={handleSubmit}>
                    {submitting
                      ? <><span className="om-spinner" />{payMethod === "card" ? " Processing..." : " Placing order..."}</>
                      : payMethod === "card"
                        ? `🔒 Pay ₹${Math.round(totalFood).toLocaleString()}`
                        : `🚀 Place Order · ₹${Math.round(totalFood).toLocaleString()}`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Outer wrapper — provides Stripe context ───────────────────────────────────
export default function OrderModal({ isOpen, onClose, restaurant, preSelectedItem, isDark = true }: OrderModalProps) {
  if (!isOpen) return null;
  return (
    <Elements stripe={stripePromise}>
      <OrderForm restaurant={restaurant} preSelectedItem={preSelectedItem} isDark={isDark} onClose={onClose} />
    </Elements>
  );
}