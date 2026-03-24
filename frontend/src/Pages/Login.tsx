import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
};

type View = "login" | "forgot" | "forgot-sent";

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) => {
  const [view,         setView]         = useState<View>("login");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [forgotEmail,  setForgotEmail]  = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [forgotLoading,setForgotLoading]= useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Reset form on close ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView("login"); setEmail(""); setPassword("");
        setForgotEmail(""); setShowPassword(false);
      }, 300);
    }
  }, [isOpen]);

  // ── Lock body scroll ─────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // ── Save user data via AuthContext ──────────────────────────
  const saveUserData = (token: string, user: any) => {
    login(token, {
      id:          user.id || user._id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      picture:     user.picture || null,
      isGoogleUser: user.isGoogleUser || false,
    });
  };

  // ── Navigate by role ─────────────────────────────────────────
  const navigateByRole = (role: string) => {
    if (role === "superadmin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/dashboard");
  };

  // ── Login handler ────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data?.token) {
        saveUserData(response.data.token, response.data.user);
        toast.success(`Welcome back, ${response.data.user.name}!`);
        onClose();
        navigateByRole(response.data.user.role);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ──────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setView("forgot-sent");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Google login ─────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      if (response.data?.token) {
        saveUserData(response.data.token, response.data.user);
        toast.success("Google login successful!");
        onClose();
        navigateByRole(response.data.user.role);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Google login failed");
    }
  };

  const handleSwitchToRegister = () => {
    onClose();
    setTimeout(() => onSwitchToRegister(), 120);
  };

  if (!isOpen) return null;

  // ─── Dynamic banner content ──────────────────────────────────
  const bannerContent = {
    login:        { title: "Welcome back",    sub: "Sign in to your TableTime account" },
    forgot:       { title: "Reset password",  sub: "We'll send a secure link to your inbox" },
    "forgot-sent":{ title: "Check your inbox",sub: `Reset link sent to ${forgotEmail}` },
  }[view];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Cinzel:wght@400;500&display=swap');

        /* ── ANIMATIONS ── */
        @keyframes lm-overlayIn  { from{opacity:0} to{opacity:1} }
        @keyframes lm-cardIn     { from{opacity:0;transform:scale(0.93) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes lm-viewIn     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lm-spin       { to{transform:rotate(360deg)} }
        @keyframes lm-checkIn    { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.18) rotate(4deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes lm-orb-drift  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,-14px) scale(1.08)} }
        @keyframes lm-shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes lm-pulse-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }

        /* ── OVERLAY ── */
        .lm-overlay {
          position:fixed; inset:0; z-index:999;
          display:flex; align-items:center; justify-content:center; padding:16px;
          background:rgba(4,2,12,0.82);
          backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
          animation:lm-overlayIn 0.2s ease both;
        }

        /* ── CARD ── */
        .lm-card {
          position:relative; width:100%; max-width:420px;
          border-radius:24px; overflow:hidden;
          background:#0d0622;
          border:1px solid rgba(160,96,240,0.22);
          box-shadow:0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(160,96,240,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
          animation:lm-cardIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both;
          font-family:'Montserrat',sans-serif;
        }

        /* ── GLOW ORBS (background) ── */
        .lm-orb {
          position:absolute; border-radius:50%; pointer-events:none;
          filter:blur(60px); animation:lm-orb-drift 14s ease-in-out infinite;
        }
        .lm-orb-1 { width:260px;height:260px;top:-80px;left:-80px;background:radial-gradient(circle,rgba(112,48,208,.22) 0%,transparent 70%); }
        .lm-orb-2 { width:200px;height:200px;bottom:-60px;right:-60px;background:radial-gradient(circle,rgba(80,20,180,.18) 0%,transparent 70%);animation-delay:-7s; }

        /* ── TOP GLOW LINE ── */
        .lm-glow-line {
          height:1px;
          background:linear-gradient(90deg,transparent 0%,rgba(160,100,255,.5) 30%,rgba(220,180,255,.9) 50%,rgba(160,100,255,.5) 70%,transparent 100%);
        }

        /* ── BANNER ── */
        .lm-banner {
          padding:26px 28px 22px; position:relative; z-index:2;
          border-bottom:1px solid rgba(160,96,240,0.1);
        }
        .lm-brand {
          display:flex; align-items:center; gap:9px; margin-bottom:18px;
        }
        .lm-brand-icon {
          width:30px; height:30px; border-radius:8px; flex-shrink:0;
          background:linear-gradient(135deg,#7030d0,#a060f0);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 0 14px rgba(130,60,220,.4);
        }
        .lm-brand-name {
          font-family:'Cinzel',serif; font-size:13px; font-weight:500;
          letter-spacing:0.08em;
          background:linear-gradient(135deg,#d4b0ff,#f0e0ff,#a070e0);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .lm-banner-title {
          font-family:'Cinzel',serif; font-size:22px; font-weight:500;
          letter-spacing:0.04em; margin-bottom:6px; line-height:1.2;
          background:linear-gradient(135deg,#e0d0ff 0%,#fff 50%,#c0a0ff 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:lm-shimmer 5s linear infinite;
        }
        .lm-banner-sub {
          font-size:12px; font-weight:300; letter-spacing:.03em;
          color:rgba(200,165,255,.45); line-height:1.5;
        }

        /* ── CLOSE BUTTON ── */
        .lm-close {
          position:absolute; top:14px; right:16px;
          width:28px; height:28px; border-radius:50%; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          background:rgba(160,96,240,.1); color:rgba(200,165,255,.55);
          font-size:17px; line-height:1; transition:all .18s;
        }
        .lm-close:hover { background:rgba(160,96,240,.2); color:#e0c4ff; }

        /* ── BODY ── */
        .lm-body { padding:22px 28px 26px; position:relative; z-index:2; }
        .lm-view { animation:lm-viewIn 0.22s ease both; }

        /* ── FIELD ── */
        .lm-field { margin-bottom:14px; }
        .lm-label {
          display:block; font-size:10px; font-weight:600;
          color:rgba(200,165,255,.4); letter-spacing:.12em; text-transform:uppercase;
          margin-bottom:7px;
        }

        /* ── INPUT ── */
        .lm-input-wrap { position:relative; }
        .lm-input-icon {
          position:absolute; left:13px; top:50%; transform:translateY(-50%);
          color:rgba(160,96,240,.5); pointer-events:none;
          display:flex; align-items:center;
        }
        .lm-input {
          width:100%;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(160,96,240,.18);
          border-radius:10px;
          padding:12px 13px 12px 40px;
          font-size:13px; font-weight:400;
          color:rgba(230,215,255,.9);
          outline:none;
          font-family:'Montserrat',sans-serif;
          transition:border-color .2s, box-shadow .2s, background .2s;
        }
        .lm-input:focus {
          border-color:rgba(160,96,240,.55);
          box-shadow:0 0 0 3px rgba(160,96,240,.1);
          background:rgba(160,96,240,.06);
        }
        .lm-input::placeholder { color:rgba(180,140,255,.22); }

        /* ── EYE TOGGLE ── */
        .lm-eye {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer;
          color:rgba(160,120,240,.45); display:flex; align-items:center; padding:3px;
          transition:color .15s;
        }
        .lm-eye:hover { color:rgba(200,160,255,.8); }

        /* ── META ROW ── */
        .lm-row-meta {
          display:flex; justify-content:space-between; align-items:center;
          margin-bottom:18px; margin-top:-2px;
        }
        .lm-remember {
          display:flex; align-items:center; gap:6px; cursor:pointer;
          font-size:11px; color:rgba(180,140,255,.4);
          font-family:'Montserrat',sans-serif;
        }
        .lm-remember input { accent-color:#a060f0; width:13px; height:13px; cursor:pointer; }
        .lm-forgot-link {
          font-size:11px; font-weight:500; color:rgba(160,96,240,.7);
          background:none; border:none; cursor:pointer;
          font-family:'Montserrat',sans-serif; transition:color .15s;
        }
        .lm-forgot-link:hover { color:#c090ff; }

        /* ── PRIMARY BUTTON ── */
        .lm-btn-primary {
          width:100%; border:none; border-radius:10px;
          padding:13px; font-size:13px; font-weight:600;
          cursor:pointer; letter-spacing:.06em; text-transform:uppercase;
          font-family:'Montserrat',sans-serif;
          background:linear-gradient(135deg,#6020b0,#9050e0,#b070ff);
          color:#fff;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all .22s;
          box-shadow:0 0 32px rgba(130,60,220,.35), 0 4px 14px rgba(0,0,0,.3);
          position:relative; overflow:hidden;
        }
        .lm-btn-primary::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
          transition:left .45s;
        }
        .lm-btn-primary:hover { transform:translateY(-1px); box-shadow:0 0 48px rgba(160,90,255,.5), 0 6px 18px rgba(0,0,0,.4); }
        .lm-btn-primary:hover::after { left:150%; }
        .lm-btn-primary:active { transform:scale(0.99); }
        .lm-btn-primary:disabled {
          background:rgba(160,96,240,.12); color:rgba(180,140,255,.35);
          cursor:not-allowed; transform:none; box-shadow:none;
        }

        /* ── SPINNER ── */
        .lm-spinner {
          display:inline-block; width:14px; height:14px; border-radius:50%;
          border:2px solid rgba(255,255,255,.2); border-top-color:#fff;
          animation:lm-spin .7s linear infinite;
        }

        /* ── DIVIDER ── */
        .lm-divider { display:flex; align-items:center; gap:10px; margin:18px 0; }
        .lm-div-line { flex:1; height:1px; background:rgba(160,96,240,.12); }
        .lm-div-txt { font-size:10px; color:rgba(180,140,255,.28); font-weight:500; letter-spacing:.08em; white-space:nowrap; }

        /* ── GOOGLE WRAPPER ── */
        .lm-google-wrap { width:100%; }
        .lm-google-wrap > div { width:100% !important; }

        /* ── SECONDARY BUTTON ── */
        .lm-btn-secondary {
          width:100%; border:1px solid rgba(160,96,240,.2); border-radius:10px;
          padding:12px; font-size:12px; font-weight:500; cursor:pointer;
          background:rgba(160,96,240,.06); color:rgba(200,165,255,.6);
          font-family:'Montserrat',sans-serif; margin-top:10px;
          display:flex; align-items:center; justify-content:center;
          transition:all .2s;
        }
        .lm-btn-secondary:hover { background:rgba(160,96,240,.12); color:rgba(215,185,255,.85); border-color:rgba(160,96,240,.35); }

        /* ── FOOTER ── */
        .lm-footer {
          margin-top:18px; text-align:center;
          font-size:12px; color:rgba(180,140,255,.38); letter-spacing:.02em;
        }
        .lm-footer-btn {
          background:none; border:none; cursor:pointer;
          font-size:12px; font-weight:600; color:rgba(180,140,255,.7);
          font-family:'Montserrat',sans-serif; transition:color .15s;
        }
        .lm-footer-btn:hover { color:#c090ff; }

        /* ── BACK BUTTON ── */
        .lm-back-btn {
          display:inline-flex; align-items:center; gap:5px;
          background:none; border:none; cursor:pointer;
          font-size:11px; color:rgba(180,140,255,.38);
          font-family:'Montserrat',sans-serif;
          margin-bottom:18px; padding:0; transition:color .15s;
        }
        .lm-back-btn:hover { color:rgba(200,165,255,.7); }

        /* ── HINT ── */
        .lm-hint {
          font-size:11px; color:rgba(180,140,255,.38);
          line-height:1.65; margin-bottom:16px; margin-top:-4px;
        }

        /* ── SUCCESS RING ── */
        .lm-success-ring {
          width:64px; height:64px; border-radius:50%;
          background:rgba(40,200,120,.1); border:1.5px solid rgba(40,200,120,.3);
          display:flex; align-items:center; justify-content:center;
          margin:4px auto 16px;
          animation:lm-checkIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
          box-shadow:0 0 24px rgba(40,200,120,.15);
        }

        /* ── TIP BOX ── */
        .lm-tip {
          background:rgba(160,96,240,.06); border:1px solid rgba(160,96,240,.12);
          border-radius:9px; padding:11px 14px; margin:14px 0;
          font-size:11px; color:rgba(180,140,255,.45); line-height:1.65; text-align:left;
        }

        /* ── SUCCESS TITLE ── */
        .lm-success-title {
          font-family:'Cinzel',serif; font-size:16px; font-weight:500;
          color:rgba(220,200,255,.85); letter-spacing:.04em; margin-bottom:6px;
        }
        .lm-success-sub {
          font-size:12px; color:rgba(180,140,255,.45); line-height:1.65;
        }
        .lm-success-email {
          font-weight:600; color:rgba(200,165,255,.75);
        }

        /* ── ORNAMENT ── */
        .lm-ornate {
          display:flex; align-items:center; gap:10px; margin:14px 0 16px;
        }
        .lm-orn-line {
          flex:1; height:1px;
          background:linear-gradient(90deg,transparent,rgba(160,96,240,.25));
        }
        .lm-orn-line-r { transform:scaleX(-1); }
        .lm-gem {
          width:5px; height:5px; transform:rotate(45deg); border-radius:1px;
          background:linear-gradient(135deg,#a060f0,#d090ff);
          box-shadow:0 0 8px rgba(160,96,240,.5);
        }
      `}</style>

      <div className="lm-overlay" onClick={onClose}>
        <div className="lm-card" onClick={(e) => e.stopPropagation()}>

          {/* Background orbs */}
          <div className="lm-orb lm-orb-1" />
          <div className="lm-orb lm-orb-2" />

          {/* Top glow line */}
          <div className="lm-glow-line" />

          {/* Close */}
          <button className="lm-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">×</button>

          {/* ── BANNER ── */}
          <div className="lm-banner">
            <div className="lm-brand">
              <div className="lm-brand-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 13h2l2 5 4-10 3 7 2-4h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="lm-brand-name">TableTime</span>
            </div>
            <div className="lm-banner-title">{bannerContent.title}</div>
            <div className="lm-banner-sub">{bannerContent.sub}</div>
          </div>

          {/* ── BODY ── */}
          <div className="lm-body">

            {/* ════ LOGIN VIEW ════ */}
            {view === "login" && (
              <div className="lm-view">
                <form onSubmit={handleLogin}>

                  {/* Email */}
                  <div className="lm-field">
                    <label className="lm-label">Email address</label>
                    <div className="lm-input-wrap">
                      <span className="lm-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="3"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </span>
                      <input
                        className="lm-input" type="email"
                        placeholder="you@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        required autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="lm-field">
                    <label className="lm-label">Password</label>
                    <div className="lm-input-wrap">
                      <span className="lm-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input
                        className="lm-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        style={{ paddingRight: 42 }}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        required autoComplete="current-password"
                      />
                      <button type="button" className="lm-eye"
                        onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember + Forgot */}
                  <div className="lm-row-meta">
                    <label className="lm-remember">
                      <input type="checkbox" /> Remember me
                    </label>
                    <button type="button" className="lm-forgot-link" onClick={() => setView("forgot")}>
                      Forgot password?
                    </button>
                  </div>

                  {/* Sign in button */}
                  <button type="submit" className="lm-btn-primary" disabled={loading}>
                    {loading ? (
                      <><span className="lm-spinner" /> Authenticating...</>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                          <polyline points="10 17 15 12 10 7"/>
                          <line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                        Sign in to your account
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="lm-divider">
                  <div className="lm-div-line" />
                  <span className="lm-div-txt">or continue with</span>
                  <div className="lm-div-line" />
                </div>

                {/* Google */}
                <div className="lm-google-wrap">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error("Google Sign-In failed")}
                    width="364" theme="filled_black" size="large"
                    shape="rectangular" text="signin_with" logo_alignment="left"
                  />
                </div>

                {/* Footer */}
                <p className="lm-footer">
                  New to TableTime?{" "}
                  <button type="button" className="lm-footer-btn" onClick={handleSwitchToRegister}>
                    Create a free account
                  </button>
                </p>
              </div>
            )}

            {/* ════ FORGOT PASSWORD VIEW ════ */}
            {view === "forgot" && (
              <div className="lm-view">
                <button className="lm-back-btn" onClick={() => setView("login")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back to sign in
                </button>

                <form onSubmit={handleForgotPassword}>
                  <div className="lm-field">
                    <label className="lm-label">Your email address</label>
                    <div className="lm-input-wrap">
                      <span className="lm-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="3"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </span>
                      <input
                        className="lm-input" type="email"
                        placeholder="you@example.com"
                        value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                        required autoFocus autoComplete="email"
                      />
                    </div>
                  </div>

                  <p className="lm-hint">
                    Enter the email linked to your account — we'll send a secure reset link valid for 15 minutes.
                  </p>

                  <button type="submit" className="lm-btn-primary" disabled={forgotLoading}>
                    {forgotLoading ? (
                      <><span className="lm-spinner" /> Sending...</>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Send reset link
                      </>
                    )}
                  </button>
                </form>

                <p className="lm-footer" style={{ marginTop: 16 }}>
                  Remember it?{" "}
                  <button type="button" className="lm-footer-btn" onClick={() => setView("login")}>
                    Sign in
                  </button>
                </p>
              </div>
            )}

            {/* ════ FORGOT SENT VIEW ════ */}
            {view === "forgot-sent" && (
              <div className="lm-view" style={{ textAlign: "center" }}>

                <div className="lm-success-ring">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(40,200,120,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>

                <div className="lm-success-title">Email sent!</div>
                <div className="lm-success-sub">
                  We sent a reset link to{" "}
                  <span className="lm-success-email">{forgotEmail}</span>
                </div>

                <div className="lm-tip">
                  Didn't receive it? Check your spam folder or wait a minute before requesting again.
                </div>

                <button type="button" className="lm-btn-primary" onClick={() => setView("login")}>
                  Back to sign in
                </button>

                <button type="button" className="lm-btn-secondary"
                  onClick={() => { setForgotEmail(""); setView("forgot"); }}>
                  Try a different email
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal;