import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import OrderModal from "./OrderModal";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Restaurant {
  _id: string; name: string; description: string;
  address: string; city: string; cuisineTypes: string[];
  openingTime: string; closingTime: string;
  rating: number; priceRange: string; image: string;
  isActive: boolean; phoneNumber: string;
}
interface FoodItem {
  _id: string; name: string; description: string;
  price: number; offer: number; category: string;
  isVeg: boolean; spicyLevel: string; isAvailable: boolean; image: string;
}
interface Slot { slot: string; available: boolean; }
interface Review {
  _id: string; rating: number; comment: string; createdAt: string;
  user: { _id: string; name: string; picture?: string };
}

const CATEGORIES = ["Starter","Main Course","Dessert","Beverage","Snacks","Breads","Rice & Biryani","Other"];
const DURATIONS = [
  { mins: 60, label: "1 hr" },
  { mins: 90, label: "1.5 hrs" },
  { mins: 120, label: "2 hrs" },
  { mins: 150, label: "2.5 hrs" }
];

const parseTime = (timeStr: string) => {
  if (!timeStr) return 0;
  const hm = timeStr.replace(/(AM|PM)/i, "").trim().split(":");
  let h = parseInt(hm[0] || "0", 10);
  const m = parseInt(hm[1] || "0", 10);
  if (timeStr.toUpperCase().includes("PM") && h < 12) h += 12;
  if (timeStr.toUpperCase().includes("AM") && h === 12) h = 0;
  return h * 60 + m;
};

const isOpenNow = (opening: string, closing: string) => {
  if (!opening || !closing) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(opening);
  const end = parseTime(closing);
  if (end < start) return cur >= start || cur <= end;
  return cur >= start && cur <= end;
};

const today = () => new Date().toISOString().split("T")[0];

const buildSlotWithDuration = (startSlot: string, durationMins: number) => {
  if (!startSlot) return "";
  const startPiece = startSlot.split(" - ")[0]; // e.g., "10:00" or "10:00 AM" depending on slot format
  let hm = startPiece;
  if (hm.includes("AM") || hm.includes("PM")) {
    hm = hm.replace(/(AM|PM)/, "").trim(); 
  }
  const parts = hm.split(":");
  let h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  
  if (startPiece.includes("PM") && h < 12) h += 12;
  if (startPiece.includes("AM") && h === 12) h = 0;

  const totalMins = h * 60 + m + durationMins;
  let endH = Math.floor(totalMins / 60);
  const endM = totalMins % 60;
  
  const endAmPm = endH >= 24 ? "AM" : endH >= 12 ? "PM" : "AM";
  if (endH >= 24) endH -= 24;
  let endH12 = endH % 12;
  if (endH12 === 0) endH12 = 12;

  return `${startPiece} - ${endH12}:${endM === 0 ? "00" : endM} ${endAmPm}`;
};

function TablePaymentForm({ amount, onSuccess, onCancel }: { amount: number, onSuccess: () => void, onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    
    try {
      const intentRes = await api.post("/payments/create-intent", { amount }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const { clientSecret } = intentRes.data;
      if (!clientSecret) throw new Error("Payment setup failed");

      const cardElt = elements.getElement(CardElement);
      if (!cardElt) throw new Error("Card element not found");

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElt }
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        await onSuccess();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Payment failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12, border: "1px solid rgba(251,191,36,0.3)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "rgba(240,236,228,0.6)", marginBottom: 8 }}>Card Details</div>
        <div style={{ padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
          <CardElement options={{ style: { base: { color: "#f0ece4", iconColor: "#fbbf24", "::placeholder": { color: "rgba(240,236,228,0.3)" } } } }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", color: "rgba(240,236,228,0.6)", cursor: "pointer" }}>Cancel</button>
        <button type="submit" disabled={!stripe || loading} style={{ flex: 1, padding: 12, borderRadius: 8, background: "linear-gradient(135deg,#d97706,#fbbf24)", color: "#000", fontWeight: "bold", border: "none", cursor: loading ? "wait" : "pointer" }}>
          {loading ? "Processing..." : `Pay ₹${amount}`}
        </button>
      </div>
    </form>
  );
}

export default function RestaurantDetail() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const { isLoggedIn } = useAuth();
  const { isDark } = useTheme();
  const { clearAndAdd } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foodItems,  setFoodItems]  = useState<FoodItem[]>([]);
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);
  
  const [vegFilter,  setVegFilter]  = useState<"all"|"veg"|"nonveg">("all");
  const [foodSearch, setFoodSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Cart conflict modal
  const [cartConflict, setCartConflict] = useState<{ item: FoodItem; fromRestaurant: string } | null>(null);
  
  // Order modal
  const [orderModal, setOrderModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Booking modal
  const [showBooking,  setShowBooking]  = useState(false);
  const [bookDate,     setBookDate]     = useState(today());
  const [slots,        setSlots]        = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [guests,       setGuests]       = useState(2);
  const [specialReq,   setSpecialReq]   = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking,      setBooking]      = useState(false);
  const [bookingDone,  setBookingDone]  = useState(false);
  
  const [payMode, setPayMode] = useState<"venue"|"now">("venue");
  // Removed unused showPayForm
  const ADVANCE_AMOUNT = 500;

  // Review submission
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/restaurants/${id}`)
      .then(res => {
        setRestaurant(res.data.restaurant);
        setFoodItems(res.data.foodItems || []);
      })
      .catch(() => toast.error("Failed to load restaurant"))
      .finally(() => setLoading(false));
      
    fetchReviews();
  }, [id]);

  const fetchReviews = () => {
    api.get(`/reviews/${id}`)
      .then(res => setReviews(res.data.reviews || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!showBooking || !id || !bookDate) return;
    setSlotsLoading(true);
    setSelectedSlot("");
    const token = localStorage.getItem("token");
    api.get(`/bookings/slots/${id}?date=${bookDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setSlots(res.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [bookDate, showBooking, id]);

  const handleBook = async (statusOverride = "pending") => {
    if (!isLoggedIn) { toast.error("Please login to book a table"); return; }
    if (!selectedSlot) { toast.error("Please select a time slot"); return; }
    setBooking(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/bookings", {
        restaurantId:   id,
        date:           bookDate,
        timeSlot:       buildSlotWithDuration(selectedSlot, selectedDuration),
        guests,
        specialRequest: specialReq,
        status:         statusOverride,
        paymentStatus:  statusOverride === "paid" ? "paid" : "pending"
      }, { headers: { Authorization: `Bearer ${token}` } });
      setBookingDone(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const submitReview = async () => {
    if (!isLoggedIn) { toast.error("Please login to review"); return; }
    if (!reviewComment.trim()) { toast.error("Please write a comment"); return; }
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/reviews", {
        restaurantId: id,
        rating: reviewRating,
        comment: reviewComment
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Review uploaded successfully!");
      setReviewComment("");
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload the review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleFoodClick = (f: FoodItem) => {
    if (!isLoggedIn) { toast.error("Please login to order"); return; }
    setSelectedFood(f);
    setOrderModal(true);
  };

  const confirmAddToCart = (item: FoodItem) => {
    clearAndAdd({
      _id: item._id,
      name: item.name,
      price: item.price,
      offer: item.offer,
      image: item.image,
      isVeg: item.isVeg,
      restaurantId: restaurant?._id || "",
      restaurantName: restaurant?.name || "",
    });
    setCartConflict(null);
    toast.success(`${item.name} added to new cart!`);
  };

  const filteredFood = foodItems
    .filter(f => f.isAvailable)
    .filter(f => vegFilter === "all" ? true : vegFilter === "veg" ? f.isVeg : !f.isVeg)
    .filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase()))
    .filter(f => activeCategory === "All" || f.category === activeCategory);

  const groupedFood = CATEGORIES.reduce((acc, cat) => {
    const items = filteredFood.filter(f => f.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, FoodItem[]>);

  const usedCategories = ["All", ...CATEGORIES.filter(c => foodItems.some(f => f.category === c))];

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#080a0e",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:"'DM Sans',sans-serif"}}>
      <div className="rd-spinner" style={{width:44,height:44}}/>
      <div style={{fontSize:13,color:"rgba(240,236,228,0.4)",letterSpacing:"0.1em"}}>Loading Restaurant...</div>
    </div>
  );

  if (!restaurant) return null;

  const open = isOpenNow(restaurant.openingTime, restaurant.closingTime);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes rd-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rd-spin{to{transform:rotate(360deg)}}
        @keyframes rd-modal{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}

        .rd-root{min-height:100vh;background:#080a0e;color:#f0ece4;font-family:'DM Sans',sans-serif;padding-bottom:80px}
        .rd-hero{position:relative;height:420px;overflow:hidden}
        .rd-hero-img{width:100%;height:100%;object-fit:cover;filter:brightness(0.45)}
        .rd-hero-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#111827,#1f2937);display:flex;align-items:center;justify-content:center;font-size:80px;filter:brightness(0.6)}
        .rd-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,#080a0e 0%,rgba(8,10,14,0.4) 60%,transparent 100%)}
        .rd-hero-content{position:absolute;bottom:0;left:0;right:0;padding:40px}

        .rd-back{position:absolute;top:24px;left:24px;z-index:10;display:flex;align-items:center;gap:8px;background:rgba(8,10,14,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 16px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:rgba(240,236,228,0.7);transition:all 0.2s;backdrop-filter:blur(20px)}
        .rd-back:hover{border-color:rgba(251,191,36,0.3);color:#fbbf24}

        .rd-info{padding:0 40px;margin-top:-20px;position:relative;z-index:2}
        .rd-name{font-family:'Playfair Display',serif;font-size:clamp(28px,4vw,44px);font-weight:700;color:#f0ece4;margin-bottom:10px;line-height:1.2}
        .rd-meta{display:flex;flex-wrap:wrap;align-items:center;gap:16px;margin-bottom:20px}
        .rd-badge{padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.06em}
        .rd-open{background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#10b981}
        .rd-closed{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);color:#f87171}
        .rd-price{background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);color:#fbbf24;font-family:'Playfair Display',serif}
        .rd-rating{display:flex;align-items:center;gap:5px;font-size:14px;font-weight:600;color:#fbbf24}
        .rd-desc{font-size:14px;color:rgba(240,236,228,0.5);line-height:1.7;max-width:600px;margin-bottom:24px}
        .rd-details{display:flex;flex-wrap:wrap;gap:24px;padding:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;margin-bottom:24px}
        .rd-detail{display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(240,236,228,0.55)}
        .rd-detail svg{color:rgba(251,191,36,0.6);flex-shrink:0}

        .rd-book-btn{display:flex;align-items:center;gap:10px;padding:14px 32px;background:linear-gradient(135deg,#d97706,#fbbf24);border:none;border-radius:14px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;color:#080a0e;transition:all 0.25s;box-shadow:0 8px 32px rgba(251,191,36,0.3)}
        .rd-book-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(251,191,36,0.45)}
        .rd-book-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none}

        .rd-divider{height:1px;background:rgba(255,255,255,0.06);margin:32px 40px}

        .rd-menu{padding:0 40px}
        .rd-menu-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:600;color:#f0ece4;margin-bottom:20px}
        .rd-menu-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px}
        .rd-menu-search{flex:1;min-width:200px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 16px;font-family:'DM Sans',sans-serif;font-size:13px;color:#f0ece4;outline:none;}
        .rd-menu-search:focus{border-color:rgba(251,191,36,0.3)}
        .rd-veg-pill{padding:8px 16px;border-radius:20px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;transition:all 0.2s}
        .rd-veg-pill.all{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(240,236,228,0.5)}
        .rd-veg-pill.all.active{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:#f0ece4}
        .rd-veg-pill.veg{background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);color:rgba(16,185,129,0.6)}
        .rd-veg-pill.veg.active{background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.4);color:#10b981}
        .rd-veg-pill.nonveg{background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.12);color:rgba(239,68,68,0.5)}
        .rd-veg-pill.nonveg.active{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);color:#f87171}

        .rd-cat-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
        .rd-cat-tab{padding:6px 14px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:rgba(240,236,228,0.4)}
        .rd-cat-tab.active{background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.3);color:#fbbf24}
        .rd-cat-section{margin-bottom:36px}
        .rd-cat-name{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:rgba(240,236,228,0.6);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06)}

        .rd-food-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .rd-food-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden;transition:all 0.25s;display:flex;flex-direction:column;cursor:pointer}
        .rd-food-card:hover{border-color:rgba(251,191,36,0.2);transform:translateY(-2px);background:rgba(255,255,255,0.05)}
        .rd-food-img{width:100%;height:140px;object-fit:cover}
        .rd-food-img-ph{width:100%;height:140px;background:linear-gradient(135deg,#111827,#1f2937);display:flex;align-items:center;justify-content:center;font-size:36px}
        .rd-food-body{padding:14px;flex:1;display:flex;flex-direction:column}
        .rd-food-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px}
        .rd-food-name{font-size:14px;font-weight:600;color:#f0ece4;line-height:1.3}
        .rd-food-dot{width:14px;height:14px;border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px}
        .rd-food-desc{font-size:11px;color:rgba(240,236,228,0.38);line-height:1.5;margin-bottom:10px;flex:1}
        .rd-food-footer{display:flex;align-items:center;justify-content:space-between}
        .rd-food-price{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:#fbbf24}
        .rd-food-offer{font-size:10px;color:#10b981;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:2px 7px}

        .rd-modal-overlay{position:fixed;inset:0;z-index:200;background:rgba(4,2,12,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px}
        .rd-modal{background:#0d1117;border:1px solid rgba(251,191,36,0.2);border-radius:24px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;animation:rd-modal 0.3s cubic-bezier(0.34,1.56,0.64,1) both}
        .rd-modal::-webkit-scrollbar{width:4px}
        .rd-modal::-webkit-scrollbar-thumb{background:rgba(251,191,36,0.2);border-radius:2px}
        .rd-modal-header{padding:24px 28px 0;display:flex;align-items:center;justify-content:space-between}
        .rd-modal-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:600;color:#f0ece4}
        .rd-modal-close{width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,0.06);cursor:pointer;color:rgba(240,236,228,0.5);display:flex;align-items:center;justify-content:center}
        .rd-modal-body{padding:24px 28px 28px}
        
        .rd-field{margin-bottom:18px}
        .rd-label{font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(240,236,228,0.4);margin-bottom:8px;display:block}
        .rd-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:11px 14px;font-family:'DM Sans',sans-serif;font-size:13px;color:#f0ece4;outline:none}
        .rd-input:focus{border-color:rgba(251,191,36,0.4)}
        .rd-guests{display:flex;align-items:center;gap:12px}
        .rd-guest-btn{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);cursor:pointer;color:#f0ece4;font-size:18px}
        .rd-guest-num{font-family:'Playfair Display',serif;font-size:20px;font-weight:600}

        .rd-slots{display:flex;flex-wrap:wrap;gap:8px}
        .rd-slot{padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;font-size:12px;color:rgba(240,236,228,0.5)}
        .rd-slot:hover{border-color:rgba(251,191,36,0.3);color:rgba(240,236,228,0.8)}
        .rd-slot.selected{background:rgba(251,191,36,0.15);border-color:rgba(251,191,36,0.5);color:#fbbf24}
        .rd-slot.unavailable{opacity:0.3;cursor:not-allowed;text-decoration:line-through}
        
        .rd-pay-toggle{display:flex;gap:8px;margin-bottom:12px;background:rgba(255,255,255,0.03);padding:4px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)}
        .rd-pay-opt{flex:1;padding:10px;border:none;background:transparent;border-radius:8px;color:rgba(240,236,228,0.5);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s}
        .rd-pay-opt.active{background:rgba(255,255,255,0.08);color:#f0ece4}

        .rd-confirm-btn{width:100%;padding:14px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#d97706,#fbbf24);color:#080a0e;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px}
        .rd-confirm-btn:disabled{opacity:0.6;cursor:wait}
        .rd-spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(8,10,14,0.3);border-top-color:#080a0e;animation:rd-spin 0.7s linear infinite;display:inline-block}

        /* Reviews */
        .rd-reviews{padding:0 40px;margin-top:40px}
        .rd-review-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:16px}
        .rd-review-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .rd-review-user{display:flex;align-items:center;gap:12px}
        .rd-review-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;justify-content:center;align-items:center;font-weight:bold}
        .rd-review-form{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:32px}

        /* ════════════ LIGHT THEME ════════════ */
        .rd-root.light { background:#f8fafc; color:#0f172a; }
        .rd-root.light .rd-hero-placeholder { background:linear-gradient(135deg,#f1f5f9,#e2e8f0); }
        .rd-root.light .rd-hero-overlay { background:linear-gradient(to top,#f8fafc 0%,rgba(248,250,252,0.6) 60%,transparent 100%); }
        .rd-root.light .rd-name { color:#0f172a; }
        .rd-root.light .rd-desc { color:#475569; }
        .rd-root.light .rd-details { background:rgba(255,255,255,0.7); border-color:rgba(203,213,225,0.6); }
        .rd-root.light .rd-detail { color:#475569; }
        .rd-root.light .rd-menu-title { color:#0f172a; }
        .rd-root.light .rd-cat-name { color:#475569; border-bottom-color:rgba(203,213,225,0.5); }
        .rd-root.light .rd-divider { background:rgba(203,213,225,0.5); }
        .rd-root.light .rd-back { background:rgba(255,255,255,0.8); border-color:rgba(203,213,225,0.6); color:#475569; box-shadow:0 4px 12px rgba(0,0,0,0.05); }
        .rd-root.light .rd-back:hover { border-color:rgba(217,119,6,0.3); color:#d97706; }

        .rd-root.light .rd-menu-search { background:rgba(255,255,255,0.6); border-color:rgba(203,213,225,0.6); color:#0f172a; }
        .rd-root.light .rd-menu-search:focus { border-color:rgba(217,119,6,0.4); background:#ffffff; box-shadow:0 0 0 3px rgba(217,119,6,0.1); }
        .rd-root.light .rd-veg-pill.all { background:#ffffff; border-color:rgba(203,213,225,0.6); color:#64748b; }
        .rd-root.light .rd-veg-pill.all.active { background:#f1f5f9; border-color:rgba(148,163,184,0.6); color:#0f172a; }
        .rd-root.light .rd-veg-pill.veg { background:#ffffff; border-color:rgba(203,213,225,0.6); color:#10b981; }
        .rd-root.light .rd-veg-pill.veg.active { background:#d1fae5; border-color:rgba(5,150,105,0.3); color:#047857; }
        .rd-root.light .rd-veg-pill.nonveg { background:#ffffff; border-color:rgba(203,213,225,0.6); color:#f87171; }
        .rd-root.light .rd-veg-pill.nonveg.active { background:#fee2e2; border-color:rgba(220,38,38,0.3); color:#b91c1c; }
        .rd-root.light .rd-cat-tab { background:#ffffff; border-color:rgba(203,213,225,0.6); color:#64748b; }
        .rd-root.light .rd-cat-tab.active { background:#fef3c7; border-color:rgba(217,119,6,0.3); color:#b45309; }
        
        .rd-root.light .rd-food-card { background:#ffffff; border-color:rgba(203,213,225,0.6); box-shadow:0 4px 12px rgba(0,0,0,0.03); }
        .rd-root.light .rd-food-card:hover { border-color:rgba(217,119,6,0.25); background:#fafafa; box-shadow:0 12px 24px rgba(0,0,0,0.08); }
        .rd-root.light .rd-food-img-ph { background:linear-gradient(135deg,#f1f5f9,#e2e8f0); }
        .rd-root.light .rd-food-name { color:#0f172a; }
        .rd-root.light .rd-food-desc { color:#64748b; }

        .rd-root.light .rd-review-card { background:#ffffff; border-color:rgba(203,213,225,0.6); }
        .rd-root.light .rd-review-form { background:#ffffff; border-color:rgba(203,213,225,0.6); }
        .rd-root.light .rd-review-user { color:#0f172a; }
        .rd-root.light .rd-review-avatar { background:#f1f5f9; color:#475569; }

        .rd-root.light .rd-modal-overlay { background:rgba(248,250,252,0.85); }
        .rd-root.light .rd-modal { background:#ffffff; border-color:rgba(217,119,6,0.2); box-shadow:0 24px 60px rgba(0,0,0,0.1); }
        .rd-root.light .rd-modal-title { color:#0f172a; }
        .rd-root.light .rd-modal-close { background:#f1f5f9; color:#64748b; }
        .rd-root.light .rd-label { color:#64748b; }
        .rd-root.light .rd-input { background:#f8fafc; border-color:rgba(203,213,225,0.6); color:#0f172a; }
        .rd-root.light .rd-input:focus { border-color:rgba(217,119,6,0.4); background:#ffffff; box-shadow:0 0 0 3px rgba(217,119,6,0.1); }
        .rd-root.light .rd-guest-btn { background:#f1f5f9; border-color:rgba(203,213,225,0.6); color:#0f172a; }
        .rd-root.light .rd-guest-num { color:#0f172a; }
        .rd-root.light .rd-slot { background:#ffffff; border-color:rgba(203,213,225,0.6); color:#475569; }
        .rd-root.light .rd-slot:hover { border-color:rgba(217,119,6,0.3); color:#d97706; }
        .rd-root.light .rd-slot.selected { background:#fef3c7; border-color:rgba(217,119,6,0.4); color:#b45309; }
        .rd-root.light .rd-pay-toggle { background:#f1f5f9; border-color:rgba(203,213,225,0.6); }
        .rd-root.light .rd-pay-opt { color:#64748b; }
        .rd-root.light .rd-pay-opt.active { background:#ffffff; color:#0f172a; box-shadow:0 2px 4px rgba(0,0,0,0.05); }
      `}</style>

      <div className={`rd-root${!isDark ? " light" : ""}`}>
        <button className="rd-back" onClick={() => navigate("/restaurants")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          All Restaurants
        </button>

        <div className="rd-hero">
          {restaurant.image ? <img src={restaurant.image} className="rd-hero-img" alt=""/> : <div className="rd-hero-placeholder">🍽️</div>}
          <div className="rd-hero-overlay"/>
          <div className="rd-hero-content">
            <div className="rd-meta">
              <span className={`rd-badge ${open ? "rd-open" : "rd-closed"}`}>{open ? "● Open Now" : "● Closed"}</span>
              <span className="rd-badge rd-price">{restaurant.priceRange}</span>
              {restaurant.rating > 0 && <span className="rd-rating">★ {restaurant.rating.toFixed(1)}</span>}
            </div>
            <h1 className="rd-name">{restaurant.name}</h1>
          </div>
        </div>

        <div className="rd-info" style={{animation:"rd-fadeUp 0.5s ease both"}}>
          {restaurant.description && <p className="rd-desc">{restaurant.description}</p>}
          <div className="rd-details">
            <div className="rd-detail">📍 {restaurant.address}, {restaurant.city}</div>
            <div className="rd-detail">🕒 {restaurant.openingTime} – {restaurant.closingTime}</div>
            {restaurant.phoneNumber && <div className="rd-detail">📞 {restaurant.phoneNumber}</div>}
            {restaurant.cuisineTypes.length > 0 && <div className="rd-detail">🍳 {restaurant.cuisineTypes.join(", ")}</div>}
          </div>

          <button className="rd-book-btn" disabled={!open} onClick={() => {
            if (!isLoggedIn) { toast.error("Please login to book a table"); return; }
            setShowBooking(true);
            setBookingDone(false);
          }}>
            Reserve a Table
          </button>
        </div>

        <div className="rd-divider"/>

        <div className="rd-menu" style={{animation:"rd-fadeUp 0.6s ease 0.1s both"}}>
          <div className="rd-menu-title">Menu</div>
          {foodItems.length === 0 ? (
            <div style={{color:"rgba(255,255,255,0.3)"}}>No menu items available</div>
          ) : (
            <>
              <div className="rd-menu-controls">
                <input className="rd-menu-search" placeholder="Search menu..." value={foodSearch} onChange={e => setFoodSearch(e.target.value)}/>
                {[{key:"all",label:"All"},{key:"veg",label:"🟢 Veg"},{key:"nonveg",label:"🔴 Non-Veg"}].map(v => (
                  <button key={v.key} className={`rd-veg-pill ${v.key}${vegFilter===v.key?" active":""}`} onClick={()=>setVegFilter(v.key as any)}>{v.label}</button>
                ))}
              </div>
              <div className="rd-cat-tabs">
                {usedCategories.map(cat => (
                  <button key={cat} className={`rd-cat-tab${activeCategory===cat?" active":""}`} onClick={()=>setActiveCategory(cat)}>{cat}</button>
                ))}
              </div>
              {Object.keys(groupedFood).length === 0 ? (
                <div style={{color:"rgba(255,255,255,0.3)"}}>No items match</div>
              ) : (
                Object.entries(groupedFood).map(([cat, items]) => (
                  <div key={cat} className="rd-cat-section">
                    <div className="rd-cat-name">{cat}</div>
                    <div className="rd-food-grid">
                      {items.map(f => (
                        <div key={f._id} className="rd-food-card" onClick={() => handleFoodClick(f)}>
                          {f.image ? <img src={f.image} className="rd-food-img" alt=""/> : <div className="rd-food-img-ph">🍱</div>}
                          <div className="rd-food-body">
                            <div className="rd-food-top">
                              <div className="rd-food-name">{f.name}</div>
                              <div className="rd-food-dot" style={{border:`2px solid ${f.isVeg?"#10b981":"#ef4444"}`}}>
                                <div style={{width:6,height:6,borderRadius:"50%",background:f.isVeg?"#10b981":"#ef4444"}}/>
                              </div>
                            </div>
                            {f.description && <div className="rd-food-desc">{f.description}</div>}
                            <div className="rd-food-footer">
                              <span className="rd-food-price">₹{f.price}</span>
                              {f.offer > 0 && <span className="rd-food-offer">{f.offer}% off</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <div className="rd-divider"/>

        <div className="rd-reviews">
          <div className="rd-menu-title">Reviews</div>
          
          <div className="rd-review-form">
            <h3 style={{fontSize:16,marginBottom:16,color:"#f0ece4"}}>Write a Review</h3>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[1,2,3,4,5].map(star => (
                <span key={star} onClick={() => setReviewRating(star)} style={{fontSize:24,cursor:"pointer",color:reviewRating>=star?"#fbbf24":"rgba(255,255,255,0.1)"}}>★</span>
              ))}
            </div>
            <textarea className="rd-input" rows={3} placeholder="Share your experience..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} style={{marginBottom:16,resize:"vertical"}}/>
            <button className="rd-book-btn" onClick={submitReview} disabled={submittingReview} style={{padding:"10px 24px",fontSize:13}}>
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>

          <div>
            {reviews.length === 0 ? (
              <div style={{color:"rgba(255,255,255,0.3)"}}>No reviews yet.</div>
            ) : (
              reviews.map(rev => (
                <div key={rev._id} className="rd-review-card">
                  <div className="rd-review-top">
                    <div className="rd-review-user">
                      <div className="rd-review-avatar">{rev.user?.name?.charAt(0) || "U"}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:"#f0ece4"}}>{rev.user?.name || "User"}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{new Date(rev.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{color:"#fbbf24",fontSize:14}}>{"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}</div>
                  </div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{rev.comment}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showBooking && (
        <div className="rd-modal-overlay" onClick={() => setShowBooking(false)}>
          <div className="rd-modal" onClick={e => e.stopPropagation()}>
            <div className="rd-modal-header">
              <div className="rd-modal-title">{bookingDone ? "🎉 Confirmed!" : "Reserve Table"}</div>
              <button className="rd-modal-close" onClick={() => setShowBooking(false)}>✕</button>
            </div>
            <div className="rd-modal-body">
              {bookingDone ? (
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{fontSize:64,marginBottom:16}}>🎊</div>
                  <div style={{fontSize:20,color:"#f0ece4",marginBottom:16}}>You're all set!</div>
                  <button onClick={() => navigate("/my-bookings")} className="rd-confirm-btn">My Bookings</button>
                </div>
              ) : (
                <>
                  <div className="rd-field">
                    <label className="rd-label">Date</label>
                    <input type="date" className="rd-input" value={bookDate} min={today()} onChange={e=>setBookDate(e.target.value)}/>
                  </div>
                  <div className="rd-field">
                    <label className="rd-label">Duration</label>
                    <div className="rd-slots">
                      {DURATIONS.map(d => (
                        <button key={d.mins} className={`rd-slot${selectedDuration===d.mins?" selected":""}`} onClick={()=>setSelectedDuration(d.mins)}>{d.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="rd-field">
                    <label className="rd-label">Time Slot</label>
                    {slotsLoading ? <div style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Loading slots...</div> : (
                      <div className="rd-slots">
                        {slots.map(s => (
                          <button key={s.slot} className={`rd-slot${selectedSlot===s.slot?" selected":""}${!s.available?" unavailable":""}`} disabled={!s.available} onClick={()=>setSelectedSlot(s.slot)}>
                            {s.slot.split(" - ")[0]}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSlot && <div style={{fontSize:12,color:"#fbbf24",marginTop:8}}>Final Slot: {buildSlotWithDuration(selectedSlot, selectedDuration)}</div>}
                  </div>
                  <div className="rd-field">
                    <label className="rd-label">Guests</label>
                    <div className="rd-guests">
                      <button className="rd-guest-btn" onClick={()=>setGuests(g=>Math.max(1,g-1))}>−</button>
                      <span className="rd-guest-num">{guests}</span>
                      <button className="rd-guest-btn" onClick={()=>setGuests(g=>Math.min(20,g+1))}>+</button>
                    </div>
                  </div>
                  <div className="rd-field">
                    <label className="rd-label">Special Request</label>
                    <textarea className="rd-input" value={specialReq} onChange={e=>setSpecialReq(e.target.value)}/>
                  </div>
                  <div className="rd-field">
                    <label className="rd-label">Payment Option</label>
                    <div className="rd-pay-toggle">
                      <button className={`rd-pay-opt${payMode==="venue"?" active":""}`} onClick={()=>setPayMode("venue")}>Pay at Venue</button>
                      <button className={`rd-pay-opt${payMode==="now"?" active":""}`} onClick={()=>setPayMode("now")}>Pay Advance (₹{ADVANCE_AMOUNT})</button>
                    </div>
                  </div>
                  
                  {payMode === "now" && selectedSlot ? (
                    <Elements stripe={stripePromise}>
                      <TablePaymentForm amount={ADVANCE_AMOUNT} onSuccess={()=>handleBook("paid")} onCancel={()=>setPayMode("venue")}/>
                    </Elements>
                  ) : (
                    <button className="rd-confirm-btn" disabled={booking || !selectedSlot} onClick={()=>handleBook("pending")}>
                      {booking ? "Confirming..." : "Confirm Booking"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {cartConflict && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={() => setCartConflict(null)}>
          <div style={{ background:"#0e1118", border:"1px solid rgba(239,68,68,0.3)", borderRadius:20, padding:32, width:380, textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:44, marginBottom:14 }}>🛒</div>
            <div style={{ fontSize:18, color:"#f0ece4", fontWeight:600, marginBottom:8 }}>Items from another restaurant</div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:24 }}>Your cart has items from <strong style={{color:"#fbbf24"}}>{cartConflict.fromRestaurant}</strong>.<br/>Starting a new cart will remove those items.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setCartConflict(null)} style={{ flex:1, padding:12, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"none", color:"white", cursor:"pointer" }}>Keep Current</button>
              <button onClick={() => confirmAddToCart(cartConflict.item)} style={{ flex:2, padding:12, borderRadius:10, background:"#ef4444", border:"none", color:"white", fontWeight:"bold", cursor:"pointer" }}>Start New Cart</button>
            </div>
          </div>
        </div>
      )}

      {restaurant && (
        <OrderModal isOpen={orderModal} onClose={() => { setOrderModal(false); setSelectedFood(null); }} restaurant={restaurant} preSelectedItem={selectedFood} isDark={isDark} />
      )}
    </>
  );
}