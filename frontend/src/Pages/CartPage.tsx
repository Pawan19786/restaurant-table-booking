import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ── Step indicators ───────────────────────────────────────────────────────────
const STEPS = ["Cart", "Delivery", "Review & Pay"];

// ── Payment form (inner) ──────────────────────────────────────────────────────
function PaymentForm({
  amount, onSuccess, deliveryDetails, restaurantId, items, isDark
}: {
  amount: number;
  onSuccess: () => void;
  deliveryDetails: any;
  restaurantId: string;
  items: any[];
  isDark: boolean;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const { clearCart } = useCart();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    try {
      // 1. Create payment intent
      const { data } = await api.post("/payments/create-intent", {
        amount,
        restaurantId,
        items,
      });

      // 2. Confirm card payment
      const cardEl = elements.getElement(CardElement);
      if (!cardEl) throw new Error("Card element not found");

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardEl },
      });

      if (result.error) throw new Error(result.error.message);

      // 3. Create booking with paid status
      await api.post("/bookings", {
        restaurantId,
        date:            new Date().toISOString(),
        orderType:       "delivery",
        foodItems:       items,
        deliveryDetails,
        totalAmount:     amount,
        paymentStatus:   "paid",
      });

      clearCart();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div>
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(251,191,36,0.15)",
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, color: "rgba(240,236,228,0.4)", marginBottom: 10, letterSpacing: "0.08em" }}>
          CARD DETAILS
        </div>
        <CardElement options={{
          style: {
            base: {
              fontSize: "15px",
              color: isDark ? "#f0ece4" : "#0f172a",
              fontFamily: "'DM Sans', sans-serif",
              "::placeholder": { color: isDark ? "rgba(240,236,228,0.25)" : "rgba(15,23,42,0.3)" },
            },
            invalid: { color: "#f87171" },
          },
        }} />
      </div>

      <div className="cp-pay-summary">
        <span className="cp-pay-label">Total to Pay</span>
        <span className="cp-pay-val">₹{amount.toFixed(2)}</span>
      </div>

      <button
        onClick={handlePay}
        disabled={!stripe || paying}
        style={{
          width: "100%", padding: "15px",
          background: paying ? "rgba(251,191,36,0.3)" : "linear-gradient(135deg,#f59e0b,#fbbf24)",
          border: "none", borderRadius: 12,
          fontSize: 15, fontWeight: 700,
          color: paying ? (isDark ? "rgba(240,236,228,0.5)" : "rgba(15,23,42,0.5)") : "#0f1117",
          cursor: paying ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.2s",
        }}
      >
        {paying ? "Processing..." : `Pay ₹${amount.toFixed(2)}`}
      </button>

      <p className="cp-secure-text">
        🔒 Secured by Stripe
      </p>
    </div>
  );
}

// ── Main CartPage ─────────────────────────────────────────────────────────────
export default function CartPage() {
  const { items, restaurantId, restaurantName, removeItem, updateQty, totalAmount } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);   // 0=Cart 1=Delivery 2=Review+Pay
  const [orderDone, setOrderDone] = useState(false);

  const [delivery, setDelivery] = useState({
    fullName:     user?.name || "",
    phone:        "",
    addressLine1: "",
    addressLine2: "",
    city:         "",
    state:        "",
    pincode:      "",
    landmark:     "",
    deliverySlot: "ASAP",
  });

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDelivery(d => ({ ...d, [e.target.name]: e.target.value }));
  };

  const deliveryFee  = totalAmount > 0 ? 40 : 0;
  const platformFee  = totalAmount > 0 ? 5  : 0;
  const grandTotal   = totalAmount + deliveryFee + platformFee;

  const deliveryValid =
    delivery.fullName && delivery.phone && delivery.addressLine1 &&
    delivery.city && delivery.state && delivery.pincode;

  if (orderDone) {
    return (
      <div className={`cp-root${!isDark ? " light" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
          <h2 style={{ color: "#10b981", fontSize: 28, fontFamily: "'Playfair Display', serif", marginBottom: 12 }}>
            Order Placed!
          </h2>
          <p className="cp-done-text" style={{ fontSize: 15, marginBottom: 8 }}>
            Your order from <strong style={{ color: "#fbbf24" }}>{restaurantName}</strong> is confirmed.
          </p>
          <p className="cp-done-subtext" style={{ fontSize: 13, marginBottom: 32 }}>
            You'll receive an email confirmation shortly.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => navigate("/my-bookings")} className="cp-btn-primary" style={{ width: "auto" }}>
              Track Order →
            </button>
            <button onClick={() => navigate("/restaurants")} className="cp-btn-ghost">
              Browse More
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cartItems = items.map(i => ({
    foodId:   i._id,
    name:     i.name,
    price:    i.offer > 0 ? Math.round(i.price * (1 - i.offer / 100)) : i.price,
    quantity: i.quantity,
    image:    i.image,
  }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        @keyframes cp-fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        .cp-root { min-height: 100vh; background: #080a0e; color: #f0ece4; font-family: 'DM Sans', sans-serif; }
        .cp-header { padding: 28px 32px 0; animation: cp-fadeUp 0.4s ease both; }
        .cp-back { display:flex;align-items:center;gap:8px;background:none;border:none;color:rgba(240,236,228,0.4);cursor:pointer;font-family:inherit;font-size:13px;padding:0;margin-bottom:20px;transition:color 0.2s; }
        .cp-back:hover { color: rgba(240,236,228,0.8); }
        .cp-title { font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:4px; }
        .cp-subtitle { font-size:13px;color:rgba(240,236,228,0.4); }

        /* Steps */
        .cp-steps { display:flex;align-items:center;gap:0;margin:28px 32px; }
        .cp-step { display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:0.04em; }
        .cp-step-circle { width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;transition:all 0.3s; }
        .cp-step-circle.done { background:#10b981;color:#fff; }
        .cp-step-circle.active { background:#fbbf24;color:#0f1117; }
        .cp-step-circle.todo { background:rgba(255,255,255,0.06);color:rgba(240,236,228,0.3); }
        .cp-step-label.active { color:#fbbf24; }
        .cp-step-label.done { color:#10b981; }
        .cp-step-label.todo { color:rgba(240,236,228,0.3); }
        .cp-step-line { flex:1;height:1px;background:rgba(255,255,255,0.07);margin:0 12px; }
        .cp-step-line.done { background:#10b981; }

        /* Layout */
        .cp-layout { display:grid;grid-template-columns:1fr 340px;gap:24px;padding:0 32px 40px;align-items:start; }
        @media(max-width:860px){ .cp-layout{grid-template-columns:1fr;} }

        /* Cart items */
        .cp-card { background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden; }
        .cp-card-header { padding:18px 20px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;font-weight:600;color:rgba(240,236,228,0.6);letter-spacing:0.06em; }

        .cp-item { display:flex;gap:14px;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s; }
        .cp-item:last-child { border-bottom: none; }
        .cp-item:hover { background:rgba(255,255,255,0.02); }
        .cp-item-img { width:56px;height:56px;border-radius:10px;object-fit:cover;flex-shrink:0; }
        .cp-item-img-ph { width:56px;height:56px;border-radius:10px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0; }
        .cp-item-name { font-size:14px;font-weight:600;color:#f0ece4;margin-bottom:3px; }
        .cp-item-price { font-size:13px;color:rgba(240,236,228,0.5); }
        .cp-item-badge { display:inline-block;width:10px;height:10px;border-radius:2px;border:1.5px solid;margin-right:5px; }
        .cp-qty { display:flex;align-items:center;gap:10px;margin-left:auto;flex-shrink:0; }
        .cp-qty-btn { width:28px;height:28px;border-radius:8px;border:1px solid rgba(251,191,36,0.25);background:rgba(251,191,36,0.06);color:#fbbf24;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;transition:all 0.15s; }
        .cp-qty-btn:hover { background:rgba(251,191,36,0.15); }
        .cp-qty-num { font-size:14px;font-weight:600;color:#f0ece4;min-width:20px;text-align:center; }
        .cp-item-total { font-size:13px;font-weight:600;color:#fbbf24;min-width:52px;text-align:right; }
        .cp-remove { background:none;border:none;cursor:pointer;color:rgba(240,236,228,0.2);transition:color 0.15s;padding:4px; }
        .cp-remove:hover { color:#f87171; }

        /* Address form */
        .cp-form { padding:20px; }
        .cp-field { margin-bottom:16px; }
        .cp-label { display:block;font-size:11px;font-weight:600;letter-spacing:0.07em;color:rgba(240,236,228,0.4);margin-bottom:6px; }
        .cp-input { width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#f0ece4;font-family:inherit;outline:none;transition:border 0.2s; }
        .cp-input:focus { border-color:rgba(251,191,36,0.4);background:rgba(251,191,36,0.03); }
        .cp-grid2 { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
        .cp-row { display:flex;gap:10px;margin-top:20px; }

        /* Summary sidebar */
        .cp-summary { background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;position:sticky;top:20px; }
        .cp-summary-title { font-size:13px;font-weight:700;letter-spacing:0.06em;color:rgba(240,236,228,0.5);margin-bottom:16px; }
        .cp-summary-row { display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:6px 0; }
        .cp-summary-row.total { border-top:1px solid rgba(255,255,255,0.08);margin-top:10px;padding-top:14px;font-size:17px;font-weight:700;color:#fbbf24; }
        .cp-summary-label { color:rgba(240,236,228,0.45); }
        .cp-summary-val { color:#f0ece4; }

        /* Buttons */
        .cp-btn-primary { width:100%;padding:14px;background:linear-gradient(135deg,#f59e0b,#fbbf24);border:none;border-radius:12px;font-size:14px;font-weight:700;color:#0f1117;cursor:pointer;font-family:inherit;margin-top:16px;transition:opacity 0.2s; }
        .cp-btn-primary:disabled { opacity:0.4;cursor:not-allowed; }
        .cp-btn-primary:not(:disabled):hover { opacity:0.9; }
        .cp-btn-ghost { flex:1;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:13px;color:rgba(240,236,228,0.5);cursor:pointer;font-family:inherit;transition:all 0.2s; }
        .cp-btn-ghost:hover { background:rgba(255,255,255,0.07);color:#f0ece4; }
        .cp-pay-summary { display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.15);border-radius:10px;padding:12px 16px; }
        .cp-pay-label { font-size:13px;color:rgba(240,236,228,0.6); }
        .cp-pay-val { font-size:20px;font-weight:700;color:#fbbf24; }
        .cp-secure-text { text-align:center;font-size:11px;color:rgba(240,236,228,0.25);margin-top:12px; }

        /* ════════════ LIGHT THEME ════════════ */
        .cp-root.light { background:#f8fafc; color:#0f172a; }
        .cp-root.light .cp-back { color:#64748b; }
        .cp-root.light .cp-back:hover { color:#0f172a; }
        .cp-root.light .cp-subtitle { color:#64748b; }
        .cp-root.light .cp-step-circle.todo { background:#f1f5f9; color:#94a3b8; }
        .cp-root.light .cp-step-label.todo { color:#94a3b8; }
        .cp-root.light .cp-step-line { background:rgba(203,213,225,0.6); }
        .cp-root.light .cp-card { background:#ffffff; border-color:rgba(203,213,225,0.6); box-shadow:0 4px 12px rgba(0,0,0,0.03); }
        .cp-root.light .cp-card-header { border-bottom-color:rgba(203,213,225,0.6); color:#475569; }
        .cp-root.light .cp-item { border-bottom-color:rgba(203,213,225,0.6); }
        .cp-root.light .cp-item:hover { background:#f8fafc; }
        .cp-root.light .cp-item-name { color:#0f172a; }
        .cp-root.light .cp-item-price { color:#475569; }
        .cp-root.light .cp-qty-num { color:#0f172a; }
        .cp-root.light .cp-item-total { color:#d97706; }
        .cp-root.light .cp-remove { color:#94a3b8; }
        .cp-root.light .cp-remove:hover { color:#ef4444; }
        .cp-root.light .cp-label { color:#475569; }
        .cp-root.light .cp-input { background:#f8fafc; border-color:rgba(203,213,225,0.6); color:#0f172a; }
        .cp-root.light .cp-input:focus { border-color:rgba(217,119,6,0.4); background:#ffffff; }
        .cp-root.light .cp-summary { background:#ffffff; border-color:rgba(203,213,225,0.6); box-shadow:0 4px 12px rgba(0,0,0,0.03); }
        .cp-root.light .cp-summary-title { color:#475569; }
        .cp-root.light .cp-summary-label { color:#475569; }
        .cp-root.light .cp-summary-val { color:#0f172a; }
        .cp-root.light .cp-summary-row.total { border-top-color:rgba(203,213,225,0.6); color:#d97706; }
        .cp-root.light .cp-btn-ghost { background:#f1f5f9; border-color:rgba(203,213,225,0.6); color:#475569; }
        .cp-root.light .cp-btn-ghost:hover { background:#e2e8f0; color:#0f172a; }
        .cp-root.light .cp-empty { color:#64748b; }
        .cp-root.light .cp-pay-summary { background:#fffbeb; border-color:rgba(252,211,77,0.4); }
        .cp-root.light .cp-pay-label { color:#64748b; }
        .cp-root.light .cp-pay-val { color:#d97706; }
        .cp-root.light .cp-secure-text { color:#94a3b8; }
        .cp-root.light .cp-done-text { color:#475569 !important; }
        .cp-root.light .cp-done-subtext { color:#64748b !important; }
      `}</style>

      <div className={`cp-root${!isDark ? " light" : ""}`}>
        <div className="cp-header">
          <button className="cp-back" onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}>
            ← {step > 0 ? "Back" : "Back to Restaurant"}
          </button>
          <h1 className="cp-title">
            {step === 0 ? "Your Cart" : step === 1 ? "Delivery Details" : "Review & Pay"}
          </h1>
          <p className="cp-subtitle">
            {restaurantName && `From ${restaurantName}`}
            {items.length > 0 && ` · ${items.reduce((s, i) => s + i.quantity, 0)} items`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="cp-steps">
          {STEPS.map((label, idx) => {
            const state = idx < step ? "done" : idx === step ? "active" : "todo";
            return (
              <>
                <div className="cp-step" key={label}>
                  <div className={`cp-step-circle ${state}`}>
                    {state === "done" ? "✓" : idx + 1}
                  </div>
                  <span className={`cp-step-label ${state}`}>{label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`cp-step-line${idx < step ? " done" : ""}`} key={`line-${idx}`} />
                )}
              </>
            );
          })}
        </div>

        {items.length === 0 && step === 0 ? (
          <div className="cp-layout">
            <div className="cp-empty">
              <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>Your cart is empty</p>
              <button onClick={() => navigate("/restaurants")} className="cp-btn-primary" style={{ marginTop: 20, width: "auto" }}>
                Browse Restaurants →
              </button>
            </div>
          </div>
        ) : (
          <div className="cp-layout">
            {/* Left column */}
            <div>
              {/* STEP 0 — Cart items */}
              {step === 0 && (
                <div className="cp-card">
                  <div className="cp-card-header">ITEMS ({items.reduce((s, i) => s + i.quantity, 0)})</div>
                  {items.map(item => {
                    const discounted = item.offer > 0
                      ? Math.round(item.price * (1 - item.offer / 100))
                      : item.price;
                    return (
                      <div key={item._id} className="cp-item">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="cp-item-img" />
                          : <div className="cp-item-img-ph">🍱</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cp-item-name">
                            <span
                              className="cp-item-badge"
                              style={{
                                borderColor: item.isVeg ? "#10b981" : "#ef4444",
                                background: item.isVeg ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                              }}
                            />
                            {item.name}
                          </div>
                          <div className="cp-item-price">
                            ₹{discounted}
                            {item.offer > 0 && (
                              <span style={{ textDecoration: "line-through", marginLeft: 6, fontSize: 11, color: "rgba(240,236,228,0.3)" }}>
                                ₹{item.price}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="cp-qty">
                          <button className="cp-qty-btn" onClick={() => updateQty(item._id, item.quantity - 1)}>−</button>
                          <span className="cp-qty-num">{item.quantity}</span>
                          <button className="cp-qty-btn" onClick={() => updateQty(item._id, item.quantity + 1)}>+</button>
                        </div>
                        <span className="cp-item-total">₹{(discounted * item.quantity).toFixed(0)}</span>
                        <button className="cp-remove" onClick={() => removeItem(item._id)} title="Remove">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 1 — Delivery address */}
              {step === 1 && (
                <div className="cp-card">
                  <div className="cp-card-header">DELIVERY ADDRESS</div>
                  <div className="cp-form">
                    <div className="cp-grid2">
                      <div className="cp-field">
                        <label className="cp-label">FULL NAME *</label>
                        <input className="cp-input" name="fullName" placeholder="Your name"
                          value={delivery.fullName} onChange={handleDeliveryChange} />
                      </div>
                      <div className="cp-field">
                        <label className="cp-label">PHONE *</label>
                        <input className="cp-input" name="phone" placeholder="+91 XXXXX XXXXX"
                          value={delivery.phone} onChange={handleDeliveryChange} />
                      </div>
                    </div>
                    <div className="cp-field">
                      <label className="cp-label">ADDRESS LINE 1 *</label>
                      <input className="cp-input" name="addressLine1" placeholder="Flat / House no, Building"
                        value={delivery.addressLine1} onChange={handleDeliveryChange} />
                    </div>
                    <div className="cp-field">
                      <label className="cp-label">ADDRESS LINE 2</label>
                      <input className="cp-input" name="addressLine2" placeholder="Street, Area (optional)"
                        value={delivery.addressLine2} onChange={handleDeliveryChange} />
                    </div>
                    <div className="cp-grid2">
                      <div className="cp-field">
                        <label className="cp-label">CITY *</label>
                        <input className="cp-input" name="city" placeholder="City"
                          value={delivery.city} onChange={handleDeliveryChange} />
                      </div>
                      <div className="cp-field">
                        <label className="cp-label">STATE *</label>
                        <input className="cp-input" name="state" placeholder="State"
                          value={delivery.state} onChange={handleDeliveryChange} />
                      </div>
                    </div>
                    <div className="cp-grid2">
                      <div className="cp-field">
                        <label className="cp-label">PINCODE *</label>
                        <input className="cp-input" name="pincode" placeholder="6-digit pincode"
                          value={delivery.pincode} onChange={handleDeliveryChange} />
                      </div>
                      <div className="cp-field">
                        <label className="cp-label">LANDMARK</label>
                        <input className="cp-input" name="landmark" placeholder="Nearby landmark"
                          value={delivery.landmark} onChange={handleDeliveryChange} />
                      </div>
                    </div>
                    <div className="cp-field">
                      <label className="cp-label">DELIVERY SLOT</label>
                      <select className="cp-input" name="deliverySlot" value={delivery.deliverySlot} onChange={handleDeliveryChange}
                        style={{ appearance: "none" }}>
                        <option value="ASAP">ASAP (30-45 mins)</option>
                        <option value="Scheduled">Schedule for later</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 — Review + Pay */}
              {step === 2 && (
                <>
                  {/* Order Summary */}
                  <div className="cp-card" style={{ marginBottom: 20 }}>
                    <div className="cp-card-header">ORDER SUMMARY</div>
                    {items.map(item => {
                      const disc = item.offer > 0 ? Math.round(item.price * (1 - item.offer / 100)) : item.price;
                      return (
                        <div key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <span style={{ color: "rgba(240,236,228,0.7)" }}>{item.name} × {item.quantity}</span>
                          <span style={{ color: "#fbbf24", fontWeight: 600 }}>₹{(disc * item.quantity).toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Delivery address summary */}
                  <div className="cp-card" style={{ marginBottom: 20 }}>
                    <div className="cp-card-header">DELIVERING TO</div>
                    <div style={{ padding: "14px 20px", fontSize: 13, lineHeight: 1.7 }}>
                      <div style={{ fontWeight: 600, color: "#f0ece4", marginBottom: 4 }}>{delivery.fullName}</div>
                      <div style={{ color: "rgba(240,236,228,0.5)" }}>
                        {delivery.addressLine1}{delivery.addressLine2 && `, ${delivery.addressLine2}`},
                        {" "}{delivery.city}, {delivery.state} — {delivery.pincode}
                      </div>
                      <div style={{ color: "rgba(240,236,228,0.4)", marginTop: 4 }}>📞 {delivery.phone}</div>
                    </div>
                  </div>

                  {/* Stripe payment */}
                  <div className="cp-card">
                    <div className="cp-card-header">PAYMENT</div>
                    <div style={{ padding: 20 }}>
                      <Elements stripe={stripePromise}>
                        <PaymentForm
                          amount={grandTotal}
                          restaurantId={restaurantId!}
                          items={cartItems}
                          deliveryDetails={delivery}
                          onSuccess={() => setOrderDone(true)}
                          isDark={isDark}
                        />
                      </Elements>
                    </div>
                  </div>
                </>
              )}

              {/* Navigation buttons (steps 0 and 1) */}
              {step < 2 && (
                <div className="cp-row">
                  {step > 0 && (
                    <button className="cp-btn-ghost" onClick={() => setStep(s => s - 1)}>
                      ← Back
                    </button>
                  )}
                  <button
                    className="cp-btn-primary"
                    disabled={step === 1 && !deliveryValid}
                    onClick={() => {
                      if (!isLoggedIn) { toast.error("Please login to continue"); return; }
                      if (step === 0 && items.length === 0) { toast.error("Cart is empty"); return; }
                      setStep(s => s + 1);
                    }}
                  >
                    {step === 0 ? "Continue to Delivery →" : "Continue to Payment →"}
                  </button>
                </div>
              )}
            </div>

            {/* Right — Order summary sidebar */}
            <div className="cp-summary">
              <div className="cp-summary-title">BILL DETAILS</div>

              <div className="cp-summary-row">
                <span className="cp-summary-label">Item Total</span>
                <span className="cp-summary-val">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="cp-summary-row">
                <span className="cp-summary-label">Delivery Fee</span>
                <span className="cp-summary-val">₹{deliveryFee}</span>
              </div>
              <div className="cp-summary-row">
                <span className="cp-summary-label">Platform Fee</span>
                <span className="cp-summary-val">₹{platformFee}</span>
              </div>

              <div className="cp-summary-row total">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              {items.length > 0 && (
                <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>FROM</div>
                  <div style={{ fontSize: 13, color: "#f0ece4", fontWeight: 600 }}>{restaurantName}</div>
                  <div style={{ fontSize: 11, color: "rgba(240,236,228,0.35)", marginTop: 2 }}>
                    {items.reduce((s, i) => s + i.quantity, 0)} items
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}


