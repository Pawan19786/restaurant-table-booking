import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

interface Restaurant {
  _id: string;
  name: string;
  description: string;
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

const CUISINES = ["All", "Indian", "Italian", "Chinese", "Mexican", "Japanese", "Thai", "Continental", "Middle Eastern", "American", "Mediterranean"];
const PRICES   = ["All", "₹", "₹₹", "₹₹₹"];

const isOpenNow = (opening: string, closing: string) => {
  if (!opening || !closing) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = opening.split(":").map(Number);
  const [ch, cm] = closing.split(":").map(Number);
  return cur >= oh * 60 + om && cur <= ch * 60 + cm;
};

export default function Restaurantlisting(){
  const navigate = useNavigate();
  const heroRef  = useRef<HTMLDivElement>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [cuisine,     setCuisine]     = useState("All");
  const [price,       setPrice]       = useState("All");
  const [onlyOpen,    setOnlyOpen]    = useState(false);
  const [sortBy,      setSortBy]      = useState<"rating"|"name"|"price">("rating");
  const [scrollY,     setScrollY]     = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    api.get("/restaurants")
      .then(res => setRestaurants(res.data.restaurants || []))
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants
    .filter(r => r.isActive)
    .filter(r => {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q) ||
             r.cuisineTypes.some(c => c.toLowerCase().includes(q));
    })
    .filter(r => cuisine === "All" || r.cuisineTypes.includes(cuisine))
    .filter(r => price   === "All" || r.priceRange === price)
    .filter(r => !onlyOpen || isOpenNow(r.openingTime, r.closingTime))
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "name")   return a.name.localeCompare(b.name);
      if (sortBy === "price")  return a.priceRange.length - b.priceRange.length;
      return 0;
    });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#080a0e;color:#f0ece4}

        @keyframes rl-fadeUp   {from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rl-slideIn  {from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes rl-shimmer  {0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes rl-pulse    {0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes rl-spin     {to{transform:rotate(360deg)}}
        @keyframes rl-float    {0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

        .rl-root {
          min-height:100vh;
          background:#080a0e;
          font-family:'DM Sans',sans-serif;
        }

        /* ── HERO ── */
        .rl-hero {
          position:relative; height:480px;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          overflow:hidden; padding:0 20px;
        }
        .rl-hero-bg {
          position:absolute; inset:0;
          background:linear-gradient(135deg,#0a0f1e 0%,#111827 40%,#0f1a10 100%);
        }
        .rl-hero-overlay {
          position:absolute; inset:0;
          background:radial-gradient(ellipse at 30% 50%,rgba(251,191,36,0.08) 0%,transparent 60%),
                     radial-gradient(ellipse at 70% 30%,rgba(16,185,129,0.06) 0%,transparent 50%);
        }
        .rl-hero-grain {
          position:absolute; inset:0; opacity:0.04;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
        }
        .rl-hero-content { position:relative; z-index:2; text-align:center; }
        .rl-hero-tag {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.25);
          border-radius:20px; padding:6px 16px; margin-bottom:20px;
          font-size:11px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase;
          color:rgba(251,191,36,0.8);
          animation:rl-fadeUp 0.6s ease both;
        }
        .rl-hero-title {
          font-family:'Playfair Display',serif;
          font-size:clamp(36px,6vw,68px);
          font-weight:700; line-height:1.1;
          color:#f0ece4; margin-bottom:16px;
          animation:rl-fadeUp 0.7s ease 0.1s both;
        }
        .rl-hero-title em {
          font-style:italic;
          background:linear-gradient(135deg,#fbbf24,#f59e0b,#d97706);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .rl-hero-sub {
          font-size:16px; color:rgba(240,236,228,0.45);
          margin-bottom:36px; line-height:1.6;
          animation:rl-fadeUp 0.7s ease 0.2s both;
        }

        /* ── SEARCH ── */
        .rl-search-wrap {
          position:relative; width:100%; max-width:560px; margin:0 auto;
          animation:rl-fadeUp 0.7s ease 0.3s both;
        }
        .rl-search-icon {
          position:absolute; left:18px; top:50%; transform:translateY(-50%);
          color:rgba(251,191,36,0.5); pointer-events:none;
        }
        .rl-search {
          width:100%; padding:16px 20px 16px 52px;
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:14px; font-family:'DM Sans',sans-serif;
          font-size:15px; color:#f0ece4; outline:none;
          transition:all 0.3s;
          backdrop-filter:blur(20px);
        }
        .rl-search:focus {
          border-color:rgba(251,191,36,0.4);
          background:rgba(255,255,255,0.08);
          box-shadow:0 0 0 3px rgba(251,191,36,0.08);
        }
        .rl-search::placeholder { color:rgba(240,236,228,0.3); }

        /* ── STATS BAR ── */
        .rl-stats {
          display:flex; align-items:center; justify-content:center; gap:40px;
          padding:20px; margin-top:-1px;
          background:rgba(255,255,255,0.02);
          border-bottom:1px solid rgba(255,255,255,0.06);
          animation:rl-fadeUp 0.7s ease 0.4s both;
        }
        .rl-stat { text-align:center; }
        .rl-stat-num {
          font-family:'Playfair Display',serif; font-size:22px; font-weight:700;
          color:#fbbf24;
        }
        .rl-stat-lbl { font-size:11px; color:rgba(240,236,228,0.35); letter-spacing:0.08em; text-transform:uppercase; }

        /* ── FILTERS ── */
        .rl-filters {
          padding:24px 40px; display:flex; align-items:center;
          gap:16px; flex-wrap:wrap;
          border-bottom:1px solid rgba(255,255,255,0.05);
          animation:rl-fadeUp 0.6s ease 0.5s both;
          position:sticky; top:0; z-index:50;
          background:rgba(8,10,14,0.92);
          backdrop-filter:blur(20px);
        }
        .rl-filter-label { font-size:11px; color:rgba(240,236,228,0.3); letter-spacing:0.1em; text-transform:uppercase; margin-right:4px; }
        .rl-pill {
          padding:7px 16px; border-radius:20px; cursor:pointer;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.03);
          color:rgba(240,236,228,0.45);
          transition:all 0.2s; white-space:nowrap;
        }
        .rl-pill:hover { border-color:rgba(251,191,36,0.3); color:rgba(240,236,228,0.8); }
        .rl-pill.active {
          background:rgba(251,191,36,0.12);
          border-color:rgba(251,191,36,0.4);
          color:#fbbf24;
        }
        .rl-toggle {
          display:flex; align-items:center; gap:8px; cursor:pointer;
          padding:7px 16px; border-radius:20px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.03);
          font-size:12px; color:rgba(240,236,228,0.45);
          transition:all 0.2s;
        }
        .rl-toggle.active {
          background:rgba(16,185,129,0.1);
          border-color:rgba(16,185,129,0.3);
          color:#10b981;
        }
        .rl-dot { width:7px; height:7px; border-radius:50%; background:currentColor; animation:rl-pulse 2s ease infinite; }

        .rl-sort {
          margin-left:auto;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:8px; padding:7px 12px;
          font-family:'DM Sans',sans-serif; font-size:12px;
          color:rgba(240,236,228,0.6); cursor:pointer; outline:none;
        }

        /* ── CONTENT ── */
        .rl-content { padding:40px; }
        .rl-section-head {
          display:flex; align-items:baseline; gap:12px; margin-bottom:28px;
        }
        .rl-section-title {
          font-family:'Playfair Display',serif; font-size:22px; font-weight:600; color:#f0ece4;
        }
        .rl-section-count { font-size:13px; color:rgba(240,236,228,0.3); }

        /* ── GRID ── */
        .rl-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));
          gap:24px;
        }

        /* ── CARD ── */
        .rl-card {
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:20px; overflow:hidden;
          cursor:pointer; transition:all 0.35s cubic-bezier(0.34,1.2,0.64,1);
          position:relative;
        }
        .rl-card:hover {
          transform:translateY(-6px);
          border-color:rgba(251,191,36,0.2);
          box-shadow:0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(251,191,36,0.1);
        }
        .rl-card-img-wrap {
          position:relative; height:200px; overflow:hidden;
        }
        .rl-card-img {
          width:100%; height:100%; object-fit:cover;
          transition:transform 0.5s ease;
        }
        .rl-card:hover .rl-card-img { transform:scale(1.05); }
        .rl-card-img-placeholder {
          width:100%; height:100%;
          background:linear-gradient(135deg,#111827,#1f2937);
          display:flex; align-items:center; justify-content:center;
          font-size:48px;
        }
        .rl-card-img-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to top, rgba(8,10,14,0.8) 0%, transparent 50%);
        }
        .rl-card-badges {
          position:absolute; top:14px; left:14px; display:flex; gap:6px;
        }
        .rl-badge {
          padding:4px 10px; border-radius:20px; font-size:10px; font-weight:600;
          letter-spacing:0.06em; backdrop-filter:blur(10px);
        }
        .rl-badge-open {
          background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.4);
          color:#10b981;
        }
        .rl-badge-closed {
          background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3);
          color:#f87171;
        }
        .rl-badge-price {
          background:rgba(251,191,36,0.15); border:1px solid rgba(251,191,36,0.3);
          color:#fbbf24; font-family:'Playfair Display',serif;
        }
        .rl-card-rating {
          position:absolute; top:14px; right:14px;
          background:rgba(8,10,14,0.8); border:1px solid rgba(251,191,36,0.3);
          border-radius:20px; padding:4px 10px;
          font-size:12px; font-weight:600; color:#fbbf24;
          backdrop-filter:blur(10px);
          display:flex; align-items:center; gap:4px;
        }
        .rl-card-body { padding:18px 20px 20px; }
        .rl-card-name {
          font-family:'Playfair Display',serif; font-size:18px; font-weight:600;
          color:#f0ece4; margin-bottom:6px; line-height:1.3;
        }
        .rl-card-city {
          display:flex; align-items:center; gap:6px;
          font-size:12px; color:rgba(240,236,228,0.4); margin-bottom:10px;
        }
        .rl-card-cuisines {
          display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px;
        }
        .rl-cuisine-tag {
          font-size:10px; padding:3px 9px; border-radius:10px;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
          color:rgba(240,236,228,0.5); letter-spacing:0.04em;
        }
        .rl-card-footer {
          display:flex; align-items:center; justify-content:space-between;
          padding-top:14px; border-top:1px solid rgba(255,255,255,0.06);
        }
        .rl-card-timing {
          font-size:11px; color:rgba(240,236,228,0.35);
          display:flex; align-items:center; gap:5px;
        }
        .rl-btn-book {
          padding:8px 18px; border-radius:10px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#d97706,#fbbf24);
          color:#080a0e; font-family:'DM Sans',sans-serif;
          font-size:12px; font-weight:700; letter-spacing:0.04em;
          transition:all 0.2s; display:flex; align-items:center; gap:6px;
        }
        .rl-btn-book:hover {
          transform:translateY(-1px);
          box-shadow:0 8px 24px rgba(251,191,36,0.35);
        }

        /* ── EMPTY STATE ── */
        .rl-empty {
          text-align:center; padding:80px 20px;
          animation:rl-fadeUp 0.5s ease both;
        }
        .rl-empty-icon { font-size:64px; margin-bottom:16px; animation:rl-float 3s ease infinite; }
        .rl-empty-title {
          font-family:'Playfair Display',serif; font-size:24px; color:rgba(240,236,228,0.6);
          margin-bottom:8px;
        }
        .rl-empty-sub { font-size:14px; color:rgba(240,236,228,0.3); }

        /* ── SKELETON ── */
        .rl-skeleton {
          background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);
          background-size:200% auto;
          animation:rl-shimmer 1.5s linear infinite;
          border-radius:8px;
        }

        /* ── BACK BTN ── */
        .rl-back {
          position:fixed; top:24px; left:24px; z-index:100;
          display:flex; align-items:center; gap:8px;
          background:rgba(8,10,14,0.8); border:1px solid rgba(255,255,255,0.1);
          border-radius:10px; padding:10px 16px; cursor:pointer;
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
          color:rgba(240,236,228,0.7); transition:all 0.2s;
          backdrop-filter:blur(20px);
        }
        .rl-back:hover { border-color:rgba(251,191,36,0.3); color:#fbbf24; }
      `}</style>

      <div className="rl-root">

        {/* Back button */}
        <button className="rl-back" onClick={() => navigate("/dashboard")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>

        {/* ── HERO ── */}
        <div className="rl-hero" ref={heroRef} style={{ transform:`translateY(${scrollY * 0.3}px)` }}>
          <div className="rl-hero-bg"/>
          <div className="rl-hero-overlay"/>
          <div className="rl-hero-grain"/>
          <div className="rl-hero-content">
            <div className="rl-hero-tag">
              <span>✦</span> TableTime Partner Restaurants
            </div>
            <h1 className="rl-hero-title">
              Discover <em>Extraordinary</em><br/>Dining Experiences
            </h1>
            <p className="rl-hero-sub">
              Handpicked restaurants, curated for unforgettable evenings
            </p>
            <div className="rl-search-wrap">
              <span className="rl-search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input className="rl-search" placeholder="Search restaurants, cuisines, cities..."
                value={search} onChange={e => setSearch(e.target.value)} autoComplete="off"/>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="rl-stats">
          {[
            { num: restaurants.length,                                        lbl: "Restaurants" },
            { num: restaurants.filter(r => isOpenNow(r.openingTime, r.closingTime)).length, lbl: "Open Now" },
            { num: [...new Set(restaurants.flatMap(r => r.cuisineTypes))].length, lbl: "Cuisines" },
            { num: [...new Set(restaurants.map(r => r.city))].length,         lbl: "Cities" },
          ].map(s => (
            <div key={s.lbl} className="rl-stat">
              <div className="rl-stat-num">{s.num}</div>
              <div className="rl-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── FILTERS ── */}
        <div className="rl-filters">
          <span className="rl-filter-label">Cuisine</span>
          {CUISINES.map(c => (
            <button key={c} className={`rl-pill${cuisine===c?" active":""}`} onClick={() => setCuisine(c)}>{c}</button>
          ))}

          <div style={{width:"1px",height:20,background:"rgba(255,255,255,0.08)",margin:"0 4px"}}/>

          <span className="rl-filter-label">Price</span>
          {PRICES.map(p => (
            <button key={p} className={`rl-pill${price===p?" active":""}`} onClick={() => setPrice(p)}>{p}</button>
          ))}

          <button className={`rl-toggle${onlyOpen?" active":""}`} onClick={() => setOnlyOpen(p => !p)}>
            <span className="rl-dot"/>
            Open Now
          </button>

          <select className="rl-sort" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="rating">Sort: Rating</option>
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price</option>
          </select>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="rl-content">
          <div className="rl-section-head">
            <span className="rl-section-title">
              {search ? `Results for "${search}"` : cuisine !== "All" ? `${cuisine} Restaurants` : "All Restaurants"}
            </span>
            <span className="rl-section-count">{filtered.length} found</span>
          </div>

          {loading ? (
            <div className="rl-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div className="rl-skeleton" style={{height:200}}/>
                  <div style={{padding:20,display:"flex",flexDirection:"column",gap:10}}>
                    <div className="rl-skeleton" style={{height:20,width:"70%"}}/>
                    <div className="rl-skeleton" style={{height:14,width:"50%"}}/>
                    <div className="rl-skeleton" style={{height:14,width:"90%"}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rl-empty">
              <div className="rl-empty-icon">🍽️</div>
              <div className="rl-empty-title">No restaurants found</div>
              <div className="rl-empty-sub">Try adjusting your filters or search term</div>
            </div>
          ) : (
            <div className="rl-grid">
              {filtered.map((r, i) => {
                const open = isOpenNow(r.openingTime, r.closingTime);
                return (
                  <div key={r._id} className="rl-card"
                    style={{animationDelay:`${i * 0.05}s`, animation:"rl-fadeUp 0.5s ease both"}}
                    onClick={() => navigate(`/restaurants/${r._id}`)}>

                    {/* Image */}
                    <div className="rl-card-img-wrap">
                      {r.image
                        ? <img src={r.image} alt={r.name} className="rl-card-img"/>
                        : <div className="rl-card-img-placeholder">🍽️</div>
                      }
                      <div className="rl-card-img-overlay"/>

                      {/* Badges */}
                      <div className="rl-card-badges">
                        <span className={`rl-badge ${open ? "rl-badge-open" : "rl-badge-closed"}`}>
                          {open ? "● Open" : "● Closed"}
                        </span>
                        <span className="rl-badge rl-badge-price">{r.priceRange}</span>
                      </div>

                      {/* Rating */}
                      {r.rating > 0 && (
                        <div className="rl-card-rating">
                          ★ {r.rating.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="rl-card-body">
                      <div className="rl-card-name">{r.name}</div>
                      <div className="rl-card-city">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {r.city}
                      </div>

                      {r.cuisineTypes.length > 0 && (
                        <div className="rl-card-cuisines">
                          {r.cuisineTypes.slice(0, 3).map(c => (
                            <span key={c} className="rl-cuisine-tag">{c}</span>
                          ))}
                          {r.cuisineTypes.length > 3 && (
                            <span className="rl-cuisine-tag">+{r.cuisineTypes.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="rl-card-footer">
                        <div className="rl-card-timing">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                          {r.openingTime || "–"} – {r.closingTime || "–"}
                        </div>
                        <button className="rl-btn-book" onClick={e => { e.stopPropagation(); navigate(`/restaurants/${r._id}`); }}>
                          Book Table
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}