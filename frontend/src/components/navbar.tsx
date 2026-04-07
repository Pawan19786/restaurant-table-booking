// ── Add these two imports to your existing navbar.tsx ─────────────────────────
// import { NotificationBell } from "../context/NotificationContext";
// import { useCart } from "../context/CartContext";
//
// Then add <NotificationBell theme={th} /> and cart badge inside nb-actions
// This file shows the COMPLETE updated navbar with both additions.

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "../context/NotificationContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

type NavbarProps = {
  isDark?: boolean;
  setIsDark?: React.Dispatch<React.SetStateAction<boolean>>;
  onLoginOpen: () => void;
  onRegisterOpen: () => void;
  activeLink: string;
  setActiveLink: (link: string) => void;
};

const POPUP_ALLOWED_PATHS = ["/", "/contact"];

export default function Navbar({
  onLoginOpen, onRegisterOpen,
  activeLink, setActiveLink,
}: NavbarProps) {
  const { isDark, setIsDark } = useTheme();
  const [scrolled,     setScrolled]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, right: 0 });
  const avatarBtnRef                     = useRef<HTMLButtonElement>(null);
  const dropdownRef                      = useRef<HTMLDivElement>(null);
  const navigate                         = useNavigate();
  const location                         = useLocation();

  const { user, isLoggedIn, logout } = useAuth();
  const { totalItems } = useCart();

  const userName    = user?.name    || localStorage.getItem("name")    || "User";
  const userEmail   = user?.email   || localStorage.getItem("email")   || "";
  const userRole    = user?.role    || localStorage.getItem("role")    || "user";
  const userPicture = user?.picture || localStorage.getItem("picture") || "";
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openDropdown = () => {
    if (avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
    }
    setDropdownOpen(true);
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!avatarBtnRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => { setDropdownOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const reposition = () => {
      if (avatarBtnRef.current) {
        const rect = avatarBtnRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [dropdownOpen]);

  const getAvatarColors = (name: string): [string, string] => {
    const palette: [string, string][] = [
      ["#7030d0","#a060f0"],["#0e7490","#06b6d4"],["#b45309","#d97706"],
      ["#065f46","#059669"],["#9d174d","#db2777"],["#1e40af","#3b82f6"],
      ["#6b21a8","#a855f7"],["#9f1239","#f43f5e"],
    ];
    return palette[name.charCodeAt(0) % palette.length];
  };
  const [colorFrom, colorTo] = getAvatarColors(userName);

  const isPopupAllowed = POPUP_ALLOWED_PATHS.includes(location.pathname);

  const handleLoginClick    = () => { if (!isLoggedIn && isPopupAllowed) onLoginOpen();    else if (!isLoggedIn) navigate("/"); };
  const handleRegisterClick = () => { if (!isLoggedIn && isPopupAllowed) onRegisterOpen(); else if (!isLoggedIn) navigate("/"); };
  const handleLogout        = () => { logout(); setDropdownOpen(false); navigate("/", { replace: true }); };

  const navLinks = ["Home", "Restaurants", "About us", "My Bookings", "Contact"];
  const handleNavClick = (link: string) => {
    setActiveLink(link);
    setDropdownOpen(false);
    switch (link) {
      case "Home":        navigate("/dashboard");   break;
      case "Restaurants": navigate("/restaurants"); break;
      case "About us":    navigate("/about");       break;
      case "Contact":     navigate("/contact");     break;
      case "My Bookings":
        if (isLoggedIn) navigate("/my-bookings");
        else if (isPopupAllowed) onLoginOpen();
        else navigate("/");
        break;
    }
  };

  const th = isDark ? "dark" : "light";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&family=Cinzel:wght@400;500&display=swap');
        @keyframes nb-down  { from{opacity:0;transform:translateY(-100%)} to{opacity:1;transform:translateY(0)} }
        @keyframes nb-dd-in { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .nb-wrap{position:sticky;top:0;z-index:200;animation:nb-down 0.7s cubic-bezier(0.16,1,0.3,1) both;transition:all 0.4s ease;font-family:'Montserrat',sans-serif}
        .nb-wrap.dark{background:rgba(8,4,18,0.6);backdrop-filter:blur(32px) saturate(180%);-webkit-backdrop-filter:blur(32px) saturate(180%);border-bottom:1px solid rgba(180,140,255,0.12)}
        .nb-wrap.light{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border-bottom:1px solid rgba(226,232,240,0.8)}
        .nb-wrap.dark.nb-scrolled{box-shadow:0 8px 48px rgba(0,0,0,0.6),0 0 80px rgba(120,80,255,0.06)}
        .nb-wrap.light.nb-scrolled{box-shadow:0 2px 20px rgba(37,99,235,0.08)}
        .nb-glow-bar{height:1px;transition:opacity 0.4s}
        .nb-wrap.dark .nb-glow-bar{background:linear-gradient(90deg,transparent 0%,rgba(160,100,255,0.4) 30%,rgba(220,180,255,0.8) 50%,rgba(160,100,255,0.4) 70%,transparent 100%);opacity:1}
        .nb-wrap.light .nb-glow-bar{opacity:0}
        .nb-row{display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:68px;gap:24px}
        .nb-logo{display:flex;flex-direction:row;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;min-width:160px}
        .nb-logo-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.4s}
        .nb-wrap.dark .nb-logo-icon{background:linear-gradient(135deg,#7030d0,#a060f0);box-shadow:0 0 16px rgba(130,60,220,0.35)}
        .nb-wrap.light .nb-logo-icon{background:linear-gradient(135deg,#2563eb,#3b82f6);box-shadow:0 2px 10px rgba(37,99,235,0.3)}
        .nb-logo-name{font-family:'Cinzel',serif;font-size:17px;font-weight:500;letter-spacing:0.06em;line-height:1;transition:all 0.4s}
        .nb-wrap.dark .nb-logo-name{background:linear-gradient(135deg,#d4b0ff,#f0e0ff,#a070e0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .nb-wrap.light .nb-logo-name{color:#1e293b;-webkit-text-fill-color:#1e293b}
        .nb-links{display:flex;align-items:center;gap:2px;flex:1;justify-content:center}
        .nb-link{background:none;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.02em;padding:8px 16px;border-radius:6px;position:relative;transition:all 0.25s}
        .nb-wrap.dark .nb-link{color:rgba(210,180,255,0.45)}
        .nb-wrap.dark .nb-link:hover{color:rgba(220,190,255,0.9);background:rgba(160,100,255,0.1)}
        .nb-wrap.light .nb-link{color:#64748b}
        .nb-wrap.light .nb-link:hover{color:#1e293b;background:#f1f5f9}
        .nb-wrap.dark .nb-link.nb-active{color:#e0c0ff;background:rgba(160,100,255,0.14)}
        .nb-wrap.light .nb-link.nb-active{color:#2563eb;background:#eff6ff}
        .nb-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .nb-toggle{width:40px;height:22px;border-radius:11px;position:relative;cursor:pointer;transition:all 0.3s;border:none}
        .nb-wrap.dark .nb-toggle{background:rgba(160,100,255,0.25)}
        .nb-wrap.light .nb-toggle{background:rgba(37,99,235,0.2)}
        .nb-toggle-knob{position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.3s;font-size:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2)}
        .nb-wrap.dark .nb-toggle-knob{left:21px}
        .nb-wrap.light .nb-toggle-knob{left:3px}
        .nb-login{background:none;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.02em;padding:8px 16px;border-radius:8px;transition:all 0.25s}
        .nb-wrap.dark .nb-login{color:rgba(210,180,255,0.6)}
        .nb-wrap.dark .nb-login:hover{color:rgba(220,190,255,0.9);background:rgba(160,100,255,0.1)}
        .nb-wrap.light .nb-login{color:#64748b}
        .nb-wrap.light .nb-login:hover{color:#1e293b;background:#f1f5f9}
        .nb-signup{display:flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.02em;transition:all 0.25s}
        .nb-wrap.dark .nb-signup{background:linear-gradient(135deg,#7030d0,#a060f0);color:#fff;box-shadow:0 4px 16px rgba(112,48,208,0.3)}
        .nb-wrap.dark .nb-signup:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(112,48,208,0.45)}
        .nb-wrap.light .nb-signup{background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;box-shadow:0 4px 12px rgba(37,99,235,0.25)}
        .nb-wrap.light .nb-signup:hover{transform:translateY(-1px)}
        .nb-avatar-wrap{position:relative}
        .nb-avatar-btn{display:flex;align-items:center;gap:9px;background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:10px;transition:background 0.2s}
        .nb-wrap.dark .nb-avatar-btn:hover{background:rgba(160,100,255,0.1)}
        .nb-wrap.light .nb-avatar-btn:hover{background:#f1f5f9}
        .nb-avatar-circle{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;overflow:hidden;flex-shrink:0}
        .nb-avatar-name{font-size:13px;font-weight:500;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .nb-wrap.dark .nb-avatar-name{color:rgba(220,190,255,0.8)}
        .nb-wrap.light .nb-avatar-name{color:#1e293b}
        .nb-avatar-chevron{font-size:8px;transition:transform 0.2s}
        .nb-wrap.dark .nb-avatar-chevron{color:rgba(200,170,255,0.4)}
        .nb-wrap.light .nb-avatar-chevron{color:#94a3b8}
        .nb-avatar-chevron.open{transform:rotate(180deg)}
        .nb-dropdown{position:fixed;min-width:240px;border-radius:16px;overflow:hidden;padding:8px;animation:nb-dd-in 0.22s cubic-bezier(0.16,1,0.3,1) both;z-index:9999}
        .nb-dropdown.dark{background:rgba(12,6,28,0.97);border:1px solid rgba(160,96,240,0.18);box-shadow:0 24px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(160,96,240,0.08);backdrop-filter:blur(40px)}
        .nb-dropdown.light{background:rgba(255,255,255,0.98);border:1px solid rgba(226,232,240,0.8);box-shadow:0 10px 40px rgba(0,0,0,0.12)}
        .nb-dd-header{display:flex;align-items:center;gap:12px;padding:12px 12px 10px;margin-bottom:4px}
        .nb-dd-av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden}
        .nb-dd-name{font-size:13px;font-weight:600}
        .nb-dd-name.dark{color:rgba(228,210,255,0.9)}
        .nb-dd-name.light{color:#1e293b}
        .nb-dd-email{font-size:11px;margin-top:1px}
        .nb-dd-email.dark{color:rgba(180,150,255,0.38)}
        .nb-dd-email.light{color:#94a3b8}
        .nb-dd-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;background:none;border:none;cursor:pointer;border-radius:9px;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.02em;transition:all 0.15s;text-align:left}
        .nb-dd-item.dark{color:rgba(200,175,255,0.62)}
        .nb-dd-item.dark:hover{background:rgba(160,96,240,0.1);color:rgba(220,200,255,0.9)}
        .nb-dd-item.light{color:#475569}
        .nb-dd-item.light:hover{background:#f8fafc;color:#1e293b}
        .nb-dd-item.nb-dd-owner.dark{color:rgba(245,158,11,0.75)}
        .nb-dd-item.nb-dd-owner.dark:hover{background:rgba(245,158,11,0.1);color:#fbbf24}
        .nb-dd-item.nb-dd-owner.light{color:#d97706}
        .nb-dd-item.nb-dd-owner.light:hover{background:#fffbeb;color:#b45309}
        .nb-dd-item.nb-dd-admin.dark{color:rgba(160,96,240,0.75)}
        .nb-dd-item.nb-dd-admin.dark:hover{background:rgba(160,96,240,0.12);color:#c090ff}
        .nb-dd-item.nb-dd-admin.light{color:#7c3aed}
        .nb-dd-item.nb-dd-admin.light:hover{background:#f5f3ff;color:#6d28d9}
        .nb-dd-item.nb-dd-become.dark{color:rgba(16,185,129,0.75)}
        .nb-dd-item.nb-dd-become.dark:hover{background:rgba(16,185,129,0.1);color:#10b981}
        .nb-dd-item.nb-dd-become.light{color:#059669}
        .nb-dd-item.nb-dd-become.light:hover{background:#f0fdf4;color:#047857}
        .nb-dd-item.nb-dd-logout.dark{color:rgba(255,110,110,0.6)}
        .nb-dd-item.nb-dd-logout.dark:hover{background:rgba(255,70,70,0.08);color:rgba(255,140,140,0.9)}
        .nb-dd-item.nb-dd-logout.light{color:#ef4444}
        .nb-dd-item.nb-dd-logout.light:hover{background:#fef2f2;color:#dc2626}
        .nb-dd-badge{margin-left:auto;font-size:8px;padding:2px 7px;border-radius:20px;font-weight:600;letter-spacing:0.06em}
        .nb-dd-badge.dark{background:rgba(160,96,240,0.18);color:#c090ff;border:1px solid rgba(160,96,240,0.28)}
        .nb-dd-badge.light{background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff}
        .nb-dd-sep{height:1px;margin:5px 0}
        .nb-dd-sep.dark{background:rgba(160,96,240,0.09)}
        .nb-dd-sep.light{background:#f1f5f9}

        /* Cart button */
        .nb-cart-btn{position:relative;width:38px;height:38px;border-radius:10px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s}
        .nb-wrap.dark .nb-cart-btn{background:rgba(160,100,255,0.08);color:rgba(200,170,255,0.7)}
        .nb-wrap.dark .nb-cart-btn:hover{background:rgba(160,100,255,0.15)}
        .nb-wrap.light .nb-cart-btn{background:rgba(37,99,235,0.06);color:#64748b}
        .nb-wrap.light .nb-cart-btn:hover{background:rgba(37,99,235,0.12)}
        .nb-cart-badge{position:absolute;top:4px;right:4px;min-width:16px;height:16px;border-radius:8px;background:#fbbf24;color:#0f1117;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px}
      `}</style>

      <nav className={`nb-wrap ${th} ${scrolled ? "nb-scrolled" : ""}`}>
        <div className="nb-glow-bar" />
        <div className="nb-row">

          <a className="nb-logo" href="/">
            <div className="nb-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 13h2l2 5 4-10 3 7 2-4h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="nb-logo-name">TableTime</span>
          </a>

          <div className="nb-links">
            {navLinks.map((link) => (
              <button key={link} className={`nb-link ${activeLink === link ? "nb-active" : ""}`} onClick={() => handleNavClick(link)}>
                {link}
              </button>
            ))}
          </div>

          <div className="nb-actions">
            <button className="nb-toggle" onClick={() => setIsDark(!isDark)} title={isDark ? "Light mode" : "Dark mode"}>
              <span className="nb-toggle-knob">{isDark ? "🌙" : "☀"}</span>
            </button>

            {!isLoggedIn && (
              <>
                <button className="nb-login" onClick={handleLoginClick}>Login</button>
                <button className="nb-signup" onClick={handleRegisterClick}>
                  Sign Up <span style={{fontSize:14}}>→</span>
                </button>
              </>
            )}

            {isLoggedIn && (
              <>
                {/* 🔔 Notification Bell */}
                <NotificationBell theme={th} />

                {/* 🛒 Cart Button */}
                <button className="nb-cart-btn" onClick={() => navigate("/cart")} title="Cart">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  {totalItems > 0 && (
                    <span className="nb-cart-badge">{totalItems > 9 ? "9+" : totalItems}</span>
                  )}
                </button>

                {/* 👤 Avatar */}
                <div className="nb-avatar-wrap">
                  <button
                    ref={avatarBtnRef}
                    className="nb-avatar-btn"
                    onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
                  >
                    <div className="nb-avatar-circle" style={!userPicture ? { background:`linear-gradient(135deg,${colorFrom},${colorTo})` } : {}}>
                      {userPicture
                        ? <img src={userPicture} alt={userName} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",display:"block"}} referrerPolicy="no-referrer"/>
                        : userInitial
                      }
                    </div>
                    <span className="nb-avatar-name">{userName}</span>
                    <span className={`nb-avatar-chevron${dropdownOpen ? " open" : ""}`}>▼</span>
                  </button>

                  {dropdownOpen && (
                    <div ref={dropdownRef} className={`nb-dropdown ${th}`} style={{ top: dropdownPos.top, right: dropdownPos.right }}>
                      <div className="nb-dd-header">
                        <div className="nb-dd-av" style={!userPicture ? {background:`linear-gradient(135deg,${colorFrom},${colorTo})`} : {padding:0,overflow:"hidden"}}>
                          {userPicture
                            ? <img src={userPicture} alt={userName} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",display:"block"}} referrerPolicy="no-referrer"/>
                            : userInitial
                          }
                        </div>
                        <div>
                          <div className={`nb-dd-name ${th}`}>{userName}</div>
                          <div className={`nb-dd-email ${th}`}>{userEmail}</div>
                        </div>
                      </div>

                      <button className={`nb-dd-item ${th}`} onClick={() => { navigate("/dashboard"); setDropdownOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        My Profile
                      </button>

                      <button className={`nb-dd-item ${th}`} onClick={() => { navigate("/restaurants"); setDropdownOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4v11"/><path d="M9 2v20M18 2v6a4 4 0 01-4 4v10"/></svg>
                        Browse Restaurants
                      </button>

                      <button className={`nb-dd-item ${th}`} onClick={() => { navigate("/my-bookings"); setDropdownOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        My Bookings
                      </button>

                      {/* Cart shortcut */}
                      <button className={`nb-dd-item ${th}`} onClick={() => { navigate("/cart"); setDropdownOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                        My Cart
                        {totalItems > 0 && <span className={`nb-dd-badge ${th}`} style={{background:"rgba(251,191,36,0.18)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.3)"}}>{totalItems}</span>}
                      </button>

                      {userRole === "user" && (
                        <button className={`nb-dd-item nb-dd-become ${th}`} onClick={() => { navigate("/apply-owner"); setDropdownOpen(false); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          Become an Owner
                          <span className={`nb-dd-badge ${th}`} style={{background:"rgba(16,185,129,0.15)",color:"#10b981",border:"1px solid rgba(16,185,129,0.25)"}}>New</span>
                        </button>
                      )}

                      {userRole === "owner" && (
                        <button className={`nb-dd-item nb-dd-owner ${th}`} onClick={() => { navigate("/owner/dashboard"); setDropdownOpen(false); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          Owner Dashboard
                          <span className={`nb-dd-badge ${th}`}>Owner</span>
                        </button>
                      )}

                      {userRole === "superadmin" && (
                        <button className={`nb-dd-item nb-dd-admin ${th}`} onClick={() => { navigate("/admin/dashboard"); setDropdownOpen(false); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                          Admin Panel
                          <span className={`nb-dd-badge ${th}`}>Admin</span>
                        </button>
                      )}

                      <div className={`nb-dd-sep ${th}`}/>

                      <button className={`nb-dd-item nb-dd-logout ${th}`} onClick={handleLogout}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}