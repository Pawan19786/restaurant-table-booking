import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/navbar";
import LoginModal from "./Login";
import RegisterModal from "./Register";
import OrderModal from "./OrderModal";
import api from "../api/api";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

interface ApiFoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  offer: number;
  category: string;
  isVeg: boolean;
  spicyLevel: string;
  isAvailable: boolean;
  image: string;
  restaurant: string;
}

interface ApiRestaurant {
  _id: string;
  name: string;
  address: string;
  city: string;
  cuisineTypes: string[];
  openingTime: string;
  closingTime: string;
  rating: number;
  priceRange: string;
  image: string;
  isActive: boolean;
}

type HeroTab = "Dining Out" | "Delivery" | "Nightlife";
type FoodWithRestaurant = ApiFoodItem & { restaurantData?: ApiRestaurant };

const NIGHTLIFE_CATEGORIES = ["Beverage"];
const DELIVERY_CATEGORIES = [
  "Starter", "Main Course", "Dessert", "Snacks",
  "Breads", "Rice & Biryani", "Other",
];
const CARDS_PER_PAGE = 8;
const LOCATION_KEY = "tt_user_location_label";
const LOCATION_COORDS_KEY = "tt_user_location_coords";

export default function HeroSection() {
  const navigate = useNavigate();
  const { addItem, items: cartItems } = useCart();
  const { isDark } = useTheme();

  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const [loginPopupVisible, setLoginPopupVisible] = useState(false);
  const loginPopupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [heroSearch, setHeroSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  const [activeTab, setActiveTab] = useState<HeroTab>("Delivery");
  const [currentPage, setCurrentPage] = useState(1);
  const [cardHover, setCardHover] = useState<string | null>(null);
  // Removed unused menuDocked state
  const [addedCart, setAddedCart] = useState<string | null>(null);

  const [allRestaurants, setAllRestaurants] = useState<ApiRestaurant[]>([]);
  const [allFoodItems, setAllFoodItems] = useState<FoodWithRestaurant[]>([]);
  const [loadingFood, setLoadingFood] = useState(true);

  const [orderModal, setOrderModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<ApiFoodItem | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<ApiRestaurant | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  /* ── Saved location ── */
  useEffect(() => {
    const savedLabel = localStorage.getItem(LOCATION_KEY);
    if (savedLabel) setLocationLabel(savedLabel);
  }, []);

  /* ── SCROLL FIX: use "clip" not "hidden" ── */
  useEffect(() => {
    // When HeroSection is rendered inside LandingPage panel (overflow-y:auto),
    // we don't need to touch document scroll — the panel handles it.
    // Only apply if rendered standalone (e.g. /dashboard route).
    const isStandalone = window.location.pathname !== "/";
    if (isStandalone) {
      document.documentElement.style.overflowX = "clip";
      document.documentElement.style.overflowY = "auto";
      document.body.style.overflowX = "clip";
      document.body.style.overflowY = "auto";
    }
    return () => {
      document.documentElement.style.overflowX = "";
      document.documentElement.style.overflowY = "";
      document.body.style.overflowX = "";
      document.body.style.overflowY = "";
    };
  }, []);

  /* ── Removed Docked bar on scroll ── */

  /* ── Manage scroll when popup shows ── */
  useEffect(() => {
    if (loginPopupVisible) {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [loginPopupVisible]);

  /* ── Fetch food data ── */
  useEffect(() => {
    setLoadingFood(true);
    api
      .get("/restaurants")
      .then(async (res) => {
        const restaurants: ApiRestaurant[] = (res.data.restaurants || []).filter(
          (r: ApiRestaurant) => r.isActive
        );
        console.log("✓ Active restaurants fetched:", restaurants.length, restaurants);
        setAllRestaurants(restaurants);

        const results = await Promise.allSettled(
          restaurants.map((r) => api.get(`/restaurants/${r._id}`))
        );
        console.log("✓ Food data Promise.allSettled completed:", results);

        const items: FoodWithRestaurant[] = [];
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            const foodList: ApiFoodItem[] = result.value.data.foodItems || [];
            const available = foodList.filter((f) => f.isAvailable);
            available.forEach((f) => {
              items.push({ ...f, restaurant: restaurants[idx]._id, restaurantData: restaurants[idx] });
            });
          }
        });
        console.log("✓ Loaded", items.length, "food items from", restaurants.length, "restaurants");
        setAllFoodItems(items);
      })
      .catch((err) => {
        console.error("✗ Error fetching restaurants:", err.message);
        setAllRestaurants([]);
        setAllFoodItems([]);
      })
      .finally(() => setLoadingFood(false));
  }, []);

  /* ── Location detect ── */
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported."); return; }
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data?.address || {};
          const label = [
            addr.suburb || addr.neighbourhood || addr.village || addr.hamlet,
            addr.city || addr.town || addr.county || addr.state,
          ].filter(Boolean).join(", ");
          const finalLabel = label || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setLocationLabel(finalLabel);
          localStorage.setItem(LOCATION_KEY, finalLabel);
          localStorage.setItem(LOCATION_COORDS_KEY, `${latitude},${longitude}`);
        } catch {
          const fallback = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setLocationLabel(fallback);
          localStorage.setItem(LOCATION_KEY, fallback);
          localStorage.setItem(LOCATION_COORDS_KEY, `${latitude},${longitude}`);
        } finally { setLocLoading(false); }
      },
      (err) => {
        setLocLoading(false);
        setLocError(err.code === err.PERMISSION_DENIED ? "Location access denied." : "Could not detect location.");
        setTimeout(() => setLocError(""), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  /* ── Filtered foods ── */
  const filteredFoods = useMemo(() => {
    let base: FoodWithRestaurant[] = [];
    if (activeTab === "Delivery") base = allFoodItems.filter((f) => DELIVERY_CATEGORIES.includes(f.category));
    else if (activeTab === "Nightlife") base = allFoodItems.filter((f) => NIGHTLIFE_CATEGORIES.includes(f.category));
    else return [];
    if (!appliedSearch.trim()) return base;
    const q = appliedSearch.toLowerCase().trim();
    return base.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.restaurantData?.name?.toLowerCase().includes(q)
    );
  }, [activeTab, allFoodItems, appliedSearch]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / CARDS_PER_PAGE));
  const pageItems = filteredFoods.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);

  // Log when allFoodItems state actually changes
  useEffect(() => {
    if (allFoodItems.length > 0) {
      console.log("✓ Food items loaded and ready");
    }
  }, [allFoodItems.length]);

  // Debug logging for page items
  useEffect(() => {
    if (pageItems.length === 0 && allFoodItems.length > 0) {
      console.log("ℹ No items on current page");
    }
  }, [pageItems.length, allFoodItems.length]);

  /* ── Handlers ── */
  const handleSearch = useCallback(() => {
    const q = heroSearch.trim().toLowerCase();
    if (!q) { setAppliedSearch(""); return; }
    const matchedFoods = allFoodItems.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
    if (matchedFoods.length > 0) {
      setAppliedSearch(heroSearch.trim());
      setActiveTab("Delivery");
      requestAnimationFrame(() => {
        menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    const matchedRestaurant = allRestaurants.some((r) => r.name.toLowerCase().includes(q));
    if (matchedRestaurant) {
      navigate(`/restaurants?q=${encodeURIComponent(heroSearch.trim())}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setAppliedSearch(heroSearch.trim());
    requestAnimationFrame(() => {
      menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [heroSearch, allFoodItems, allRestaurants, navigate]);

  const showLoginPopup = () => {
    // Ensure body scroll is NOT locked when showing popup
    document.body.style.overflow = "auto";
    setLoginPopupVisible(true);
    // Clear any existing timer first
    if (loginPopupTimer.current) {
      clearTimeout(loginPopupTimer.current);
      loginPopupTimer.current = null;
    }
    // Set new timer to hide after 4 seconds
    loginPopupTimer.current = setTimeout(() => {
      setLoginPopupVisible(false);
      loginPopupTimer.current = null;
    }, 4000);
  };

  const handleExploreMenu = useCallback(() => {
    setActiveTab("Delivery");
    requestAnimationFrame(() => {
      menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleFoodClick = (food: FoodWithRestaurant) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showLoginPopup();
      return;
    }
    if (!food.restaurantData) return;
    setSelectedFood(food);
    setSelectedRestaurant(food.restaurantData);
    setOrderModal(true);
  };

  const handleAddToCart = (e: React.MouseEvent, food: FoodWithRestaurant) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { showLoginPopup(); return; }
    if (!food.restaurantData) return;
    addItem({
      _id: food._id,
      name: food.name,
      price: food.price,
      offer: food.offer,
      image: food.image,
      isVeg: food.isVeg,
      restaurantId: food.restaurantData._id,
      restaurantName: food.restaurantData.name,
    });
    setAddedCart(food._id);
    toast.success(`${food.name} added to cart!`, { duration: 1500 });
    setTimeout(() => setAddedCart(null), 900);
  };

  const handleTabClick = (tab: HeroTab) => {
    if (tab === "Dining Out") {
      navigate("/restaurants");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setActiveTab(tab);
  };

  const formatPrice = (item: ApiFoodItem) => {
    if (item.offer > 0) {
      const discounted = Math.round(item.price * (1 - item.offer / 100));
      return { final: discounted, original: item.price };
    }
    return { final: item.price, original: null as number | null };
  };

  const hasMatch = appliedSearch.trim().length > 0;

  /* ─────────────────────────────────────────────────────────
     RENDER — 2026 Cinematic Luxury Design
  ───────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Cinzel:wght@400;500;700&display=swap');

        /* ── CSS Custom Properties ── */
        :root {
          --ink:        #050311;
          --ink-2:      #0a0620;
          --gold:       #c9983a;
          --gold-lt:    #f0cd7a;
          --gold-dim:   rgba(201,152,58,.14);
          --violet:     #6d3fd4;
          --violet-lt:  #a78bfa;
          --teal:       #1ec8b0;
          --teal-dim:   rgba(30,200,176,.12);
          --glass:      rgba(255,255,255,.028);
          --glass-2:    rgba(255,255,255,.05);
          --border-g:   rgba(201,152,58,.18);
          --border-v:   rgba(167,139,250,.16);
          --text-1:     #f5f0ff;
          --text-2:     rgba(235,225,255,.72);
          --text-3:     rgba(215,200,255,.45);
          --font-disp:  'Cormorant Garamond', serif;
          --font-ui:    'DM Sans', sans-serif;
          --font-label: 'Syne', sans-serif;
          --font-cinzel:'Cinzel', serif;
        }

        /* ── Reset & Base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { overflow-x: clip; overflow-y: auto; scroll-behavior: smooth; }
        body { overflow-x: clip; overflow-y: auto; background: var(--ink); }
        #root { overflow: visible; }

        /* ── Keyframes ── */
        @keyframes tr-rise    { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tr-slide   { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes tr-scale   { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
        @keyframes tr-reveal  {
          0%   { opacity:0; transform:perspective(800px) rotateX(12deg) translateY(40px); filter:blur(4px); }
          65%  { opacity:1; filter:blur(0); }
          100% { opacity:1; transform:perspective(800px) rotateX(0) translateY(0); }
        }
        @keyframes tr-shimmer {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes tr-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes tr-pulse-g {
          0%,100%{ box-shadow: 0 0 0 0 rgba(201,152,58,0); }
          50%    { box-shadow: 0 0 0 3px rgba(201,152,58,.1); }
        }
        @keyframes tr-orb {
          0%,100%{ transform:translate3d(0,0,0) scale(1); }
          33%    { transform:translate3d(50px,-40px,0) scale(1.06); }
          66%    { transform:translate3d(-40px,28px,0) scale(.96); }
        }
        @keyframes tr-beam {
          0%   { transform:translateX(-120%) skewX(-18deg); opacity:0; }
          18%  { opacity:.7; }
          82%  { opacity:.7; }
          100% { transform:translateX(220%) skewX(-18deg); opacity:0; }
        }
        @keyframes tr-cartpop {
          0%  { transform:scale(1); }
          30% { transform:scale(1.2) rotate(-3deg); }
          65% { transform:scale(.93) rotate(2deg); }
          100%{ transform:scale(1) rotate(0); }
        }
        @keyframes tr-skeleton {
          0%  { background-position: -400px 0; }
          100%{ background-position: 400px 0; }
        }
        @keyframes tr-ring {
          0%  { transform:translate(-50%,-50%) scale(.88); opacity:.6; }
          100%{ transform:translate(-50%,-50%) scale(1.85); opacity:0; }
        }
        @keyframes tr-spin { to{ transform: rotate(360deg); } }
        @keyframes tr-scan {
          0%  { transform:translateY(-100%); }
          100%{ transform:translateY(400%); }
        }
        @keyframes tr-glow-text {
          0%,100%{ text-shadow: 0 0 20px rgba(201,152,58,.18); }
          50%    { text-shadow: 0 0 48px rgba(201,152,58,.42), 0 0 90px rgba(201,152,58,.16); }
        }
        @keyframes tr-stat {
          from{ opacity:0; transform:translateY(20px); }
          to  { opacity:1; transform:translateY(0); }
        }
        @keyframes tr-marquee { from{ transform:translateX(0); } to{ transform:translateX(-50%); } }
        @keyframes tr-dot-blink { 0%,100%{opacity:.4} 50%{opacity:1} }

        /* ── Root shell ── */
        .tr-root {
          min-height: 100vh;
          font-family: var(--font-ui);
          color: var(--text-1);
          background: var(--ink);
          position: relative;
        }

        /* ── Ambient background ── */
        .tr-bg {
          position: absolute; inset: 0; pointer-events: none;
          z-index: 0; overflow: hidden;
          /* use absolute not fixed — panel is the scroll container */
        }
        /* Grain noise overlay — GPU composited, very cheap */
        .tr-bg::before {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: .028;
          z-index: 2;
        }
        /* Vignette */
        .tr-bg::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(80,30,160,.07) 0%, transparent 60%),
                      radial-gradient(ellipse at bottom, rgba(4,1,12,.8) 0%, transparent 70%);
          z-index: 1;
        }
        /* Static orbs — NO animation (saves GPU on scroll) */
        .tr-orb {
          position: absolute; border-radius: 999px;
          pointer-events: none; z-index: 0;
        }
        .tr-orb-1 {
          width: 680px; height: 680px;
          top: -180px; left: -200px;
          background: radial-gradient(circle, rgba(109,63,212,.18) 0%, transparent 68%);
          filter: blur(80px);
        }
        .tr-orb-2 {
          width: 520px; height: 520px;
          top: 60px; right: -150px;
          background: radial-gradient(circle, rgba(30,200,176,.10) 0%, transparent 68%);
          filter: blur(90px);
        }
        .tr-orb-3 {
          width: 600px; height: 600px;
          bottom: -100px; left: 40%;
          background: radial-gradient(circle, rgba(201,152,58,.08) 0%, transparent 68%);
          filter: blur(100px);
        }
        /* Beam removed — was painting full-page every 14s */

        /* ── Navbar wrapper ── */
        .tr-nav-wrap {
          position: sticky; top: 0; z-index: 120;
          backdrop-filter: blur(28px) saturate(1.4);
          -webkit-backdrop-filter: blur(28px) saturate(1.4);
          background: rgba(5,3,17,.78);
          border-bottom: 1px solid rgba(201,152,58,.08);
          box-shadow: 0 1px 0 rgba(255,255,255,.03), 0 8px 32px rgba(0,0,0,.4);
        }

        /* ─────────────────────────────────────────
           HERO SECTION
        ───────────────────────────────────────── */
        .tr-hero {
          position: relative; z-index: 10;
          min-height: calc(100vh - 70px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 24px 52px;
          overflow: visible;
        }

        /* Floating ambient badges — float animation removed for scroll perf */
        .tr-float-card {
          position: absolute;
          padding: 16px 20px; border-radius: 18px;
          background: rgba(10,6,32,.88);
          border: 1px solid var(--border-g);
          /* backdrop-filter removed — expensive during scroll */
          box-shadow: 0 24px 48px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.04);
          z-index: 5;
          /* will-change: transform; kept off — no animation */
        }
        .tr-float-card.left  { left: 2.5%;  top: 44%; }
        .tr-float-card.right { right: 2.5%; top: 52%; }
        .tr-float-card .fc-dot {
          width: 8px; height: 8px; border-radius: 999px;
          background: var(--teal);
          box-shadow: 0 0 10px var(--teal);
          display: inline-block; margin-right: 8px;
          animation: tr-dot-blink 2s ease-in-out infinite;
          vertical-align: middle;
        }
        .tr-float-card .fc-dot.amber { background: var(--gold); box-shadow: 0 0 10px var(--gold); }
        .tr-float-card .fc-label {
          font-family: var(--font-label); font-size: 9px;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--gold); display: block; margin-bottom: 6px;
        }
        .tr-float-card .fc-val {
          font-size: 13px; color: var(--text-2);
          font-family: var(--font-ui); font-weight: 300;
        }
        .tr-float-card .fc-big {
          font-family: var(--font-disp); font-size: 22px; font-weight: 600;
          color: var(--text-1); display: block; line-height: 1;
        }
        .tr-float-card .fc-sub {
          font-size: 10px; color: var(--text-3);
          font-family: var(--font-label); letter-spacing: .08em;
        }

        /* Hero center content */
        .tr-hero-center { max-width: 900px; width: 100%; text-align: center; position: relative; z-index: 6; }

        /* Crown / crest icon */
        .tr-crest {
          width: 64px; height: 64px; margin: 0 auto 22px;
          position: relative; display: grid; place-items: center;
          animation: tr-rise .65s ease both;
        }
        .tr-crest-ring {
          position: absolute; inset: 0; border-radius: 999px;
          border: 1px solid rgba(201,152,58,.22);
          animation: tr-ring 4s ease-out infinite;
        }
        .tr-crest-ring.r2 { animation-delay: 1.8s; }
        .tr-crest-icon {
          width: 26px; height: 26px;
          color: var(--gold);
          filter: drop-shadow(0 0 12px rgba(201,152,58,.5));
        }

        /* Eyebrow line */
        .tr-eyebrow {
          display: flex; align-items: center; justify-content: center;
          gap: 16px; margin-bottom: 20px;
          animation: tr-rise .7s ease .05s both;
        }
        .tr-eye-line {
          height: 1px; width: 80px;
          background: linear-gradient(90deg, transparent, rgba(201,152,58,.6));
        }
        .tr-eye-line.r { background: linear-gradient(270deg, transparent, rgba(201,152,58,.6)); }
        .tr-eye-text {
          font-family: var(--font-label); font-size: 10px;
          letter-spacing: .28em; text-transform: uppercase;
          color: rgba(201,152,58,.72); font-weight: 600;
        }

        /* Main title */
        .tr-title {
          font-family: var(--font-disp);
          font-size: clamp(3.4rem, 8vw, 7rem);
          font-weight: 300; line-height: .92;
          letter-spacing: .06em;
          background: linear-gradient(
            135deg,
            #f5efff 0%, #f0cd7a 22%,
            #fff9f0 44%, #c9983a 62%,
            #f5efff 80%, #c9983a 100%
          );
          background-size: 260% 260%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation:
            tr-reveal .95s cubic-bezier(.16,1,.3,1) .08s both,
            tr-shimmer 9s ease-in-out infinite,
            tr-glow-text 5s ease-in-out infinite;
        }
        .tr-title em {
          font-style: italic; font-weight: 400;
          letter-spacing: .12em;
        }

        /* Sub tagline below title */
        .tr-title-tag {
          display: block; margin-top: 12px;
          font-family: var(--font-label); font-size: 11px;
          letter-spacing: .3em; text-transform: uppercase;
          color: rgba(201,152,58,.42);
        }

        /* Ornament */
        .tr-orn {
          display: flex; align-items: center; justify-content: center;
          gap: 14px; margin: 22px 0 20px;
          animation: tr-rise .65s ease .2s both;
        }
        .tr-orn-line { height: 1px; width: 100px; background: linear-gradient(90deg, transparent, rgba(201,152,58,.22)); }
        .tr-orn-line.r { background: linear-gradient(270deg, transparent, rgba(201,152,58,.22)); }
        .tr-orn-diamond {
          width: 7px; height: 7px;
          background: var(--gold-lt); opacity: .6;
          transform: rotate(45deg);
          box-shadow: 0 0 10px rgba(201,152,58,.5);
        }

        /* Description */
        .tr-desc {
          max-width: 600px; margin: 0 auto 32px;
          font-size: clamp(.96rem, 1.5vw, 1.12rem); font-weight: 300;
          line-height: 1.82; color: var(--text-2);
          font-family: var(--font-disp); font-style: italic;
          animation: tr-rise .7s ease .26s both;
        }

        /* CTA buttons */
        .tr-cta {
          display: flex; align-items: center; justify-content: center;
          gap: 14px; flex-wrap: wrap; margin-bottom: 34px;
          animation: tr-scale .7s cubic-bezier(.16,1,.3,1) .34s both;
        }
        .tr-btn-primary {
          position: relative; overflow: hidden;
          padding: 15px 32px; border: none; border-radius: 999px;
          background: linear-gradient(135deg, #b8832a, #e4b24a, #b8832a);
          background-size: 200% 100%;
          color: #0a0616; font-family: var(--font-label);
          font-size: .82rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; cursor: pointer;
          transition: transform .25s ease, box-shadow .25s ease, background-position .4s ease;
          box-shadow: 0 12px 32px rgba(184,131,42,.32), 0 0 0 1px rgba(255,255,255,.06) inset;
        }
        .tr-btn-primary::after {
          content: '';
          position: absolute; top: 0; left: -120%; width: 80%; height: 100%;
          background: linear-gradient(105deg, transparent, rgba(255,255,255,.28), transparent);
          transition: left .55s ease;
        }
        .tr-btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 20px 44px rgba(184,131,42,.48);
          background-position: 100% 0;
        }
        .tr-btn-primary:hover::after { left: 120%; }

        .tr-btn-ghost {
          padding: 14px 30px; border-radius: 999px;
          border: 1px solid rgba(201,152,58,.28);
          background: rgba(201,152,58,.04);
          color: var(--gold-lt); font-family: var(--font-label);
          font-size: .82rem; font-weight: 600; letter-spacing: .1em;
          text-transform: uppercase; cursor: pointer;
          transition: transform .22s ease, background .22s ease, box-shadow .22s ease;
        }
        .tr-btn-ghost:hover {
          transform: translateY(-2px);
          background: rgba(201,152,58,.09);
          box-shadow: 0 8px 24px rgba(201,152,58,.12);
        }

        /* ── Search island ── */
        .tr-search-wrap {
          width: min(780px, 100%); margin: 0 auto 28px;
          animation: tr-rise .7s ease .42s both;
        }
        .tr-search-bar {
          display: grid;
          grid-template-columns: auto 1px 1fr auto;
          align-items: center; min-height: 60px;
          border-radius: 18px; overflow: hidden;
          background: rgba(255,255,255,.032);
          border: 1px solid var(--border-g);
          box-shadow: 0 20px 40px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.05);
          backdrop-filter: blur(24px);
        }
        .tr-loc-btn {
          height: 100%; display: flex; align-items: center; gap: 9px;
          padding: 0 20px; background: transparent; border: none;
          color: var(--text-2); font-family: var(--font-ui);
          font-size: .83rem; cursor: pointer; max-width: 230px;
          transition: background .2s;
        }
        .tr-loc-btn:hover { background: rgba(201,152,58,.06); }
        .tr-loc-btn.detected { color: var(--teal); }
        .tr-loc-icon.spin { animation: tr-spin .95s linear infinite; }
        .tr-loc-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tr-bar-div { width: 1px; height: 28px; background: rgba(201,152,58,.18); flex-shrink: 0; }
        .tr-search-input {
          flex: 1; height: 100%; border: none; outline: none;
          background: transparent; color: var(--text-1);
          font-family: var(--font-ui); font-size: .96rem; padding: 0 18px;
        }
        .tr-search-input::placeholder { color: rgba(201,170,100,.3); }
        .tr-search-btn {
          height: 100%; min-width: 110px; border: none;
          background: linear-gradient(135deg, #b8832a, #e4b24a);
          color: #0a0616; font-family: var(--font-label);
          font-weight: 700; font-size: .8rem; letter-spacing: .08em;
          cursor: pointer; transition: filter .22s;
        }
        .tr-search-btn:hover { filter: brightness(1.1); }
        .tr-loc-error { margin-top: 8px; font-size: .78rem; color: #ff8383; text-align: center; }

        /* ── Tabs ── */
        .tr-tabs-wrap {
          display: flex; justify-content: center;
          animation: tr-rise .7s ease .5s both;
        }
        .tr-tabs {
          display: flex; align-items: center; gap: 4px;
          padding: 5px; border-radius: 999px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(201,152,58,.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
        }
        .tr-tab {
          border: none; background: transparent;
          color: var(--text-3); border-radius: 999px;
          padding: 10px 22px;
          font-family: var(--font-label); font-weight: 600; font-size: .82rem;
          letter-spacing: .06em; cursor: pointer;
          transition: all .25s ease;
        }
        .tr-tab:hover { color: var(--text-2); background: rgba(201,152,58,.06); }
        .tr-tab.active {
          color: #0a0616;
          background: linear-gradient(135deg, #b8832a, #e4b24a);
          box-shadow: 0 6px 18px rgba(184,131,42,.3);
        }

        /* ── Scroll indicator ── */
        .tr-scroll-hint {
          position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          opacity: .5; cursor: pointer; transition: opacity .2s;
          z-index: 6; animation: tr-rise 1s ease .8s both;
        }
        .tr-scroll-hint:hover { opacity: .9; }
        .tr-scroll-hint span {
          font-family: var(--font-label); font-size: 9px;
          letter-spacing: .25em; text-transform: uppercase; color: var(--gold);
        }
        .tr-scroll-mouse {
          width: 22px; height: 34px; border: 1px solid rgba(201,152,58,.4);
          border-radius: 999px; position: relative;
        }
        .tr-scroll-mouse::after {
          content: ''; position: absolute;
          top: 6px; left: 50%; transform: translateX(-50%);
          width: 3px; height: 6px; background: var(--gold); border-radius: 999px;
          animation: tr-float 1.8s ease-in-out infinite;
        }

        /* ─────────────────────────────────────────
           MENU / FOOD SECTION
        ───────────────────────────────────────── */
        .tr-menu-zone {
          position: relative; z-index: 10;
          padding: 0 20px 64px;
        }
        .tr-menu-center { width: min(1480px, 100%); margin: 0 auto; }

        /* ── Docked sticky bar ── */
        .tr-docked-bar {
          position: sticky; top: 68px; z-index: 100;
          display: flex; align-items: center;
          justify-content: space-between; flex-wrap: wrap;
          gap: 14px; margin-bottom: 28px;
          padding: 16px 24px;
          border-radius: 20px;
          background: rgba(8,4,22,.88);
          border: 1px solid var(--border-g);
          backdrop-filter: blur(24px);
          box-shadow: 0 20px 48px rgba(0,0,0,.32);
        }
        .tr-docked-left { display: flex; flex-direction: column; gap: 3px; }
        .tr-docked-label {
          font-family: var(--font-label); font-size: 9px;
          letter-spacing: .22em; text-transform: uppercase;
          color: var(--gold); opacity: .8;
        }
        .tr-docked-title {
          font-family: var(--font-disp); font-size: 1.85rem;
          font-weight: 500; color: var(--text-1); letter-spacing: .03em;
        }
        .tr-docked-tabs {
          display: flex; align-items: center; gap: 4px;
          padding: 4px; border-radius: 999px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(201,152,58,.1);
        }
        .tr-docked-tab {
          border: none; background: transparent;
          color: var(--text-3); border-radius: 999px;
          padding: 9px 18px; font-family: var(--font-label);
          font-weight: 600; font-size: .78rem; letter-spacing: .06em;
          cursor: pointer; transition: all .22s ease;
        }
        .tr-docked-tab:hover { color: var(--text-2); background: rgba(201,152,58,.06); }
        .tr-docked-tab.active {
          color: #0a0616;
          background: linear-gradient(135deg, #b8832a, #e4b24a);
        }

        /* Match info */
        .tr-match-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 999px;
          background: rgba(201,152,58,.08);
          border: 1px solid rgba(201,152,58,.2);
          color: rgba(228,210,150,.85); font-size: .8rem;
          margin-bottom: 18px; font-family: var(--font-ui);
        }
        .tr-match-dot {
          width: 7px; height: 7px; border-radius: 999px;
          background: var(--gold); box-shadow: 0 0 8px rgba(201,152,58,.7);
        }

        /* ── Food Grid ── */
        .tr-food-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 18px;
          contain: layout style;
        }

        /* ── Food Card ── */
        .tr-card {
          position: relative; border-radius: 24px; overflow: hidden;
          background: linear-gradient(160deg, rgba(18,10,40,.9) 0%, rgba(8,4,22,.95) 100%);
          border: 1px solid rgba(201,152,58,.10);
          box-shadow: 0 8px 32px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.03);
          cursor: pointer; pointer-events: auto;
          transition:
            transform .3s cubic-bezier(.16,1,.3,1),
            box-shadow .3s ease,
            border-color .3s ease;
          /* animation removed — stagger on 8 cards triggers 8 layouts */
        }
        .tr-card:hover {
          transform: translateY(-12px) scale(1.016);
          border-color: rgba(201,152,58,.32);
          box-shadow:
            0 32px 72px rgba(0,0,0,.4),
            0 0 0 1px rgba(201,152,58,.16),
            inset 0 1px 0 rgba(255,255,255,.07);
        }

        /* Sweep shimmer on hover */
        .tr-card::before {
          content: '';
          position: absolute; top: 0; left: -120%; width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 35%, rgba(201,152,58,.06) 50%, transparent 65%);
          transition: left .65s ease;
          z-index: 6; pointer-events: none;
        }
        .tr-card:hover::before { left: 160%; }

        /* Corner accent */
        .tr-card::after {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 0; height: 0;
          border-style: solid;
          border-width: 0 32px 32px 0;
          border-color: transparent rgba(201,152,58,.12) transparent transparent;
          transition: opacity .3s;
          z-index: 5;
        }
        .tr-card:hover::after { opacity: 0; }

        /* Card image area */
        .tr-card-img {
          height: 200px; position: relative; overflow: hidden;
          background: linear-gradient(135deg, rgba(109,63,212,.18), rgba(30,40,80,.28));
        }
        .tr-card-img img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform .6s cubic-bezier(.16,1,.3,1);
        }
        .tr-card:hover .tr-card-img img { transform: scale(1.08); }

        /* Scan-line on hover — removed tr-scan animation (ran on ALL cards always) */
        .tr-card-img::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(201,152,58,.65), transparent);
          opacity: 0; transition: opacity .3s;
          pointer-events: none;
        }
        .tr-card:hover .tr-card-img::after { opacity: 1; }

        .tr-card-fallback { width: 100%; height: 100%; display: grid; place-items: center; font-size: 4rem; }
        .tr-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 30%, rgba(5,3,17,.82) 100%);
        }

        /* Restaurant chip — backdrop-filter removed (expensive per-card) */
        .tr-rest-chip {
          position: absolute; left: 12px; bottom: 12px;
          padding: 5px 11px; border-radius: 999px;
          background: rgba(3,1,14,.9);  /* solid dark bg instead of blur */
          border: 1px solid rgba(201,152,58,.14);
          color: var(--text-2); font-size: .7rem;
          max-width: calc(100% - 80px);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-family: var(--font-ui);
        }

        /* Discount badge */
        .tr-discount {
          position: absolute; top: 12px; right: 12px;
          padding: 6px 10px; border-radius: 999px;
          background: linear-gradient(135deg, #1dc98a, #12a56f);
          color: #fff; font-size: .7rem; font-weight: 700;
          font-family: var(--font-label); letter-spacing: .04em;
          box-shadow: 0 8px 18px rgba(22,190,122,.28);
        }

        /* Card body */
        .tr-card-body { padding: 16px 18px 20px; }
        .tr-card-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 10px; margin-bottom: 8px;
        }
        .tr-card-name {
          font-family: var(--font-disp); font-size: 1.08rem; font-weight: 600;
          color: var(--text-1); line-height: 1.3;
        }
        .tr-veg-badge {
          flex-shrink: 0; padding: 4px 9px; border-radius: 8px;
          font-family: var(--font-label); font-size: .68rem; font-weight: 700;
          letter-spacing: .04em;
          border: 1px solid transparent;
        }
        .tr-veg-badge.veg {
          background: rgba(34,197,94,.12); color: #86efac;
          border-color: rgba(34,197,94,.24);
        }
        .tr-veg-badge.nonveg {
          background: rgba(239,68,68,.12); color: #fca5a5;
          border-color: rgba(239,68,68,.24);
        }
        .tr-card-desc {
          font-size: .82rem; line-height: 1.65;
          color: var(--text-3); min-height: 40px; margin-bottom: 12px;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          font-family: var(--font-ui);
        }
        .tr-card-meta {
          display: flex; align-items: center;
          justify-content: space-between; gap: 10px;
          margin-bottom: 14px; flex-wrap: wrap;
        }
        .tr-card-tags { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .tr-tag {
          padding: 4px 10px; border-radius: 999px; font-size: .68rem;
          background: rgba(255,255,255,.032);
          border: 1px solid rgba(201,152,58,.1);
          color: var(--text-3); font-family: var(--font-label);
          letter-spacing: .04em;
        }
        .tr-price { display: flex; align-items: baseline; gap: 8px; }
        .tr-price-now {
          font-family: var(--font-disp); font-size: 1.2rem; font-weight: 600;
          color: var(--gold-lt);
        }
        .tr-price-old {
          font-size: .8rem; color: var(--text-3);
          text-decoration: line-through;
        }

        /* CTA row */
        .tr-card-cta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding-top: 12px;
          border-top: 1px solid rgba(201,152,58,.08);
        }
        .tr-cta-hint {
          font-size: .75rem; color: var(--text-3); font-family: var(--font-ui);
          font-style: italic;
        }
        .tr-cart-btn {
          display: flex; align-items: center; gap: 7px;
          border: none; border-radius: 999px; padding: 10px 18px;
          background: linear-gradient(135deg, #b8832a, #e4b24a);
          color: #0a0616; font-family: var(--font-label);
          font-weight: 700; font-size: .74rem; letter-spacing: .06em;
          cursor: pointer; white-space: nowrap; pointer-events: auto;
          transition: filter .22s, transform .22s, box-shadow .22s;
          box-shadow: 0 8px 24px rgba(184,131,42,.28);
        }
        .tr-cart-btn:hover {
          filter: brightness(1.1); transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(184,131,42,.42);
        }
        .tr-cart-btn.incart {
          background: linear-gradient(135deg, #1dc98a, #12c47c);
          color: #fff;
          box-shadow: 0 8px 24px rgba(22,190,122,.28);
        }
        .tr-cart-btn.added { animation: tr-cartpop .42s cubic-bezier(.16,1,.3,1); }
        .tr-cart-btn svg { width: 13px; height: 13px; }

        /* ── Skeleton ── */
        .tr-skeleton-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 18px; }
        .tr-skeleton {
          height: 360px; border-radius: 24px;
          background: linear-gradient(90deg, rgba(255,255,255,.025) 0%, rgba(255,255,255,.055) 50%, rgba(255,255,255,.025) 100%);
          background-size: 400px 100%;
          animation: tr-skeleton 1.9s linear infinite;
          border: 1px solid rgba(201,152,58,.06);
        }

        /* ── Empty state ── */
        .tr-empty {
          padding: 64px 24px; text-align: center;
          color: var(--text-3); border-radius: 24px;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(201,152,58,.08);
          font-family: var(--font-disp); font-size: 1.1rem; font-style: italic;
        }

        /* ── Pagination ── */
        .tr-pagination { display: flex; justify-content: center; gap: 10px; margin-top: 36px; flex-wrap: wrap; }
        .tr-page-btn {
          min-width: 42px; height: 42px; border-radius: 12px;
          border: 1px solid rgba(201,152,58,.16);
          background: rgba(255,255,255,.025);
          color: var(--text-2); cursor: pointer; font-weight: 700;
          font-family: var(--font-label); font-size: .82rem;
          transition: all .22s ease;
        }
        .tr-page-btn:hover { background: rgba(201,152,58,.08); border-color: rgba(201,152,58,.32); }
        .tr-page-btn.active {
          background: linear-gradient(135deg, #b8832a, #e4b24a);
          border-color: transparent; color: #0a0616;
          box-shadow: 0 8px 24px rgba(184,131,42,.32);
        }

        /* ── Divider ── */
        .tr-divider {
          width: min(1300px, calc(100% - 40px)); margin: 0 auto 48px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,152,58,.2), rgba(201,152,58,.2), transparent);
        }

        /* ── Stats ── */
        .tr-stats-zone { position: relative; z-index: 10; padding: 0 20px 80px; }
        .tr-stats-inner { width: min(1300px, 100%); margin: 0 auto; }
        .tr-stats-heading {
          text-align: center; margin-bottom: 32px;
          font-family: var(--font-disp); font-size: 2rem; font-weight: 300;
          font-style: italic; color: rgba(220,196,160,.85);
          letter-spacing: .06em;
        }
        .tr-stats-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 18px;
        }
        .tr-stat {
          padding: 30px 24px; border-radius: 22px; text-align: center;
          background: linear-gradient(155deg, rgba(18,10,40,.75), rgba(8,4,22,.9));
          border: 1px solid var(--border-g);
          /* backdrop-filter removed from stat cards — they are below fold */
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 12px 32px rgba(0,0,0,.24);
          transition: transform .3s ease, border-color .3s ease;
          /* single animation, no duplicate declaration */
        }
        .tr-stat:hover { transform: translateY(-5px); border-color: rgba(201,152,58,.28); }
        .tr-stat-num {
          display: block;
          font-family: var(--font-disp); font-size: 2.6rem; font-weight: 400;
          color: var(--gold-lt); margin-bottom: 7px;
          animation: tr-glow-text 3.5s ease-in-out infinite;
        }
        .tr-stat-lbl {
          display: block; font-family: var(--font-label);
          font-size: .78rem; letter-spacing: .12em; text-transform: uppercase;
          color: var(--text-3);
        }

        /* ── Marquee strip ── */
        .tr-marquee-strip {
          position: absolute; bottom: 0; left: 0; right: 0;
          overflow: hidden; height: 42px;
          background: rgba(201,152,58,.04);
          border-top: 1px solid rgba(201,152,58,.08);
          display: flex; align-items: center; z-index: 4;
        }
        .tr-marquee-track {
          display: flex; gap: 0;
          animation: tr-marquee 32s linear infinite;
          white-space: nowrap;
        }
        .tr-marquee-item {
          font-family: var(--font-label); font-size: 9px;
          letter-spacing: .25em; text-transform: uppercase;
          color: rgba(201,152,58,.45); padding: 0 28px;
          flex-shrink: 0;
        }
        .tr-marquee-dot { color: rgba(201,152,58,.25); }

        @media (max-width:1400px) {
          .tr-food-grid, .tr-skeleton-grid { grid-template-columns: repeat(4,1fr); }
        }
        @media (max-width:1280px) {
          .tr-food-grid, .tr-skeleton-grid { grid-template-columns: repeat(3,1fr); }
          .tr-float-card { display: none; }
        }
        @media (max-width:960px) {
          .tr-food-grid, .tr-skeleton-grid { grid-template-columns: repeat(2,1fr); }
          .tr-stats-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width:640px) {
          .tr-hero { padding: 40px 16px 48px; min-height: auto; }
          .tr-title { font-size: clamp(2.6rem, 11vw, 4rem); }
          .tr-search-bar { grid-template-columns: 1fr; height: auto; }
          .tr-bar-div { display: none; }
          .tr-loc-btn, .tr-search-input, .tr-search-btn { min-height: 52px; }
          .tr-search-input { border-top: 1px solid rgba(201,152,58,.1); border-bottom: 1px solid rgba(201,152,58,.1); }
          .tr-search-btn { width: 100%; }
          .tr-tabs { width: 100%; justify-content: center; flex-wrap: wrap; }
          .tr-food-grid, .tr-skeleton-grid { grid-template-columns: 1fr; }
          .tr-stats-grid { grid-template-columns: 1fr; }
          .tr-docked-bar { flex-direction: column; align-items: flex-start; top: 60px; }
          .tr-docked-title { font-size: 1.4rem; }
          .tr-scroll-hint { display: none; }
        }

        /* ════════════════════════════════════════════════════════
           LIGHT THEME OVERRIDES — applied when .tr-root.light
        ════════════════════════════════════════════════════════ */
        .tr-root.light {
          --ink:       #ffffff;
          --ink-2:     #f0f6ff;
          --gold:      #2563eb;
          --gold-lt:   #1d4ed8;
          --gold-dim:  rgba(37,99,235,0.08);
          --violet:    #2563eb;
          --teal:      #0ea5e9;
          --glass:     rgba(255,255,255,0.8);
          --glass-2:   rgba(255,255,255,0.95);
          --border-g:  rgba(37,99,235,0.15);
          --text-1:    #0f172a;
          --text-2:    #334155;
          --text-3:    #64748b;
          background: linear-gradient(160deg, #f0f9ff 0%, #e8f4ff 40%, #f8faff 100%);
          color: #0f172a;
        }
        /* Ambient orbs in light mode */
        .tr-root.light .tr-bg {
          background: linear-gradient(160deg,#e0f2fe 0%,#bfdbfe 30%,#f0f9ff 70%,#fff 100%);
        }
        .tr-root.light .tr-bg::before { opacity: 0.01; }
        .tr-root.light .tr-bg::after {
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(147,197,253,0.3) 0%, transparent 60%);
        }
        .tr-root.light .tr-orb-1 {
          background: radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 68%);
        }
        .tr-root.light .tr-orb-2 {
          background: radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 68%);
        }
        .tr-root.light .tr-orb-3 {
          background: radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 68%);
        }
        /* Navbar wrapper in light mode */
        .tr-root.light .tr-nav-wrap {
          background: rgba(255,255,255,0.95);
          border-bottom: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 2px 20px rgba(37,99,235,0.06);
        }
        /* Hero section light */
        .tr-root.light .tr-eyebrow .tr-eye-line {
          background: linear-gradient(90deg, transparent, rgba(37,99,235,0.4));
        }
        .tr-root.light .tr-eyebrow .tr-eye-line.r {
          background: linear-gradient(270deg, transparent, rgba(37,99,235,0.4));
        }
        .tr-root.light .tr-eye-text { color: rgba(37,99,235,0.7); }
        .tr-root.light .tr-crest-ring { border-color: rgba(37,99,235,0.2); }
        .tr-root.light .tr-crest-icon { color: #2563eb; filter: drop-shadow(0 0 12px rgba(37,99,235,0.3)); }
        .tr-root.light .tr-title {
          background: linear-gradient(135deg, #0f172a 0%, #2563eb 30%, #0f172a 60%, #1d4ed8 100%);
          background-size: 260% 260%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: tr-shimmer 9s ease-in-out infinite;
          text-shadow: none;
        }
        .tr-root.light .tr-title-tag { color: rgba(37,99,235,0.45); }
        .tr-root.light .tr-orn-line { background: linear-gradient(90deg, transparent, rgba(37,99,235,0.2)); }
        .tr-root.light .tr-orn-line.r { background: linear-gradient(270deg, transparent, rgba(37,99,235,0.2)); }
        .tr-root.light .tr-orn-diamond { background: #3b82f6; box-shadow: 0 0 10px rgba(59,130,246,0.4); }
        .tr-root.light .tr-desc { color: #475569; }
        /* Light CTA buttons */
        .tr-root.light .tr-btn-primary {
          background: linear-gradient(135deg, #1d4ed8, #3b82f6, #1d4ed8);
          background-size: 200% 100%;
          color: #ffffff;
          box-shadow: 0 12px 32px rgba(37,99,235,0.3);
        }
        .tr-root.light .tr-btn-primary:hover { box-shadow: 0 20px 44px rgba(37,99,235,0.45); }
        .tr-root.light .tr-btn-ghost {
          border-color: rgba(37,99,235,0.3);
          background: rgba(37,99,235,0.05);
          color: #2563eb;
        }
        .tr-root.light .tr-btn-ghost:hover { background: rgba(37,99,235,0.1); }
        /* Light Search bar */
        .tr-root.light .tr-search-bar {
          background: #ffffff;
          border: 1.5px solid rgba(37,99,235,0.2);
          box-shadow: 0 8px 32px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.06);
        }
        .tr-root.light .tr-loc-btn { color: #475569; }
        .tr-root.light .tr-loc-btn:hover { background: rgba(37,99,235,0.05); }
        .tr-root.light .tr-loc-btn.detected { color: #0ea5e9; }
        .tr-root.light .tr-bar-div { background: rgba(37,99,235,0.12); }
        .tr-root.light .tr-search-input { color: #0f172a; }
        .tr-root.light .tr-search-input::placeholder { color: #94a3b8; }
        .tr-root.light .tr-search-btn {
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: #ffffff;
        }
        .tr-root.light .tr-search-btn:hover { filter: brightness(1.08); }
        /* Light Tabs */
        .tr-root.light .tr-tabs {
          background: rgba(255,255,255,0.9);
          border: 1.5px solid rgba(37,99,235,0.12);
          box-shadow: 0 2px 12px rgba(37,99,235,0.08);
        }
        .tr-root.light .tr-tab { color: #64748b; }
        .tr-root.light .tr-tab:hover { color: #1e293b; background: rgba(37,99,235,0.07); }
        .tr-root.light .tr-tab.active {
          color: #ffffff;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          box-shadow: 0 6px 18px rgba(37,99,235,0.25);
        }
        /* Light scroll hint */
        .tr-root.light .tr-scroll-hint span { color: #2563eb; }
        .tr-root.light .tr-scroll-mouse { border-color: rgba(37,99,235,0.35); }
        .tr-root.light .tr-scroll-mouse::after { background: #2563eb; }
        /* Light float cards */
        .tr-root.light .tr-float-card {
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(37,99,235,0.15);
          box-shadow: 0 12px 32px rgba(37,99,235,0.1);
        }
        .tr-root.light .tr-float-card .fc-label { color: #2563eb; }
        .tr-root.light .tr-float-card .fc-val { color: #475569; }
        .tr-root.light .tr-float-card .fc-big { color: #0f172a; }
        .tr-root.light .tr-float-card .fc-sub { color: #94a3b8; }
        .tr-root.light .tr-float-card .fc-dot { background: #0ea5e9; box-shadow: 0 0 10px #0ea5e9; }
        /* Light docked bar */
        .tr-root.light .tr-docked-bar {
          background: rgba(255,255,255,0.97);
          border: 1px solid rgba(37,99,235,0.12);
          box-shadow: 0 8px 32px rgba(37,99,235,0.08);
        }
        .tr-root.light .tr-docked-label { color: #2563eb; }
        .tr-root.light .tr-docked-title { color: #0f172a; }
        .tr-root.light .tr-docked-tabs {
          background: rgba(241,245,249,0.9);
          border-color: rgba(37,99,235,0.1);
        }
        .tr-root.light .tr-docked-tab { color: #64748b; }
        .tr-root.light .tr-docked-tab:hover { color: #1e293b; background: rgba(37,99,235,0.07); }
        .tr-root.light .tr-docked-tab.active {
          color: #ffffff;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
        }
        /* Light match pill */
        .tr-root.light .tr-match-pill {
          background: rgba(37,99,235,0.07);
          border-color: rgba(37,99,235,0.18);
          color: #2563eb;
        }
        .tr-root.light .tr-match-dot { background: #2563eb; box-shadow: 0 0 8px rgba(37,99,235,0.6); }
        /* Light food cards */
        .tr-root.light .tr-card {
          background: #ffffff;
          border: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(37,99,235,0.04);
        }
        .tr-root.light .tr-card:hover {
          border-color: rgba(37,99,235,0.25);
          box-shadow: 0 16px 48px rgba(37,99,235,0.12), 0 4px 16px rgba(0,0,0,0.08);
        }
        .tr-root.light .tr-card::before {
          background: linear-gradient(105deg, transparent 35%, rgba(37,99,235,0.04) 50%, transparent 65%);
        }
        .tr-root.light .tr-card::after {
          border-color: transparent rgba(37,99,235,0.08) transparent transparent;
        }
        .tr-root.light .tr-card-img {
          background: linear-gradient(135deg, rgba(219,234,254,0.6), rgba(224,242,254,0.4));
        }
        .tr-root.light .tr-card-img::after {
          background: linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent);
        }
        .tr-root.light .tr-card-overlay {
          background: linear-gradient(to bottom, transparent 30%, rgba(255,255,255,0.15) 100%);
        }
        .tr-root.light .tr-rest-chip {
          background: rgba(255,255,255,0.95);
          border-color: rgba(37,99,235,0.12);
          color: #475569;
        }
        .tr-root.light .tr-card-name { color: #1e293b; }
        .tr-root.light .tr-card-desc { color: #64748b; }
        .tr-root.light .tr-tag {
          background: rgba(241,245,249,0.8);
          border-color: rgba(37,99,235,0.1);
          color: #64748b;
        }
        .tr-root.light .tr-price-now { color: #1d4ed8; }
        .tr-root.light .tr-price-old { color: #94a3b8; }
        .tr-root.light .tr-card-cta { border-top-color: rgba(37,99,235,0.08); }
        .tr-root.light .tr-cta-hint { color: #94a3b8; }
        .tr-root.light .tr-cart-btn {
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: #ffffff;
          box-shadow: 0 6px 18px rgba(37,99,235,0.22);
        }
        .tr-root.light .tr-cart-btn:hover { box-shadow: 0 12px 28px rgba(37,99,235,0.35); }
        .tr-root.light .tr-cart-btn.incart {
          background: linear-gradient(135deg, #059669, #10b981);
          color: #fff;
        }
        .tr-root.light .tr-veg-badge.veg { background: rgba(16,185,129,0.1); color: #059669; border-color: rgba(16,185,129,0.25); }
        .tr-root.light .tr-veg-badge.nonveg { background: rgba(239,68,68,0.08); color: #dc2626; border-color: rgba(239,68,68,0.2); }
        /* Light skeleton */
        .tr-root.light .tr-skeleton {
          background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
          background-size: 400px 100%;
          border-color: rgba(226,232,240,0.6);
        }
        /* Light empty state */
        .tr-root.light .tr-empty {
          color: #94a3b8;
          background: rgba(241,245,249,0.6);
          border-color: rgba(37,99,235,0.1);
        }
        /* Light pagination */
        .tr-root.light .tr-page-btn {
          border-color: rgba(37,99,235,0.15);
          background: rgba(255,255,255,0.9);
          color: #475569;
        }
        .tr-root.light .tr-page-btn:hover { background: rgba(37,99,235,0.06); border-color: rgba(37,99,235,0.3); }
        .tr-root.light .tr-page-btn.active {
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 6px 18px rgba(37,99,235,0.28);
        }
        /* Light stats */
        .tr-root.light .tr-divider {
          background: linear-gradient(90deg, transparent, rgba(37,99,235,0.15), rgba(37,99,235,0.15), transparent);
        }
        .tr-root.light .tr-stats-heading { color: #334155; }
        .tr-root.light .tr-stat {
          background: #ffffff;
          border: 1px solid rgba(37,99,235,0.1);
          box-shadow: 0 4px 16px rgba(37,99,235,0.06);
        }
        .tr-root.light .tr-stat:hover { border-color: rgba(37,99,235,0.25); }
        .tr-root.light .tr-stat-num { color: #2563eb; text-shadow: none; }
        .tr-root.light .tr-stat-lbl { color: #64748b; }
        /* Light marquee */
        .tr-root.light .tr-marquee-strip {
          background: rgba(37,99,235,0.04);
          border-top-color: rgba(37,99,235,0.08);
        }
        .tr-root.light .tr-marquee-item { color: rgba(37,99,235,0.4); }
        .tr-root.light .tr-marquee-dot { color: rgba(37,99,235,0.2); }
        /* Light login popup */
        .tr-root.light .tr-popup-box {
          background: linear-gradient(160deg, #ffffff 0%, #f8faff 100%);
          border-color: rgba(37,99,235,0.2);
          box-shadow: 0 40px 80px rgba(0,0,0,0.12), 0 0 60px rgba(37,99,235,0.06);
        }
        .tr-root.light .tr-popup-bar { background: linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8); }
        .tr-root.light .tr-popup-icon { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.2); }
        .tr-root.light .tr-popup-title { color: #0f172a; }
        .tr-root.light .tr-popup-msg { color: #64748b; }
        .tr-root.light .tr-popup-login-btn {
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(37,99,235,0.28);
        }
        .tr-root.light .tr-popup-close-btn {
          border-color: rgba(37,99,235,0.18);
          color: #64748b;
        }
        .tr-root.light .tr-popup-reg { color: #64748b; }
        .tr-root.light .tr-popup-reg-btn { color: #2563eb; border-bottom-color: rgba(37,99,235,0.3); }

        /* ── Login Popup ── */
        @keyframes tr-popup-in {
          0%   { opacity:0; transform:translate(-50%,-50%) scale(0.8); }
          50%  { opacity:1; transform:translate(-50%,-50%) scale(1.02); }
          100% { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
        @keyframes tr-lock-bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        .tr-popup-overlay {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .tr-popup-overlay.open {
          opacity: 1; pointer-events: all;
          animation: none;
        }
        .tr-popup-box {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: min(400px, calc(100vw - 32px));
          background: linear-gradient(160deg, #0c0620 0%, #060312 100%);
          border: 1px solid rgba(201,152,58,0.35);
          border-radius: 24px;
          padding: 40px 32px 32px;
          text-align: center;
          box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(201,152,58,0.07);
          z-index: 9001;
          opacity: 0;
          scale: 0.8;
          transition: opacity 0.3s cubic-bezier(0.16,1,0.3,1), scale 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .tr-popup-overlay.open .tr-popup-box {
          opacity: 1;
          scale: 1;
          animation: tr-popup-in 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .tr-popup-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          border-radius: 24px 24px 0 0;
          background: linear-gradient(90deg, #b8832a, #e4b24a, #b8832a);
        }
        .tr-popup-icon {
          width: 60px; height: 60px; margin: 0 auto 16px;
          border-radius: 50%;
          background: rgba(201,152,58,0.1);
          border: 1px solid rgba(201,152,58,0.25);
          display: grid; place-items: center;
          animation: tr-lock-bob 2s ease-in-out infinite;
        }
        .tr-popup-title {
          font-family: var(--font-disp); font-size: 1.5rem; font-weight: 500;
          color: var(--text-1); margin-bottom: 8px;
        }
        .tr-popup-msg {
          font-size: 0.85rem; color: var(--text-3); line-height: 1.7;
          margin-bottom: 24px; font-family: var(--font-ui);
        }
        .tr-popup-btns { display: flex; gap: 10px; justify-content: center; }
        .tr-popup-login-btn {
          padding: 11px 26px; border: none; border-radius: 999px;
          background: linear-gradient(135deg, #b8832a, #e4b24a);
          color: #0a0616; font-family: var(--font-label); font-weight: 700;
          font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; box-shadow: 0 8px 24px rgba(184,131,42,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .tr-popup-login-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(184,131,42,0.5); }
        .tr-popup-close-btn {
          padding: 10px 20px; border-radius: 999px;
          border: 1px solid rgba(201,152,58,0.2);
          background: transparent; color: var(--text-3);
          font-family: var(--font-label); font-size: 0.78rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
        }
        .tr-popup-close-btn:hover { background: rgba(201,152,58,0.07); color: var(--text-2); }
        .tr-popup-sep {
          height: 1px; margin: 20px 0 16px;
          background: linear-gradient(90deg, transparent, rgba(201,152,58,0.15), transparent);
        }
        .tr-popup-reg {
          font-size: 0.78rem; color: var(--text-3); font-family: var(--font-ui);
        }
        .tr-popup-reg-btn {
          background: none; border: none; border-bottom: 1px solid rgba(201,152,58,0.3);
          color: var(--gold); font-size: 0.78rem; font-family: var(--font-ui);
          cursor: pointer; padding: 0; transition: color 0.2s;
        }
        .tr-popup-reg-btn:hover { color: var(--gold-lt); }
      `}</style>

      <div className={`tr-root${!isDark ? " light" : ""}`}>
        {/* ── Ambient background (fixed so it spans entire page) ── */}
        <div className="tr-bg" aria-hidden="true">
          <div className="tr-orb tr-orb-1" />
          <div className="tr-orb tr-orb-2" />
          <div className="tr-orb tr-orb-3" />
        </div>

        {/* ── Sticky navbar ── */}
        <div className="tr-nav-wrap">
          <Navbar
            onLoginOpen={() => setOpenLoginModal(true)}
            onRegisterOpen={() => setOpenRegisterModal(true)}
            activeLink={activeLink}
            setActiveLink={setActiveLink}
          />
        </div>

        {/* ─────────────────────────────────────────
            HERO SECTION
        ───────────────────────────────────────── */}
        <section ref={heroRef} className="tr-hero">
          {/* Floating status cards — ambient decoration */}
          <div className="tr-float-card left">
            <span className="fc-label">Now Serving</span>
            <span className="fc-val">
              <span className="fc-dot" />
              Wagyu Steak · Table 7
            </span>
          </div>
          <div className="tr-float-card right">
            <span className="fc-big">{allRestaurants.length || "12"}+</span>
            <span className="fc-sub">Live Restaurants</span>
          </div>

          {/* Center content */}
          <div className="tr-hero-center">
            {/* Crest icon */}
            <div className="tr-crest" aria-hidden="true">
              <div className="tr-crest-ring" />
              <div className="tr-crest-ring r2" />
              <svg className="tr-crest-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 18h18" />
                <path d="M5 18L7.5 8l4.5 4 4-6 3 12" />
                <circle cx="7.5" cy="8" r="1" fill="currentColor" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="16" cy="6" r="1" fill="currentColor" />
              </svg>
            </div>

            {/* Eyebrow */}
            <div className="tr-eyebrow" aria-hidden="true">
              <span className="tr-eye-line" />
              <span className="tr-eye-text">Est. 2026 · Premium Dining</span>
              <span className="tr-eye-line r" />
            </div>

            {/* Main title */}
            <h1 className="tr-title">
              The&nbsp;<em>Reserve</em>
              <span className="tr-title-tag">An extraordinary dining experience</span>
            </h1>

            {/* Ornament */}
            <div className="tr-orn" aria-hidden="true">
              <span className="tr-orn-line" />
              <span className="tr-orn-diamond" />
              <span className="tr-orn-line r" />
            </div>

            {/* Description */}
            <p className="tr-desc">
              Where every reservation is a promise of an unforgettable evening — crafted
              with precision, delivered with grace.
            </p>

            {/* CTA buttons */}
            <div className="tr-cta">
              <button className="tr-btn-primary" onClick={() => navigate("/restaurants")}>
                Reserve Your Table
              </button>
              <button className="tr-btn-ghost" onClick={handleExploreMenu}>
                Explore Menu ↓
              </button>
            </div>

            {/* Search island */}
            <div className="tr-search-wrap">
              <div className="tr-search-bar">
                <button
                  type="button"
                  className={`tr-loc-btn${locationLabel ? " detected" : ""}`}
                  onClick={handleDetectLocation}
                  disabled={locLoading}
                  title={locationLabel || "Detect your location"}
                >
                  <svg
                    className={`tr-loc-icon${locLoading ? " spin" : ""}`}
                    width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                  <span className="tr-loc-text">
                    {locLoading ? "Detecting…" : locationLabel || "Detect Location"}
                  </span>
                </button>

                <span className="tr-bar-div" aria-hidden="true" />

                <input
                  className="tr-search-input"
                  placeholder="Search food, category or restaurant…"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />

                <button className="tr-search-btn" onClick={handleSearch}>Search</button>
              </div>
              {locError && <div className="tr-loc-error">{locError}</div>}
            </div>

            {/* Category tabs */}
            <div className="tr-tabs-wrap">
              <div className="tr-tabs">
                {(["Dining Out", "Delivery", "Nightlife"] as HeroTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`tr-tab${activeTab === tab ? " active" : ""}`}
                    onClick={() => handleTabClick(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll hint — REMOVED as per requirement */}

          {/* Marquee strip at bottom of hero */}
          <div className="tr-marquee-strip" aria-hidden="true">
            <div className="tr-marquee-track">
              {Array.from({ length: 2 }).map((_, outer) => (
                <span key={outer} style={{ display: "flex" }}>
                  {[
                    "Fine Dining", "Premium Delivery", "Chef Curated",
                    "Farm to Table", "Award Winning", "Exclusive Menus",
                    "Michelin Inspired", "Live Entertainment",
                  ].map((txt, i) => (
                    <span key={i} className="tr-marquee-item">
                      {txt} <span className="tr-marquee-dot">◆</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────
            FOOD / MENU SECTION
        ───────────────────────────────────────── */}
        <section ref={menuRef} className="tr-menu-zone">
          <div className="tr-menu-center">

            {/* ── Docked sticky bar ── */}
            <div className="tr-docked-bar">
              <div className="tr-docked-left">
                <span className="tr-docked-label">Our Menu</span>
                <span className="tr-docked-title">
                  {activeTab === "Delivery"
                    ? "Order For Delivery"
                    : activeTab === "Nightlife"
                      ? "Nightlife Specials"
                      : "Browse Restaurants"}
                </span>
              </div>
              <div className="tr-docked-tabs">
                {(["Dining Out", "Delivery", "Nightlife"] as HeroTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`tr-docked-tab${activeTab === tab ? " active" : ""}`}
                    onClick={() => handleTabClick(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search match info */}
            {hasMatch && (
              <div className="tr-match-pill">
                <span className="tr-match-dot" />
                {filteredFoods.length} result{filteredFoods.length !== 1 ? "s" : ""} for "{appliedSearch}"
              </div>
            )}

            {/* ── Food grid ── */}
            {loadingFood ? (
              <div className="tr-skeleton-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="tr-skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            ) : pageItems.length > 0 ? (
              <div className="tr-food-grid">
                {pageItems.map((item, idx) => {
                  const prices = formatPrice(item);
                  const inCart = cartItems.find((c) => c._id === item._id);
                  const justAdded = addedCart === item._id;
                  return (
                    <div
                      key={item._id}
                      className="tr-card"
                      style={{ animationDelay: `${idx * 70}ms` }}
                      onClick={() => handleFoodClick(item)}
                      onMouseEnter={() => setCardHover(item._id)}
                      onMouseLeave={() => setCardHover(null)}
                    >
                      {/* Image */}
                      <div className="tr-card-img">
                        {item.image ? (
                          <img src={item.image} alt={item.name} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="tr-card-fallback">🍽️</div>
                        )}
                        <div className="tr-card-overlay" />
                        {item.restaurantData?.name && (
                          <div className="tr-rest-chip">{item.restaurantData.name}</div>
                        )}
                        {item.offer > 0 && (
                          <div className="tr-discount">{item.offer}% OFF</div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="tr-card-body">
                        <div className="tr-card-header">
                          <div className="tr-card-name">{item.name}</div>
                          <span className={`tr-veg-badge ${item.isVeg ? "veg" : "nonveg"}`}>
                            {item.isVeg ? "Veg" : "Non-Veg"}
                          </span>
                        </div>

                        <div className="tr-card-desc">
                          {item.description || "Chef-crafted premium dish prepared fresh for you."}
                        </div>

                        <div className="tr-card-meta">
                          <div className="tr-card-tags">
                            <span className="tr-tag">{item.category}</span>
                            <span className="tr-tag">{item.spicyLevel}</span>
                          </div>
                          <div className="tr-price">
                            <span className="tr-price-now">₹{prices.final}</span>
                            {prices.original && (
                              <span className="tr-price-old">₹{prices.original}</span>
                            )}
                          </div>
                        </div>

                        {/* Add to Cart */}
                        <div className="tr-card-cta">
                          <span className="tr-cta-hint">
                            {cardHover === item._id ? "Deliver to your door" : "Fast home delivery"}
                          </span>
                          <button
                            type="button"
                            className={`tr-cart-btn${inCart ? " incart" : ""}${justAdded ? " added" : ""}`}
                            onClick={(e) => handleAddToCart(e, item)}
                          >
                            {inCart ? (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                                In Cart ({inCart.quantity})
                              </>
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                  <line x1="3" y1="6" x2="21" y2="6" />
                                  <path d="M16 10a4 4 0 01-8 0" />
                                </svg>
                                Add to Cart
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="tr-empty">
                {hasMatch
                  ? `No items found for "${appliedSearch}".`
                  : activeTab === "Nightlife"
                    ? "No nightlife specials available right now."
                    : "No delivery items available right now."}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && pageItems.length > 0 && (
              <div className="tr-pagination">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    className={`tr-page-btn${currentPage === i + 1 ? " active" : ""}`}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      window.scrollTo({
                        top: menuRef.current ? menuRef.current.offsetTop - 100 : 0,
                        behavior: "smooth",
                      });
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="tr-divider" />
        <section className="tr-stats-zone">
          <div className="tr-stats-inner">
            <div className="tr-stats-heading">By The Numbers</div>
            <div className="tr-stats-grid">
              {[
                { num: `${allRestaurants.length || 12}+`, lbl: "Active Restaurants" },
                { num: `${allFoodItems.length || 80}+`, lbl: "Menu Items" },
                { num: "4.9 ★", lbl: "Average Rating" },
                { num: "50K+", lbl: "Happy Guests" },
              ].map((s) => (
                <div className="tr-stat" key={s.lbl}>
                  <span className="tr-stat-num">{s.num}</span>
                  <span className="tr-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OrderModal - stays inside tr-root */}
        {orderModal && selectedRestaurant && (
          <OrderModal
            isOpen={orderModal}
            onClose={() => { setOrderModal(false); setSelectedFood(null); setSelectedRestaurant(null); }}
            restaurant={selectedRestaurant}
            preSelectedItem={selectedFood}
            isDark={isDark}
          />
        )}
      </div>

      {/* ── Login Prompt Popup (OUTSIDE tr-root) ── */}
      <div
        className={`tr-popup-overlay${loginPopupVisible ? " open" : ""}`}
        onClick={() => setLoginPopupVisible(false)}
      >
        <div className="tr-popup-box" onClick={e => e.stopPropagation()}>
          <div className="tr-popup-bar" />
          <div className="tr-popup-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: "var(--gold)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="tr-popup-title">Sign in to Order</div>
          <p className="tr-popup-msg">
            Login or create an account to place orders<br />and enjoy the full experience.
          </p>
          <div className="tr-popup-btns">
            <button
              className="tr-popup-login-btn"
              onClick={() => { setLoginPopupVisible(false); setOpenLoginModal(true); }}
            >
              Login
            </button>
            <button
              className="tr-popup-close-btn"
              onClick={() => setLoginPopupVisible(false)}
            >
              Cancel
            </button>
          </div>
          <div className="tr-popup-sep" />
          <p className="tr-popup-reg">
            No account?{" "}
            <button
              className="tr-popup-reg-btn"
              onClick={() => { setLoginPopupVisible(false); setOpenRegisterModal(true); }}
            >
              Register for free
            </button>
          </p>
        </div>
      </div>

      {/* ── Modals ── */}
      <LoginModal
        isOpen={openLoginModal}
        onClose={() => setOpenLoginModal(false)}
        onSwitchToRegister={() => { setOpenLoginModal(false); setOpenRegisterModal(true); }}
      />
      <RegisterModal
        isOpen={openRegisterModal}
        onClose={() => setOpenRegisterModal(false)}
        onSwitchToLogin={() => { setOpenRegisterModal(false); setOpenLoginModal(true); }}
      />
    </>
  );
}