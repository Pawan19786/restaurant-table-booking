import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import LoginModal from "./Login";
import RegisterModal from "./Register";
import type { JSX } from "react/jsx-runtime";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FoodItem {
  id: number;
  name: string;
  category: "Dining Out" | "Delivery" | "Nightlife";
  price: number;
  rating: number;
  reviews: number;
  tag: string;
  emoji: string;
  desc: string;
  time?: string;
}

// ─── Mock food catalogue (owner-uploaded) ─────────────────────────────────────
const ALL_FOOD_ITEMS: FoodItem[] = [
  // Dining Out
  { id: 1,  name: "Wagyu Ribeye",       category: "Dining Out", price: 1850, rating: 4.9, reviews: 312, tag: "Chef's Special",  emoji: "🥩", desc: "A5 grade wagyu with truffle jus & roasted garlic confit", time: "35 min" },
  { id: 2,  name: "Truffle Pasta",      category: "Dining Out", price: 680,  rating: 4.7, reviews: 198, tag: "Vegetarian",      emoji: "🍝", desc: "Black truffle pappardelle, parmesan espuma & crispy sage", time: "20 min" },
  { id: 3,  name: "Saffron Risotto",    category: "Dining Out", price: 590,  rating: 4.6, reviews: 143, tag: "Vegetarian",      emoji: "🍚", desc: "Carnaroli rice, saffron broth, aged parmigiano reggiano", time: "25 min" },
  { id: 4,  name: "Butter Chicken",     category: "Dining Out", price: 420,  rating: 4.8, reviews: 527, tag: "Bestseller",      emoji: "🍛", desc: "Slow-cooked chicken in velvety tomato-cream sauce", time: "30 min" },
  { id: 5,  name: "Lobster Bisque",     category: "Dining Out", price: 780,  rating: 4.8, reviews: 89,  tag: "Seasonal",        emoji: "🦞", desc: "Atlantic lobster, tarragon cream & cognac flambé", time: "20 min" },
  { id: 6,  name: "Duck Confit",        category: "Dining Out", price: 920,  rating: 4.7, reviews: 201, tag: "Classic",         emoji: "🦆", desc: "Slow-cooked duck leg, cherry gastrique & dauphinoise potato", time: "40 min" },
  { id: 7,  name: "Burrata Caprese",    category: "Dining Out", price: 340,  rating: 4.5, reviews: 163, tag: "Starter",         emoji: "🧀", desc: "Imported burrata, heirloom tomatoes & basil oil", time: "10 min" },
  { id: 8,  name: "Lamb Chops",         category: "Dining Out", price: 1100, rating: 4.9, reviews: 274, tag: "Premium",         emoji: "🍖", desc: "French-trimmed rack, rosemary jus & roasted root vegetables", time: "45 min" },
  { id: 9,  name: "Salmon Gravlax",     category: "Dining Out", price: 560,  rating: 4.6, reviews: 118, tag: "Signature",       emoji: "🐟", desc: "Nordic-cured salmon, crème fraîche, caviar & dill", time: "15 min" },

  // Delivery
  { id: 10, name: "Classic Smashburger",category: "Delivery",   price: 380,  rating: 4.8, reviews: 712, tag: "Bestseller",      emoji: "🍔", desc: "Double smash patty, American cheese, house sauce & pickles", time: "25 min" },
  { id: 11, name: "Pepperoni Pizza",    category: "Delivery",   price: 450,  rating: 4.7, reviews: 488, tag: "Most Ordered",    emoji: "🍕", desc: "Hand-stretched sourdough, San Marzano tomato, spicy pepperoni", time: "30 min" },
  { id: 12, name: "Chicken Biryani",    category: "Delivery",   price: 320,  rating: 4.9, reviews: 901, tag: "Top Pick",        emoji: "🍲", desc: "Dum-style basmati rice, tender chicken & fried onion raita", time: "35 min" },
  { id: 13, name: "Paneer Tikka Wrap",  category: "Delivery",   price: 240,  rating: 4.5, reviews: 367, tag: "Vegetarian",      emoji: "🌯", desc: "Tandoor-kissed paneer, mint chutney & onion in a rumali roti", time: "20 min" },
  { id: 14, name: "Spicy Ramen",        category: "Delivery",   price: 360,  rating: 4.7, reviews: 245, tag: "New",             emoji: "🍜", desc: "Tonkotsu broth, chashu pork, soft egg & black garlic oil", time: "30 min" },
  { id: 15, name: "Loaded Nachos",      category: "Delivery",   price: 290,  rating: 4.4, reviews: 198, tag: "Snack",           emoji: "🧆", desc: "Tortilla chips, jalapeño cheese sauce, salsa & guac", time: "15 min" },
  { id: 16, name: "Sushi Platter",      category: "Delivery",   price: 680,  rating: 4.8, reviews: 334, tag: "Premium",         emoji: "🍣", desc: "12-piece nigiri selection with tamago, salmon & tuna", time: "40 min" },
  { id: 17, name: "BBQ Pulled Pork",    category: "Delivery",   price: 420,  rating: 4.6, reviews: 279, tag: "Smoky",           emoji: "🌮", desc: "Slow-smoked pork shoulder, bourbon BBQ, brioche bun & slaw", time: "30 min" },
  { id: 18, name: "Vegan Buddha Bowl",  category: "Delivery",   price: 310,  rating: 4.5, reviews: 156, tag: "Healthy",         emoji: "🥗", desc: "Quinoa, roasted chickpeas, tahini drizzle & mixed greens", time: "20 min" },

  // Nightlife
  { id: 19, name: "Espresso Martini",   category: "Nightlife",  price: 450,  rating: 4.9, reviews: 621, tag: "Signature Cocktail", emoji: "🍸", desc: "Cold-brew espresso, Kahlúa, Absolut Vanilla — shaken hard", time: "5 min" },
  { id: 20, name: "Truffle Bruschetta", category: "Nightlife",  price: 320,  rating: 4.7, reviews: 213, tag: "Bar Bites",       emoji: "🥂", desc: "Sourdough crostini, black truffle ricotta & honeycomb drizzle", time: "10 min" },
  { id: 21, name: "Smoky Old Fashioned",category: "Nightlife",  price: 520,  rating: 4.8, reviews: 389, tag: "Classic",         emoji: "🥃", desc: "Bulleit Bourbon, cherry bitters & cedar wood smoke cloche", time: "7 min" },
  { id: 22, name: "Wagyu Sliders",      category: "Nightlife",  price: 680,  rating: 4.9, reviews: 174, tag: "Late Night",      emoji: "🍢", desc: "Mini A5 wagyu patties, truffle mayo & micro greens — trio", time: "15 min" },
  { id: 23, name: "Negroni Sbagliato",  category: "Nightlife",  price: 430,  rating: 4.6, reviews: 298, tag: "Trending",        emoji: "🍹", desc: "Campari, Martini Rosso & Prosecco — the viral twist", time: "5 min" },
  { id: 24, name: "Tuna Tataki",        category: "Nightlife",  price: 580,  rating: 4.8, reviews: 201, tag: "Raw Bar",         emoji: "🐠", desc: "Seared yellowfin, sesame crust, ponzu & pickled ginger", time: "12 min" },
  { id: 25, name: "Chocolate Fondant",  category: "Nightlife",  price: 390,  rating: 4.9, reviews: 443, tag: "Dessert",         emoji: "🍫", desc: "Molten Valrhona chocolate, vanilla ice cream & gold dust", time: "20 min" },
  { id: 26, name: "Mezze Platter",      category: "Nightlife",  price: 480,  rating: 4.5, reviews: 167, tag: "Share",           emoji: "🫙", desc: "Hummus, baba ganoush, falafel, pita & pickled vegetables", time: "15 min" },
  { id: 27, name: "Berry Mojito",       category: "Nightlife",  price: 360,  rating: 4.7, reviews: 312, tag: "Fresh",           emoji: "🫐", desc: "White rum, mixed berries, fresh mint & prosecco splash", time: "5 min" },
];

const CARDS_PER_PAGE = 6;

export default function HeroSection() {
  const [isDark,             setIsDark]             = useState(true);
  const [openLoginModal,     setOpenLoginModal]     = useState(false);
  const [openRegisterModal,  setOpenRegisterModal]  = useState(false);
  const [activeLink,         setActiveLink]         = useState("Home");
  const [searchValue,        setSearchValue]        = useState("");
  const [foodSearch,         setFoodSearch]         = useState("");
  const [locLoading,         setLocLoading]         = useState(false);
  const [locError,           setLocError]           = useState("");
  const [activeCategory,     setActiveCategory]     = useState<FoodItem["category"]>("Dining Out");
  const [currentPage,        setCurrentPage]        = useState(1);
  const [menuExplored,       setMenuExplored]       = useState(false);
  const [heroVisible,        setHeroVisible]        = useState(true);
  const [cardHover,          setCardHover]          = useState<number | null>(null);

  const navigate     = useNavigate();
  const foodSectionRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  const handleReserveClick = () => {
    const token = localStorage.getItem("token");
    if (token) navigate("/book-table");
    else setOpenLoginModal(true);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported."); return; }
    setLocLoading(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await res.json(); const a = d.address;
          const loc = [a.suburb||a.neighbourhood||a.village, a.city||a.town||a.county, a.state].filter(Boolean).join(", ");
          setSearchValue(loc || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setTimeout(() => navigate(`/restaurants?location=${encodeURIComponent(loc)}&lat=${lat}&lng=${lng}`), 600);
        } catch {
          const fb = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setSearchValue(fb);
          setTimeout(() => navigate(`/restaurants?location=${encodeURIComponent(fb)}`), 600);
        } finally { setLocLoading(false); }
      },
      (err) => {
        setLocLoading(false);
        setLocError(err.code === err.PERMISSION_DENIED ? "Location access denied." : "Could not detect location.");
        setTimeout(() => setLocError(""), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearch = () => { if (searchValue.trim()) navigate(`/restaurants?q=${encodeURIComponent(searchValue.trim())}`); };
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleSearch(); };

  // ── "Explore Menu" click — collapse hero, scroll to food cards ──────────────
  const handleExploreMenu = () => {
    setMenuExplored(true);
    setHeroVisible(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  };

  // ── Back to hero ──────────────────────────────────────────────────────────────
  const handleBackToHero = () => {
    setHeroVisible(true);
    setMenuExplored(false);
    setTimeout(() => {
      heroContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // ── Food filtering + search ──────────────────────────────────────────────────
  const filteredFoods = useMemo(() => {
    const base = ALL_FOOD_ITEMS.filter(f => f.category === activeCategory);
    if (!foodSearch.trim()) return base;
    const q = foodSearch.toLowerCase();
    const matched   = base.filter(f => f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q) || f.tag.toLowerCase().includes(q));
    const unmatched = base.filter(f => !matched.includes(f));
    return [...matched, ...unmatched];
  }, [activeCategory, foodSearch]);

  // reset page when category / search changes
  useEffect(() => { setCurrentPage(1); }, [activeCategory, foodSearch]);

  const totalPages  = Math.ceil(filteredFoods.length / CARDS_PER_PAGE);
  const pageItems   = filteredFoods.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);
  const hasMatch    = foodSearch.trim().length > 0;

  const categories: { label: FoodItem["category"]; icon: JSX.Element }[] = [
    {
      label: "Dining Out",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 2v7c0 1.1.9 2 2 2h4v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 2v20M18 2v6a4 4 0 01-4 4v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>,
    },
    {
      label: "Delivery",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 10h3l3 3v4h-6V10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="1.8"/>
      </svg>,
    },
    {
      label: "Nightlife",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M8 2h8l-2 7h-4L8 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M10 9v7M14 9v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M6 16h12v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>,
    },
  ];

  const th = isDark ? "dark" : "light";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600&family=Cinzel:wght@400;500;700&display=swap');

        @keyframes hs-fadeUp    { from{opacity:0;transform:translateY(24px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes hs-scaleIn   { from{opacity:0;transform:scale(0.82)}        to{opacity:1;transform:scale(1)} }
        @keyframes hs-shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes hs-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes hs-pulse-ring{ 0%{transform:scale(0.9);opacity:0.5} 100%{transform:scale(1.6);opacity:0} }
        @keyframes hs-orb-drift { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.1)} 66%{transform:translate(-30px,20px) scale(0.95)} }
        @keyframes hs-line-exp  { from{width:0;opacity:0} to{width:80px;opacity:1} }
        @keyframes hs-badge-l   { from{opacity:0;transform:translateX(-16px) scale(0.92)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes hs-badge-r   { from{opacity:0;transform:translateX(16px) scale(0.92)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes hs-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes hs-err-in    { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fc-pop       { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fc-match-glow{ 0%,100%{box-shadow:0 0 0 0 rgba(160,96,240,0)} 50%{box-shadow:0 0 0 4px rgba(160,96,240,0.35)} }
        @keyframes hs-hero-hide { from{opacity:1;max-height:1200px} to{opacity:0;max-height:0} }
        @keyframes hs-hero-show { from{opacity:0;max-height:0} to{opacity:1;max-height:1200px} }

        /* ROOT */
        .hs-root { min-height:100vh; position:relative; overflow-x:hidden; font-family:'Montserrat',sans-serif; transition:background 0.5s; }
        .hs-root.dark  { background:#0a0418; color:#f5f0ff; }
        .hs-root.light { background:#f0ebff; color:#1a0840; }

        /* ORBS */
        .hs-orb { position:absolute; border-radius:50%; pointer-events:none; z-index:0; filter:blur(80px); animation:hs-orb-drift 18s ease-in-out infinite; }
        .hs-orb-1 { width:600px;height:600px;top:-200px;left:-150px;animation-delay:0s }
        .hs-orb-2 { width:500px;height:500px;bottom:-150px;right:-100px;animation-delay:-6s }
        .hs-orb-3 { width:400px;height:400px;top:40%;left:50%;transform:translateX(-50%);animation-delay:-12s }
        .dark  .hs-orb-1{background:radial-gradient(circle,rgba(112,48,208,.35) 0%,transparent 70%)}
        .dark  .hs-orb-2{background:radial-gradient(circle,rgba(80,20,180,.3) 0%,transparent 70%)}
        .dark  .hs-orb-3{background:radial-gradient(circle,rgba(160,96,240,.12) 0%,transparent 70%)}
        .light .hs-orb-1{background:radial-gradient(circle,rgba(140,80,240,.18) 0%,transparent 70%)}
        .light .hs-orb-2{background:radial-gradient(circle,rgba(100,40,200,.14) 0%,transparent 70%)}
        .light .hs-orb-3{background:radial-gradient(circle,rgba(180,130,255,.1) 0%,transparent 70%)}

        /* GRID + VIGNETTE */
        .hs-grid { position:absolute;inset:0;z-index:1;pointer-events:none }
        .dark  .hs-grid { background-image:linear-gradient(rgba(160,96,240,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(160,96,240,.04) 1px,transparent 1px);background-size:72px 72px }
        .light .hs-grid { background-image:linear-gradient(rgba(100,40,200,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(100,40,200,.05) 1px,transparent 1px);background-size:72px 72px }
        .hs-vignette { position:absolute;inset:0;z-index:2;pointer-events:none }
        .dark  .hs-vignette { background:radial-gradient(ellipse at 50% 40%,rgba(26,8,64,.2) 0%,rgba(8,4,18,.7) 80%) }
        .light .hs-vignette { background:radial-gradient(ellipse at 50% 40%,rgba(240,235,255,.1) 0%,rgba(230,220,255,.5) 80%) }

        /* FLOATING BADGES */
        .hs-badge { position:absolute;z-index:15;padding:10px 16px;border-radius:12px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px) }
        .dark  .hs-badge { background:rgba(255,255,255,.04);border:1px solid rgba(180,130,255,.18);box-shadow:0 8px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.06) }
        .light .hs-badge { background:rgba(255,255,255,.65);border:1px solid rgba(140,80,220,.2);box-shadow:0 8px 32px rgba(100,40,200,.1),inset 0 1px 0 rgba(255,255,255,.8) }
        .hs-badge-l { left:3%;top:40%;animation:hs-badge-l .6s cubic-bezier(.34,1.56,.64,1) 1.4s both,hs-float 6s ease-in-out infinite }
        .hs-badge-r { right:3%;top:46%;animation:hs-badge-r .6s cubic-bezier(.34,1.56,.64,1) 1.6s both,hs-float 6s ease-in-out -3s infinite }
        .hs-badge-indicator { display:flex;align-items:center;gap:5px;margin-bottom:3px }
        .hs-badge-dot  { width:6px;height:6px;border-radius:50%;background:#a060f0;box-shadow:0 0 8px rgba(160,96,240,.8) }
        .hs-badge-label{ font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#a060f0 }
        .hs-badge-text { font-size:11px;font-weight:300;letter-spacing:.03em }
        .dark  .hs-badge-text { color:rgba(220,200,255,.75) }
        .light .hs-badge-text { color:rgba(60,20,120,.7) }

        /* HERO CONTENT WRAPPER */
        .hs-hero-content {
          overflow:hidden;
          transition:opacity 0.55s cubic-bezier(.4,0,.2,1), max-height 0.65s cubic-bezier(.4,0,.2,1);
        }
        .hs-hero-content.visible  { opacity:1; max-height:1400px; }
        .hs-hero-content.hidden   { opacity:0; max-height:0; pointer-events:none; }

        /* HERO INNER */
        .hs-hero { position:relative;z-index:10;text-align:center;padding:48px 24px 32px;display:flex;flex-direction:column;align-items:center;gap:0 }

        /* CROWN */
        .hs-crown-wrap { position:relative;margin-bottom:20px;animation:hs-scaleIn .6s cubic-bezier(.34,1.56,.64,1) .2s both }
        .hs-crown-ring { position:absolute;width:80px;height:80px;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);border:1px solid rgba(160,96,240,.2);animation:hs-pulse-ring 3s ease-out infinite }
        .hs-crown-ring-2 { animation-delay:1.5s }

        /* EYEBROW */
        .hs-eyebrow { display:flex;align-items:center;gap:14px;margin-bottom:18px;animation:hs-fadeUp .5s ease .4s both }
        .hs-ey-line  { height:1px;width:80px;background:linear-gradient(90deg,transparent,rgba(160,96,240,.6));animation:hs-line-exp .8s ease .6s both }
        .hs-ey-line-r{ background:linear-gradient(270deg,transparent,rgba(160,96,240,.6)) }
        .hs-ey-text  { font-size:11px;font-weight:500;letter-spacing:.22em;text-transform:uppercase }
        .dark  .hs-ey-text { color:rgba(200,160,255,.6) }
        .light .hs-ey-text { color:rgba(100,40,160,.55) }

        /* TITLE */
        .hs-title { font-family:'Cinzel',serif;font-size:clamp(2.6rem,6vw,5.2rem);font-weight:400;letter-spacing:.12em;line-height:1;margin:0 0 8px;animation:hs-fadeUp .6s ease .5s both }
        .dark  .hs-title { background:linear-gradient(135deg,#d4b0ff 0%,#f8f0ff 40%,#c080ff 70%,#a060e0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text }
        .light .hs-title { background:linear-gradient(135deg,#4a1d96 0%,#7c3aed 50%,#5b21b6 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text }
        .hs-title-sub { display:block;font-size:clamp(.65rem,1.2vw,.9rem);letter-spacing:.28em;margin-top:10px }
        .dark  .hs-title-sub { color:rgba(200,170,255,.45) }
        .light .hs-title-sub { color:rgba(90,30,140,.4) }

        /* ORNAMENT */
        .hs-ornate { display:flex;align-items:center;gap:12px;margin:18px 0;animation:hs-fadeUp .5s ease .65s both }
        .hs-orn-line   { height:1px;flex:1;max-width:120px }
        .dark  .hs-orn-line   { background:linear-gradient(90deg,transparent,rgba(160,96,240,.25)) }
        .light .hs-orn-line   { background:linear-gradient(90deg,transparent,rgba(120,60,200,.2)) }
        .hs-orn-line-r { background:linear-gradient(270deg,transparent,rgba(160,96,240,.25)) !important }
        .light .hs-orn-line-r { background:linear-gradient(270deg,transparent,rgba(120,60,200,.2)) !important }
        .hs-orn-gems { display:flex;align-items:center;gap:6px }
        .hs-gem { border-radius:50% }
        .hs-gem-sm { width:5px;height:5px }
        .hs-gem-lg { width:9px;height:9px }
        .dark  .hs-gem { background:radial-gradient(circle,#c090ff,#7030d0);box-shadow:0 0 8px rgba(160,96,240,.6) }
        .light .hs-gem { background:radial-gradient(circle,#8b5cf6,#4c1d95);box-shadow:0 0 6px rgba(124,58,237,.4) }

        /* DESCRIPTION */
        .hs-desc { font-size:clamp(.82rem,1.4vw,1rem);font-weight:300;line-height:1.8;max-width:480px;margin:0 auto 26px;animation:hs-fadeUp .5s ease .75s both }
        .dark  .hs-desc { color:rgba(210,190,255,.6) }
        .light .hs-desc { color:rgba(80,30,130,.55) }

        /* CTA */
        .hs-cta { display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:32px;animation:hs-fadeUp .5s ease .85s both }
        .hs-btn-book,.hs-btn-explore { padding:13px 28px;border-radius:10px;font-family:'Montserrat',sans-serif;font-size:.82rem;font-weight:600;letter-spacing:.08em;cursor:pointer;transition:all .25s;border:none;text-transform:uppercase }
        .dark  .hs-btn-book  { background:linear-gradient(135deg,#7030d0,#a060f0);color:#fff;box-shadow:0 4px 20px rgba(112,48,208,.4) }
        .light .hs-btn-book  { background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;box-shadow:0 4px 16px rgba(79,70,229,.35) }
        .hs-btn-book:hover    { transform:translateY(-2px);filter:brightness(1.1) }
        .dark  .hs-btn-explore { background:transparent;color:rgba(200,160,255,.85);border:1px solid rgba(160,96,240,.35) }
        .light .hs-btn-explore { background:transparent;color:#5b21b6;border:1px solid rgba(124,58,237,.4) }
        .hs-btn-explore:hover  { transform:translateY(-2px) }
        .dark  .hs-btn-explore:hover { background:rgba(160,96,240,.08);border-color:rgba(160,96,240,.6) }
        .light .hs-btn-explore:hover { background:rgba(124,58,237,.06);border-color:rgba(124,58,237,.6) }

        /* SEARCH BAR */
        .hs-search-section { width:100%;max-width:640px;margin:0 auto 28px;animation:hs-fadeUp .5s ease .95s both }
        .hs-search-wrap { display:flex;align-items:center;border-radius:14px;overflow:hidden;height:52px }
        .dark  .hs-search-wrap { background:rgba(255,255,255,.04);border:1px solid rgba(160,96,240,.2);box-shadow:0 4px 24px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.04) }
        .light .hs-search-wrap { background:rgba(255,255,255,.8);border:1px solid rgba(120,60,200,.18);box-shadow:0 4px 24px rgba(100,40,200,.08) }
        .hs-loc-btn { flex-shrink:0;display:flex;align-items:center;gap:6px;padding:0 16px;height:100%;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:.73rem;font-weight:500;letter-spacing:.04em;transition:all .2s;white-space:nowrap }
        .dark  .hs-loc-btn { background:transparent;color:rgba(180,140,255,.7) }
        .light .hs-loc-btn { background:transparent;color:rgba(90,30,150,.6) }
        .hs-loc-btn:hover:not(:disabled) { opacity:.85 }
        .hs-loc-icon { transition:all .3s }
        .hs-loc-icon.spinning { animation:hs-spin 1s linear infinite }
        .hs-search-divider { width:1px;height:26px;flex-shrink:0 }
        .dark  .hs-search-divider { background:rgba(160,96,240,.2) }
        .light .hs-search-divider { background:rgba(120,60,200,.15) }
        .hs-search-input { flex:1;height:100%;padding:0 14px;border:none;background:transparent;font-family:'Montserrat',sans-serif;font-size:.85rem;font-weight:400;outline:none }
        .dark  .hs-search-input { color:#f5f0ff }
        .light .hs-search-input { color:#1a0840 }
        .hs-search-input::placeholder { color:rgba(160,120,220,.45) }
        .hs-search-btn { flex-shrink:0;padding:0 20px;height:100%;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:.78rem;font-weight:600;letter-spacing:.06em;transition:all .2s }
        .dark  .hs-search-btn { background:linear-gradient(135deg,#7030d0,#a060f0);color:#fff }
        .light .hs-search-btn { background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff }
        .hs-search-btn:hover { filter:brightness(1.12) }
        .hs-loc-error { display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.74rem;animation:hs-err-in .3s ease both }
        .dark  .hs-loc-error { color:rgba(255,110,110,.8) }
        .light .hs-loc-error { color:#dc2626 }

        /* CATEGORY TABS */
        .hs-cats-wrap { display:flex;align-items:center;gap:4px;padding:6px;border-radius:14px;margin-bottom:28px;animation:hs-fadeUp .5s ease 1s both }
        .dark  .hs-cats-wrap { background:rgba(255,255,255,.03);border:1px solid rgba(160,96,240,.12) }
        .light .hs-cats-wrap { background:rgba(255,255,255,.5);border:1px solid rgba(120,60,200,.12) }
        .hs-cat-sep { width:1px;height:18px }
        .dark  .hs-cat-sep { background:rgba(160,96,240,.15) }
        .light .hs-cat-sep { background:rgba(120,60,200,.12) }
        .hs-cat-btn { display:flex;align-items:center;gap:7px;padding:9px 20px;border-radius:10px;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:.78rem;font-weight:500;letter-spacing:.04em;transition:all .22s;white-space:nowrap }
        .dark  .hs-cat-btn { background:transparent;color:rgba(200,170,255,.55) }
        .light .hs-cat-btn { background:transparent;color:rgba(90,30,150,.5) }
        .hs-cat-btn:hover:not(.active) { background:rgba(160,96,240,.08) }
        .dark  .hs-cat-btn.active { background:linear-gradient(135deg,rgba(112,48,208,.45),rgba(160,96,240,.35));color:#f0e0ff;box-shadow:0 2px 12px rgba(112,48,208,.3),inset 0 1px 0 rgba(255,255,255,.08) }
        .light .hs-cat-btn.active { background:linear-gradient(135deg,rgba(79,70,229,.15),rgba(124,58,237,.1));color:#4c1d95;box-shadow:0 2px 8px rgba(79,70,229,.15) }
        .hs-cat-btn-icon { line-height:0;transition:transform .2s }
        .hs-cat-btn.active .hs-cat-btn-icon { transform:scale(1.1) }

        /* STATS */
        .hs-stats { display:flex;gap:0;border-radius:14px;overflow:hidden;margin-bottom:0;animation:hs-fadeUp .5s ease 1.1s both }
        .dark  .hs-stats { border:1px solid rgba(160,96,240,.1) }
        .light .hs-stats { border:1px solid rgba(120,60,200,.1) }
        .hs-stat { flex:1;display:flex;flex-direction:column;align-items:center;padding:14px 24px;gap:3px }
        .dark  .hs-stat { background:rgba(255,255,255,.02) }
        .light .hs-stat { background:rgba(255,255,255,.45) }
        .hs-stat+.hs-stat { border-left:1px solid }
        .dark  .hs-stat+.hs-stat { border-color:rgba(160,96,240,.08) }
        .light .hs-stat+.hs-stat { border-color:rgba(120,60,200,.08) }
        .hs-stat-num { font-family:'Cinzel',serif;font-size:1.1rem;font-weight:500 }
        .dark  .hs-stat-num { color:#c090ff }
        .light .hs-stat-num { color:#5b21b6 }
        .hs-stat-lbl { font-size:.68rem;font-weight:400;letter-spacing:.06em }
        .dark  .hs-stat-lbl { color:rgba(180,150,230,.45) }
        .light .hs-stat-lbl { color:rgba(90,30,140,.45) }

        /* ═══════════════ FOOD SECTION ═══════════════ */

        /* BACK BUTTON (shown when hero is hidden) */
        .hs-back-btn {
          display:flex;align-items:center;gap:8px;
          margin:16px 0 0 24px;
          padding:8px 18px;
          border-radius:8px;border:none;cursor:pointer;
          font-family:'Montserrat',sans-serif;font-size:.78rem;font-weight:600;
          letter-spacing:.06em;text-transform:uppercase;
          transition:all .22s;
          width:fit-content;
          position:relative;z-index:10;
        }
        .dark  .hs-back-btn { background:rgba(160,96,240,.12);color:rgba(200,160,255,.8);border:1px solid rgba(160,96,240,.2) }
        .light .hs-back-btn { background:rgba(124,58,237,.08);color:#5b21b6;border:1px solid rgba(124,58,237,.2) }
        .hs-back-btn:hover { transform:translateX(-2px);opacity:.85 }

        .hs-food-section { position:relative;z-index:10;padding:32px 24px 64px }

        /* FOOD SECTION HEADER */
        .hs-food-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:28px }
        .hs-food-title-block { display:flex;flex-direction:column;gap:4px }
        .hs-food-section-label { font-size:.68rem;font-weight:600;letter-spacing:.22em;text-transform:uppercase }
        .dark  .hs-food-section-label { color:rgba(160,96,240,.7) }
        .light .hs-food-section-label { color:rgba(100,40,160,.6) }
        .hs-food-section-title { font-family:'Cinzel',serif;font-size:1.55rem;font-weight:400;letter-spacing:.06em }
        .dark  .hs-food-section-title { color:#e8d8ff }
        .light .hs-food-section-title { color:#3b0764 }

        /* FOOD SEARCH BAR */
        .hs-food-search-wrap {
          display:flex;align-items:center;border-radius:10px;overflow:hidden;height:44px;
          max-width:340px;width:100%;
        }
        .dark  .hs-food-search-wrap { background:rgba(255,255,255,.04);border:1px solid rgba(160,96,240,.18) }
        .light .hs-food-search-wrap { background:rgba(255,255,255,.8);border:1px solid rgba(120,60,200,.15) }
        .hs-food-search-icon { padding:0 12px;flex-shrink:0;opacity:.5 }
        .hs-food-search-input { flex:1;height:100%;border:none;background:transparent;font-family:'Montserrat',sans-serif;font-size:.82rem;outline:none;padding-right:10px }
        .dark  .hs-food-search-input { color:#f5f0ff }
        .light .hs-food-search-input { color:#1a0840 }
        .hs-food-search-input::placeholder { color:rgba(160,120,220,.4) }
        .hs-food-search-clear { padding:0 10px;flex-shrink:0;background:none;border:none;cursor:pointer;font-size:.9rem;opacity:.5;transition:opacity .15s }
        .hs-food-search-clear:hover { opacity:.85 }

        /* CATEGORY FILTER TABS (food section) */
        .hs-food-cats { display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap }
        .hs-food-cat-btn {
          display:flex;align-items:center;gap:7px;padding:8px 18px;border-radius:30px;
          border:none;cursor:pointer;font-family:'Montserrat',sans-serif;
          font-size:.76rem;font-weight:500;letter-spacing:.04em;transition:all .2s;
        }
        .dark  .hs-food-cat-btn { background:rgba(255,255,255,.04);color:rgba(200,170,255,.55);border:1px solid rgba(160,96,240,.12) }
        .light .hs-food-cat-btn { background:rgba(255,255,255,.5);color:rgba(90,30,150,.5);border:1px solid rgba(120,60,200,.12) }
        .dark  .hs-food-cat-btn.active { background:linear-gradient(135deg,rgba(112,48,208,.5),rgba(160,96,240,.4));color:#f0e0ff;border-color:rgba(160,96,240,.3);box-shadow:0 2px 12px rgba(112,48,208,.25) }
        .light .hs-food-cat-btn.active { background:linear-gradient(135deg,rgba(79,70,229,.18),rgba(124,58,237,.12));color:#4c1d95;border-color:rgba(124,58,237,.3) }
        .hs-food-cat-btn:hover:not(.active) { opacity:.8 }

        /* MATCH BADGE */
        .hs-match-info { display:flex;align-items:center;gap:8px;margin-bottom:18px;font-size:.76rem;padding:8px 14px;border-radius:8px;width:fit-content }
        .dark  .hs-match-info { background:rgba(160,96,240,.1);border:1px solid rgba(160,96,240,.2);color:rgba(200,160,255,.8) }
        .light .hs-match-info { background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.18);color:#5b21b6 }
        .hs-match-dot { width:6px;height:6px;border-radius:50%;background:#a060f0;animation:fc-match-glow 1.5s ease-in-out infinite }

        /* FOOD GRID */
        .hs-food-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
          gap:20px;
          margin-bottom:32px;
        }

        /* FOOD CARD */
        .fc {
          border-radius:16px;overflow:hidden;
          transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
          cursor:pointer;
          animation:fc-pop .4s cubic-bezier(.34,1.56,.64,1) both;
          position:relative;
        }
        .fc:hover { transform:translateY(-5px) scale(1.015) }
        .dark  .fc { background:rgba(255,255,255,.035);border:1px solid rgba(160,96,240,.12);box-shadow:0 4px 24px rgba(0,0,0,.35) }
        .light .fc { background:rgba(255,255,255,.75);border:1px solid rgba(120,60,200,.12);box-shadow:0 4px 20px rgba(80,30,160,.08) }
        .dark  .fc:hover { box-shadow:0 12px 40px rgba(112,48,208,.28),0 0 0 1px rgba(160,96,240,.2) }
        .light .fc:hover { box-shadow:0 12px 36px rgba(79,70,229,.18),0 0 0 1px rgba(124,58,237,.2) }
        .fc.match-highlight { animation:fc-pop .35s cubic-bezier(.34,1.56,.64,1) both }
        .dark  .fc.match-highlight { border-color:rgba(160,96,240,.4);box-shadow:0 0 0 1px rgba(160,96,240,.3),0 6px 28px rgba(112,48,208,.35) }
        .light .fc.match-highlight { border-color:rgba(124,58,237,.45);box-shadow:0 0 0 1px rgba(124,58,237,.25),0 6px 24px rgba(79,70,229,.2) }

        /* CARD EMOJI ZONE */
        .fc-emoji-zone {
          height:110px;
          display:flex;align-items:center;justify-content:center;
          font-size:3.8rem;
          position:relative;
          overflow:hidden;
        }
        .dark  .fc-emoji-zone { background:linear-gradient(135deg,rgba(112,48,208,.25),rgba(60,10,120,.3)) }
        .light .fc-emoji-zone { background:linear-gradient(135deg,rgba(124,58,237,.1),rgba(79,70,229,.08)) }
        .fc-emoji-zone::after {
          content:'';position:absolute;inset:0;
          background:radial-gradient(circle at 60% 40%,rgba(255,255,255,.06),transparent 60%);
        }

        /* MATCH BADGE ON CARD */
        .fc-match-badge {
          position:absolute;top:10px;right:10px;
          padding:3px 10px;border-radius:20px;
          font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
          background:linear-gradient(135deg,#7030d0,#a060f0);color:#fff;
          box-shadow:0 2px 10px rgba(112,48,208,.4);
          z-index:2;
        }

        /* CARD BODY */
        .fc-body { padding:14px 16px 16px }
        .fc-top { display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px }
        .fc-name { font-family:'Cinzel',serif;font-size:.92rem;font-weight:400;letter-spacing:.04em;line-height:1.3 }
        .dark  .fc-name { color:#ede0ff }
        .light .fc-name { color:#2e1065 }
        .fc-tag { padding:2px 9px;border-radius:20px;font-size:.6rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;flex-shrink:0 }
        .dark  .fc-tag { background:rgba(160,96,240,.14);color:#c090ff;border:1px solid rgba(160,96,240,.2) }
        .light .fc-tag { background:rgba(124,58,237,.09);color:#6d28d9;border:1px solid rgba(124,58,237,.18) }
        .fc-desc { font-size:.74rem;line-height:1.6;margin-bottom:12px }
        .dark  .fc-desc { color:rgba(190,165,230,.5) }
        .light .fc-desc { color:rgba(80,30,130,.5) }
        .fc-footer { display:flex;align-items:center;justify-content:space-between }
        .fc-price { font-family:'Cinzel',serif;font-size:1rem;font-weight:500 }
        .dark  .fc-price { color:#d4a0ff }
        .light .fc-price { color:#5b21b6 }
        .fc-meta { display:flex;align-items:center;gap:10px }
        .fc-rating { display:flex;align-items:center;gap:4px;font-size:.72rem;font-weight:600 }
        .dark  .fc-rating { color:#fbbf24 }
        .light .fc-rating { color:#d97706 }
        .fc-reviews { font-size:.66rem }
        .dark  .fc-reviews { color:rgba(180,150,220,.4) }
        .light .fc-reviews { color:rgba(90,30,140,.4) }
        .fc-time { display:flex;align-items:center;gap:3px;font-size:.66rem }
        .dark  .fc-time { color:rgba(180,150,220,.45) }
        .light .fc-time { color:rgba(90,30,140,.45) }

        /* ADD TO CART OVERLAY */
        .fc-add-btn {
          position:absolute;bottom:12px;right:12px;
          width:32px;height:32px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          border:none;cursor:pointer;font-size:1rem;
          transition:all .2s;
          opacity:0;transform:scale(0.8);
        }
        .fc:hover .fc-add-btn { opacity:1;transform:scale(1) }
        .dark  .fc-add-btn { background:linear-gradient(135deg,#7030d0,#a060f0);box-shadow:0 3px 12px rgba(112,48,208,.4) }
        .light .fc-add-btn { background:linear-gradient(135deg,#4f46e5,#7c3aed);box-shadow:0 3px 10px rgba(79,70,229,.35) }
        .fc-add-btn:hover { transform:scale(1.1) !important;filter:brightness(1.12) }

        /* EMPTY STATE */
        .hs-food-empty { text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:12px }
        .hs-food-empty-icon { font-size:3.5rem;opacity:.4 }
        .hs-food-empty-title { font-family:'Cinzel',serif;font-size:1rem;letter-spacing:.06em }
        .dark  .hs-food-empty-title { color:rgba(200,160,255,.5) }
        .light .hs-food-empty-title { color:rgba(90,30,140,.4) }
        .hs-food-empty-sub { font-size:.76rem }
        .dark  .hs-food-empty-sub { color:rgba(180,140,230,.35) }
        .light .hs-food-empty-sub { color:rgba(90,30,140,.35) }

        /* PAGINATION */
        .hs-pagination { display:flex;align-items:center;justify-content:center;gap:8px }
        .hs-page-btn {
          width:36px;height:36px;border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          border:none;cursor:pointer;
          font-family:'Montserrat',sans-serif;font-size:.8rem;font-weight:500;
          transition:all .2s;
        }
        .dark  .hs-page-btn { background:rgba(255,255,255,.04);color:rgba(200,170,255,.6);border:1px solid rgba(160,96,240,.12) }
        .light .hs-page-btn { background:rgba(255,255,255,.6);color:rgba(90,30,150,.5);border:1px solid rgba(120,60,200,.12) }
        .hs-page-btn:hover:not(:disabled):not(.active) { opacity:.8 }
        .dark  .hs-page-btn.active { background:linear-gradient(135deg,#7030d0,#a060f0);color:#fff;border-color:transparent;box-shadow:0 2px 10px rgba(112,48,208,.3) }
        .light .hs-page-btn.active { background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-color:transparent }
        .hs-page-btn:disabled { opacity:.3;cursor:not-allowed }
        .hs-page-info { font-size:.72rem;padding:0 8px }
        .dark  .hs-page-info { color:rgba(180,140,230,.45) }
        .light .hs-page-info { color:rgba(90,30,140,.4) }

        /* RESPONSIVE */
        @media(max-width:768px){
          .hs-food-grid { grid-template-columns:repeat(auto-fill,minmax(240px,1fr)) }
          .hs-food-header { flex-direction:column;align-items:flex-start }
          .hs-food-search-wrap { max-width:100% }
          .hs-badge-l,.hs-badge-r { display:none }
          .hs-stats { flex-wrap:wrap }
          .hs-stat { min-width:80px }
        }
      `}</style>

      <div className={`hs-root ${th}`}>
        {/* BG layers */}
        <div className="hs-orb hs-orb-1"/>
        <div className="hs-orb hs-orb-2"/>
        <div className="hs-orb hs-orb-3"/>
        <div className="hs-grid"/>
        <div className="hs-vignette"/>

        {/* Navbar */}
        <Navbar
          isDark={isDark} setIsDark={setIsDark}
          onLoginOpen={() => setOpenLoginModal(true)}
          onRegisterOpen={() => setOpenRegisterModal(true)}
          activeLink={activeLink} setActiveLink={setActiveLink}
        />

        {/* Floating badges (only when hero visible) */}
        {heroVisible && (
          <>
            <div className="hs-badge hs-badge-l">
              <div className="hs-badge-indicator"><span className="hs-badge-dot"/><span className="hs-badge-label">Now Serving</span></div>
              <div className="hs-badge-text">Wagyu Steak · Table 4</div>
            </div>
            <div className="hs-badge hs-badge-r">
              <div className="hs-badge-indicator"><span className="hs-badge-dot"/><span className="hs-badge-label">Live Entertainment</span></div>
              <div className="hs-badge-text">Jazz Quartet · 8:00 PM</div>
            </div>
          </>
        )}

        {/* ── HERO CONTENT (collapsible) ─────────────────────────────────────── */}
        <div className={`hs-hero-content ${heroVisible ? "visible" : "hidden"}`} ref={heroContentRef}>
          <div className="hs-hero">

            {/* Crown */}
            <div className="hs-crown-wrap">
              <div className="hs-crown-ring"/><div className="hs-crown-ring hs-crown-ring-2"/>
              <svg width="54" height="38" viewBox="0 0 80 52" fill="none">
                <defs>
                  <linearGradient id="hsCG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#7030d0"/>
                    <stop offset="35%"  stopColor="#c080ff"/>
                    <stop offset="50%"  stopColor="#f0e0ff"/>
                    <stop offset="65%"  stopColor="#c080ff"/>
                    <stop offset="100%" stopColor="#7030d0"/>
                  </linearGradient>
                </defs>
                <path d="M10 36 L20 16 L32 30 L40 8 L48 30 L60 16 L70 36" stroke="url(#hsCG)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 40 C26 46 54 46 67 40" stroke="url(#hsCG)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="13" y1="42" x2="67" y2="42" stroke="url(#hsCG)" strokeWidth="1" strokeLinecap="round" opacity=".5"/>
                <circle cx="20" cy="16" r="4" fill="#e0c0ff" opacity=".9"/><circle cx="20" cy="16" r="2" fill="#a060f0"/>
                <circle cx="40" cy="8"  r="5" fill="#f0e0ff" opacity=".95"/><circle cx="40" cy="8" r="2.5" fill="#a060f0"/>
                <circle cx="60" cy="16" r="4" fill="#e0c0ff" opacity=".9"/><circle cx="60" cy="16" r="2" fill="#a060f0"/>
              </svg>
            </div>

            {/* Eyebrow */}
            <div className="hs-eyebrow">
              <div className="hs-ey-line"/>
              <span className="hs-ey-text">Est. 2012 · Premium Reservations</span>
              <div className="hs-ey-line hs-ey-line-r"/>
            </div>

            {/* Title */}
            <h1 className="hs-title">
              THE RESERVE
              <span className="hs-title-sub">A N &nbsp; E X T R A O R D I N A R Y &nbsp; E X P E R I E N C E</span>
            </h1>

            {/* Ornament */}
            <div className="hs-ornate">
              <div className="hs-orn-line"/>
              <div className="hs-orn-gems">
                <div className="hs-gem hs-gem-sm"/><div className="hs-gem hs-gem-lg"/><div className="hs-gem hs-gem-sm"/>
              </div>
              <div className="hs-orn-line hs-orn-line-r"/>
            </div>

            {/* Description */}
            <p className="hs-desc">
              Where every reservation is a promise of an unforgettable evening,<br/>
              crafted with precision and served with grace.
            </p>

            {/* CTA */}
            <div className="hs-cta">
              <button className="hs-btn-book" onClick={handleReserveClick}>Reserve Your Table</button>
              <button className="hs-btn-explore" onClick={handleExploreMenu}>
                Explore Menu ↓
              </button>
            </div>

            {/* Location search bar */}
            <div className="hs-search-section">
              <div className="hs-search-wrap">
                <button className="hs-loc-btn" onClick={handleDetectLocation} disabled={locLoading} title="Detect location">
                  <svg className={`hs-loc-icon${locLoading ? " spinning" : ""}`} width="15" height="15" viewBox="0 0 24 24" fill="none">
                    {locLoading
                      ? <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28 56" strokeLinecap="round"/>
                      : <><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8" fill="none"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></>
                    }
                  </svg>
                  {locLoading ? "Detecting..." : "Detect Location"}
                </button>
                <div className="hs-search-divider"/>
                <input className="hs-search-input" type="text" placeholder="Search restaurants, dishes, cuisines..."
                  value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onKeyDown={handleSearchKey}/>
                <button className="hs-search-btn" onClick={handleSearch}>Search</button>
              </div>
              {locError && (
                <div className="hs-loc-error">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  </svg>
                  {locError}
                </div>
              )}
            </div>

            {/* Category tabs */}
            <div className="hs-cats-wrap">
              {categories.map((cat, i) => (
                <>
                  {i > 0 && <div key={`sep-${i}`} className="hs-cat-sep"/>}
                  <button
                    key={cat.label}
                    className={`hs-cat-btn${activeCategory === cat.label ? " active" : ""}`}
                    onClick={() => setActiveCategory(cat.label)}
                  >
                    <div className="hs-cat-btn-icon">{cat.icon}</div>
                    {cat.label}
                  </button>
                </>
              ))}
            </div>

            {/* Stats */}
            <div className="hs-stats">
              {[
                { num: "12+",  lbl: "Years of Excellence" },
                { num: "4.9★", lbl: "Guest Rating"        },
                { num: "200+", lbl: "Tables Available"    },
                { num: "50K+", lbl: "Happy Guests"        },
              ].map((s) => (
                <div className="hs-stat" key={s.lbl}>
                  <span className="hs-stat-num">{s.num}</span>
                  <span className="hs-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── FOOD SECTION ──────────────────────────────────────────────────────── */}
        <div className="hs-food-section" ref={foodSectionRef}>

          {/* Back to hero button (only when hero is hidden) */}
          {!heroVisible && (
            <button className="hs-back-btn" onClick={handleBackToHero}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back to Home
            </button>
          )}

          {/* Section header */}
          <div className="hs-food-header">
            <div className="hs-food-title-block">
              <span className="hs-food-section-label">Our Menu</span>
              <span className="hs-food-section-title">{activeCategory}</span>
            </div>
            {/* Food search */}
            <div className="hs-food-search-wrap">
              <span className="hs-food-search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </span>
              <input
                className="hs-food-search-input"
                type="text"
                placeholder="Search food by name…"
                value={foodSearch}
                onChange={e => setFoodSearch(e.target.value)}
              />
              {foodSearch && (
                <button className="hs-food-search-clear" onClick={() => setFoodSearch("")}>✕</button>
              )}
            </div>
          </div>

          {/* Category filter pills */}
          <div className="hs-food-cats">
            {categories.map(cat => (
              <button
                key={cat.label}
                className={`hs-food-cat-btn${activeCategory === cat.label ? " active" : ""}`}
                onClick={() => setActiveCategory(cat.label)}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Match result banner */}
          {hasMatch && filteredFoods.length > 0 && (
            <div className="hs-match-info">
              <span className="hs-match-dot"/>
              {filteredFoods.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase()) || f.desc.toLowerCase().includes(foodSearch.toLowerCase())).length} match(es) for &ldquo;{foodSearch}&rdquo; — shown first
            </div>
          )}

          {/* Food grid */}
          {pageItems.length > 0 ? (
            <div className="hs-food-grid">
              {pageItems.map((item, idx) => {
                const isMatch = hasMatch && (
                  item.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
                  item.desc.toLowerCase().includes(foodSearch.toLowerCase()) ||
                  item.tag.toLowerCase().includes(foodSearch.toLowerCase())
                );
                return (
                  <div
                    key={item.id}
                    className={`fc${isMatch ? " match-highlight" : ""}`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    onMouseEnter={() => setCardHover(item.id)}
                    onMouseLeave={() => setCardHover(null)}
                  >
                    {isMatch && <div className="fc-match-badge">Match</div>}
                    <div className="fc-emoji-zone">{item.emoji}</div>
                    <div className="fc-body">
                      <div className="fc-top">
                        <span className="fc-name">{item.name}</span>
                        <span className="fc-tag">{item.tag}</span>
                      </div>
                      <p className="fc-desc">{item.desc}</p>
                      <div className="fc-footer">
                        <span className="fc-price">₹{item.price.toLocaleString()}</span>
                        <div className="fc-meta">
                          <span className="fc-rating">★ {item.rating}</span>
                          <span className="fc-reviews">({item.reviews})</span>
                          {item.time && (
                            <span className="fc-time">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                              {item.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="fc-add-btn" title="Add to order">+</button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hs-food-empty">
              <div className="hs-food-empty-icon">🍽️</div>
              <div className="hs-food-empty-title">No items found</div>
              <div className="hs-food-empty-sub">Try a different search term or category</div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="hs-pagination">
              <button
                className="hs-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`hs-page-btn${currentPage === p ? " active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="hs-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                ›
              </button>
              <span className="hs-page-info">Page {currentPage} of {totalPages}</span>
            </div>
          )}

        </div>

        <LoginModal isOpen={openLoginModal} onClose={() => setOpenLoginModal(false)}
          onSwitchToRegister={() => { setOpenLoginModal(false); setOpenRegisterModal(true); }}/>
        <RegisterModal isOpen={openRegisterModal} onClose={() => setOpenRegisterModal(false)}
          onSwitchToLogin={() => { setOpenRegisterModal(false); setOpenLoginModal(true); }}/>
      </div>
    </>
  );
}