import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

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

const CATEGORIES = ["Starter","Main Course","Dessert","Beverage","Snacks","Breads","Rice & Biryani","Other"];

const isOpenNow = (opening: string, closing: string) => {
  if (!opening || !closing) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = opening.split(":").map(Number);
  const [ch, cm] = closing.split(":").map(Number);
  return cur >= oh * 60 + om && cur <= ch * 60 + cm;
};

const today = () => new Date().toISOString().split("T")[0];

export default function RestaurantDetail() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foodItems,  setFoodItems]  = useState<FoodItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [vegFilter,  setVegFilter]  = useState<"all"|"veg"|"nonveg">("all");
  const [foodSearch, setFoodSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Booking modal
  const [showBooking,  setShowBooking]  = useState(false);
  const [bookDate,     setBookDate]     = useState(today());
  const [slots,        setSlots]        = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [guests,       setGuests]       = useState(2);
  const [specialReq,   setSpecialReq]   = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking,      setBooking]      = useState(false);
  const [bookingDone,  setBookingDone]  = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/restaurants/${id}`)
      .then(res => {
        setRestaurant(res.data.restaurant);
        setFoodItems(res.data.foodItems || []);
      })
      .catch(() => toast.error("Failed to load restaurant"))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch slots when date changes
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

  const handleBook = async () => {
    if (!isLoggedIn) { toast.error("Please login to book a table"); return; }
    if (!selectedSlot) { toast.error("Please select a time slot"); return; }
    setBooking(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/bookings", {
        restaurantId:   id,
        date:           bookDate,
        timeSlot:       selectedSlot,
        guests,
        specialRequest: specialReq,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setBookingDone(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
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
      <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid rgba(251,191,36,0.15)",borderTopColor:"#fbbf24",animation:"spin 1s linear infinite"}}/>
      <div style={{fontSize:13,color:"rgba(240,236,228,0.4)",letterSpacing:"0.1em"}}>Loading Restaurant...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!restaurant) return (
    <div style={{minHeight:"100vh",background:"#080a0e",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>😕</div>
        <div style={{fontSize:18,color:"rgba(240,236,228,0.6)"}}>Restaurant not found</div>
        <button onClick={() => navigate("/restaurants")} style={{marginTop:16,padding:"10px 24px",background:"#fbbf24",border:"none",borderRadius:10,color:"#080a0e",fontWeight:700,cursor:"pointer"}}>Browse Restaurants</button>
      </div>
    </div>
  );

  const open = isOpenNow(restaurant.openingTime, restaurant.closingTime);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#080a0e;color:#f0ece4}
        @keyframes rd-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rd-spin{to{transform:rotate(360deg)}}
        @keyframes rd-modal{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes rd-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}

        .rd-root{min-height:100vh;background:#080a0e;font-family:'DM Sans',sans-serif;padding-bottom:80px}

        /* HERO */
        .rd-hero{position:relative;height:420px;overflow:hidden}
        .rd-hero-img{width:100%;height:100%;object-fit:cover;filter:brightness(0.45)}
        .rd-hero-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#111827,#1f2937);display:flex;align-items:center;justify-content:center;font-size:80px;filter:brightness(0.6)}
        .rd-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,#080a0e 0%,rgba(8,10,14,0.4) 60%,transparent 100%)}
        .rd-hero-content{position:absolute;bottom:0;left:0;right:0;padding:40px}

        /* BACK */
        .rd-back{position:absolute;top:24px;left:24px;z-index:10;display:flex;align-items:center;gap:8px;background:rgba(8,10,14,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 16px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:rgba(240,236,228,0.7);transition:all 0.2s;backdrop-filter:blur(20px)}
        .rd-back:hover{border-color:rgba(251,191,36,0.3);color:#fbbf24}

        /* INFO SECTION */
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

        /* BOOK BTN */
        .rd-book-btn{display:flex;align-items:center;gap:10px;padding:14px 32px;background:linear-gradient(135deg,#d97706,#fbbf24);border:none;border-radius:14px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;color:#080a0e;transition:all 0.25s;box-shadow:0 8px 32px rgba(251,191,36,0.3)}
        .rd-book-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(251,191,36,0.45)}
        .rd-book-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none}

        /* DIVIDER */
        .rd-divider{height:1px;background:rgba(255,255,255,0.06);margin:32px 40px}

        /* MENU */
        .rd-menu{padding:0 40px}
        .rd-menu-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:600;color:#f0ece4;margin-bottom:20px}
        .rd-menu-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px}
        .rd-menu-search{flex:1;min-width:200px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 16px;font-family:'DM Sans',sans-serif;font-size:13px;color:#f0ece4;outline:none;transition:border-color 0.2s}
        .rd-menu-search:focus{border-color:rgba(251,191,36,0.3)}
        .rd-menu-search::placeholder{color:rgba(240,236,228,0.25)}
        .rd-veg-pill{padding:8px 16px;border-radius:20px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;transition:all 0.2s}
        .rd-veg-pill.all{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(240,236,228,0.5)}
        .rd-veg-pill.all.active{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:#f0ece4}
        .rd-veg-pill.veg{background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);color:rgba(16,185,129,0.6)}
        .rd-veg-pill.veg.active{background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.4);color:#10b981}
        .rd-veg-pill.nonveg{background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.12);color:rgba(239,68,68,0.5)}
        .rd-veg-pill.nonveg.active{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);color:#f87171}

        /* Category tabs */
        .rd-cat-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
        .rd-cat-tab{padding:6px 14px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:rgba(240,236,228,0.4)}
        .rd-cat-tab.active{background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.3);color:#fbbf24}

        /* Category section */
        .rd-cat-section{margin-bottom:36px}
        .rd-cat-name{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:rgba(240,236,228,0.6);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06);letter-spacing:0.04em}

        /* Food grid */
        .rd-food-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .rd-food-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden;transition:all 0.25s;display:flex;flex-direction:column}
        .rd-food-card:hover{border-color:rgba(251,191,36,0.15);background:rgba(255,255,255,0.05);transform:translateY(-2px)}
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
        .rd-food-spicy{font-size:10px;color:rgba(240,236,228,0.3)}

        /* EMPTY */
        .rd-empty{text-align:center;padding:48px 20px;color:rgba(240,236,228,0.3);font-size:14px}

        /* BOOKING MODAL */
        .rd-modal-overlay{position:fixed;inset:0;z-index:200;background:rgba(4,2,12,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px}
        .rd-modal{background:#0d1117;border:1px solid rgba(251,191,36,0.2);border-radius:24px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;animation:rd-modal 0.35s cubic-bezier(0.34,1.56,0.64,1) both}
        .rd-modal::-webkit-scrollbar{width:4px}
        .rd-modal::-webkit-scrollbar-thumb{background:rgba(251,191,36,0.2);border-radius:2px}
        .rd-modal-header{padding:24px 28px 0;display:flex;align-items:center;justify-content:space-between}
        .rd-modal-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:600;color:#f0ece4}
        .rd-modal-close{width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,0.06);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(240,236,228,0.5);transition:all 0.2s}
        .rd-modal-close:hover{background:rgba(239,68,68,0.12);color:#f87171}
        .rd-modal-body{padding:24px 28px 28px}
        .rd-field{margin-bottom:18px}
        .rd-label{font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(240,236,228,0.4);margin-bottom:8px;display:block}
        .rd-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:11px 14px;font-family:'DM Sans',sans-serif;font-size:13px;color:#f0ece4;outline:none;transition:all 0.2s}
        .rd-input:focus{border-color:rgba(251,191,36,0.4);background:rgba(251,191,36,0.05)}
        .rd-guests{display:flex;align-items:center;gap:12px}
        .rd-guest-btn{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);cursor:pointer;color:#f0ece4;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
        .rd-guest-btn:hover{border-color:rgba(251,191,36,0.3);background:rgba(251,191,36,0.08);color:#fbbf24}
        .rd-guest-num{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:#f0ece4;min-width:32px;text-align:center}

        /* Slots */
        .rd-slots{display:flex;flex-wrap:wrap;gap:8px}
        .rd-slot{padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;font-size:12px;font-weight:500;color:rgba(240,236,228,0.5);transition:all 0.2s}
        .rd-slot:hover:not(.unavailable){border-color:rgba(251,191,36,0.3);color:rgba(240,236,228,0.8)}
        .rd-slot.selected{background:rgba(251,191,36,0.15);border-color:rgba(251,191,36,0.5);color:#fbbf24}
        .rd-slot.unavailable{opacity:0.3;cursor:not-allowed;text-decoration:line-through}

        /* Confirm btn */
        .rd-confirm-btn{width:100%;padding:14px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#d97706,#fbbf24);color:#080a0e;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;transition:all 0.25s;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:8px}
        .rd-confirm-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 32px rgba(251,191,36,0.35)}
        .rd-confirm-btn:disabled{opacity:0.6;cursor:wait}
        .rd-spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(8,10,14,0.3);border-top-color:#080a0e;animation:rd-spin 0.7s linear infinite;display:inline-block}

        /* Success */
        .rd-success{text-align:center;padding:20px 0}
      `}</style>

      <div className="rd-root">

        {/* Back */}
        <button className="rd-back" style={{position:"fixed",zIndex:100}} onClick={() => navigate("/restaurants")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          All Restaurants
        </button>

        {/* Hero */}
        <div className="rd-hero">
          {restaurant.image
            ? <img src={restaurant.image} alt={restaurant.name} className="rd-hero-img"/>
            : <div className="rd-hero-placeholder">🍽️</div>
          }
          <div className="rd-hero-overlay"/>
          <div className="rd-hero-content">
            <div className="rd-meta">
              <span className={`rd-badge ${open ? "rd-open" : "rd-closed"}`}>
                {open ? "● Open Now" : "● Closed"}
              </span>
              <span className="rd-badge rd-price">{restaurant.priceRange}</span>
              {restaurant.rating > 0 && (
                <span className="rd-rating">★ {restaurant.rating.toFixed(1)}</span>
              )}
            </div>
            <h1 className="rd-name">{restaurant.name}</h1>
          </div>
        </div>

        {/* Info */}
        <div className="rd-info" style={{animation:"rd-fadeUp 0.5s ease both"}}>
          {restaurant.description && (
            <p className="rd-desc">{restaurant.description}</p>
          )}

          <div className="rd-details">
            <div className="rd-detail">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {restaurant.address}, {restaurant.city}
            </div>
            {restaurant.openingTime && (
              <div className="rd-detail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {restaurant.openingTime} – {restaurant.closingTime}
              </div>
            )}
            {restaurant.phoneNumber && (
              <div className="rd-detail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 012.09 5.18 2 2 0 014.11 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 17.92z"/></svg>
                {restaurant.phoneNumber}
              </div>
            )}
            {restaurant.cuisineTypes.length > 0 && (
              <div className="rd-detail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>
                {restaurant.cuisineTypes.join(", ")}
              </div>
            )}
          </div>

          <button className="rd-book-btn" disabled={!open} onClick={() => {
            if (!isLoggedIn) { toast.error("Please login to book a table"); return; }
            setShowBooking(true);
            setBookingDone(false);
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            {open ? "Reserve a Table" : "Currently Closed"}
          </button>
          {!open && <p style={{fontSize:12,color:"rgba(240,236,228,0.3)",marginTop:8}}>Bookings available during opening hours</p>}
        </div>

        {/* Divider */}
        <div className="rd-divider"/>

        {/* Menu */}
        <div className="rd-menu" style={{animation:"rd-fadeUp 0.6s ease 0.1s both"}}>
          <div className="rd-menu-title">Menu</div>

          {foodItems.length === 0 ? (
            <div className="rd-empty">No menu items available yet</div>
          ) : (
            <>
              <div className="rd-menu-controls">
                <input className="rd-menu-search" placeholder="Search menu items..."
                  value={foodSearch} onChange={e => setFoodSearch(e.target.value)}/>
                {[
                  { key:"all",    label:"All" },
                  { key:"veg",    label:"🟢 Veg" },
                  { key:"nonveg", label:"🔴 Non-Veg" },
                ].map(v => (
                  <button key={v.key}
                    className={`rd-veg-pill ${v.key}${vegFilter === v.key ? " active" : ""}`}
                    onClick={() => setVegFilter(v.key as any)}>
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="rd-cat-tabs">
                {usedCategories.map(cat => (
                  <button key={cat} className={`rd-cat-tab${activeCategory===cat?" active":""}`}
                    onClick={() => setActiveCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </div>

              {Object.keys(groupedFood).length === 0 ? (
                <div className="rd-empty">No items match your filter</div>
              ) : (
                Object.entries(groupedFood).map(([cat, items]) => (
                  <div key={cat} className="rd-cat-section">
                    <div className="rd-cat-name">{cat}</div>
                    <div className="rd-food-grid">
                      {items.map(f => (
                        <div key={f._id} className="rd-food-card">
                          {f.image
                            ? <img src={f.image} alt={f.name} className="rd-food-img"/>
                            : <div className="rd-food-img-ph">🍱</div>
                          }
                          <div className="rd-food-body">
                            <div className="rd-food-top">
                              <div className="rd-food-name">{f.name}</div>
                              <div className="rd-food-dot" style={{border:`2px solid ${f.isVeg?"#10b981":"#ef4444"}`}}>
                                <div style={{width:6,height:6,borderRadius:"50%",background:f.isVeg?"#10b981":"#ef4444"}}/>
                              </div>
                            </div>
                            {f.description && <div className="rd-food-desc">{f.description}</div>}
                            <div className="rd-food-footer">
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <span className="rd-food-price">₹{f.price}</span>
                                {f.offer > 0 && <span className="rd-food-offer">{f.offer}% off</span>}
                              </div>
                              <span className="rd-food-spicy">{f.spicyLevel}</span>
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
      </div>

      {/* ── BOOKING MODAL ── */}
      {showBooking && (
        <div className="rd-modal-overlay" onClick={() => setShowBooking(false)}>
          <div className="rd-modal" onClick={e => e.stopPropagation()}>

            <div className="rd-modal-header">
              <div className="rd-modal-title">
                {bookingDone ? "🎉 Booking Confirmed!" : "Reserve a Table"}
              </div>
              <button className="rd-modal-close" onClick={() => { setShowBooking(false); setBookingDone(false); }}>✕</button>
            </div>

            <div className="rd-modal-body">
              {bookingDone ? (
                <div className="rd-success">
                  <div style={{fontSize:64,marginBottom:16}}>🎊</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#f0ece4",marginBottom:8}}>
                    You're all set!
                  </div>
                  <div style={{fontSize:13,color:"rgba(240,236,228,0.5)",lineHeight:1.7,marginBottom:8}}>
                    Your booking at <strong style={{color:"#fbbf24"}}>{restaurant.name}</strong> for<br/>
                    <strong style={{color:"#f0ece4"}}>{selectedSlot}</strong> on <strong style={{color:"#f0ece4"}}>{new Date(bookDate).toDateString()}</strong><br/>
                    for <strong style={{color:"#f0ece4"}}>{guests} guests</strong> has been submitted.
                  </div>
                  <div style={{fontSize:12,color:"rgba(240,236,228,0.35)",marginBottom:24}}>
                    ⏳ Awaiting confirmation from the restaurant
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                    <button onClick={() => navigate("/my-bookings")} style={{padding:"10px 24px",background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:10,color:"#fbbf24",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                      My Bookings
                    </button>
                    <button onClick={() => { setShowBooking(false); setBookingDone(false); }} style={{padding:"10px 24px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(240,236,228,0.6)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.12)",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
                    {restaurant.image && <img src={restaurant.image} alt="" style={{width:40,height:40,borderRadius:8,objectFit:"cover"}}/>}
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:"#f0ece4"}}>{restaurant.name}</div>
                      <div style={{fontSize:11,color:"rgba(240,236,228,0.4)"}}>{restaurant.city}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="rd-field">
                    <label className="rd-label">Select Date</label>
                    <input type="date" className="rd-input" value={bookDate}
                      min={today()}
                      onChange={e => setBookDate(e.target.value)}/>
                  </div>

                  {/* Time Slots */}
                  <div className="rd-field">
                    <label className="rd-label">Select Time Slot</label>
                    {slotsLoading ? (
                      <div style={{display:"flex",alignItems:"center",gap:8,color:"rgba(240,236,228,0.4)",fontSize:13}}>
                        <div className="rd-spinner"/> Loading slots...
                      </div>
                    ) : slots.length === 0 ? (
                      <div style={{fontSize:13,color:"rgba(240,236,228,0.35)"}}>No slots available for this date</div>
                    ) : (
                      <div className="rd-slots">
                        {slots.map(s => (
                          <button key={s.slot}
                            className={`rd-slot${selectedSlot===s.slot?" selected":""}${!s.available?" unavailable":""}`}
                            disabled={!s.available}
                            onClick={() => setSelectedSlot(s.slot)}>
                            {s.slot}
                            {!s.available && " (Full)"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Guests */}
                  <div className="rd-field">
                    <label className="rd-label">Number of Guests</label>
                    <div className="rd-guests">
                      <button className="rd-guest-btn" onClick={() => setGuests(g => Math.max(1, g-1))}>−</button>
                      <span className="rd-guest-num">{guests}</span>
                      <button className="rd-guest-btn" onClick={() => setGuests(g => Math.min(20, g+1))}>+</button>
                      <span style={{fontSize:12,color:"rgba(240,236,228,0.3)"}}>{guests === 1 ? "1 person" : `${guests} people`}</span>
                    </div>
                  </div>

                  {/* Special Request */}
                  <div className="rd-field">
                    <label className="rd-label">Special Request <span style={{color:"rgba(240,236,228,0.25)"}}>(optional)</span></label>
                    <textarea className="rd-input" rows={3} placeholder="Any dietary requirements, special occasion, seating preferences..."
                      value={specialReq} onChange={e => setSpecialReq(e.target.value)}
                      style={{resize:"vertical"}}/>
                  </div>

                  <button className="rd-confirm-btn" disabled={booking || !selectedSlot} onClick={handleBook}>
                    {booking ? <><span className="rd-spinner"/> Confirming...</> : <>Confirm Booking</>}
                  </button>

                  <p style={{textAlign:"center",fontSize:11,color:"rgba(240,236,228,0.25)",marginTop:12}}>
                    Booking will be confirmed by the restaurant
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}