import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

type RegisterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
};

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { login } = useAuth();

  // ── Reset form on close ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormData({ name: "", email: "", password: "" });
        setAgree(false);
        setShowPassword(false);
      }, 300);
    }
  }, [isOpen]);

  // ── Lock body scroll ─────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Save user via AuthContext ────────────────────────────────
  const saveUserData = (token: string, user: any) => {
    login(token, {
      id:           user.id || user._id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      picture:      user.picture || null,
      isGoogleUser: user.isGoogleUser || false,
    });
  };

  // ── Navigate by role ─────────────────────────────────────────
  const navigateByRole = (role: string) => {
    if (role === "superadmin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/dashboard");
  };

  // ── Register handler ─────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) { toast.error("Please accept Terms and Privacy Policy"); return; }
    setLoading(true);
    try {
      const response = await api.post("/auth/register", formData);
      if (response.data?.token) {
        saveUserData(response.data.token, response.data.user);
        toast.success("Account created successfully!");
        onClose();
        navigateByRole(response.data.user.role);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Google signup ────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      if (response.data?.token) {
        saveUserData(response.data.token, response.data.user);
        toast.success("Google signup successful!");
        onClose();
        navigateByRole(response.data.user.role);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Google signup failed");
    }
  };

  const handleSwitchToLogin = () => {
    onClose();
    setTimeout(() => onSwitchToLogin(), 120);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Cinzel:wght@400;500&display=swap');

        /* ── ANIMATIONS ── */
        @keyframes rm-overlayIn  { from{opacity:0} to{opacity:1} }
        @keyframes rm-cardIn     { from{opacity:0;transform:scale(0.93) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes rm-spin       { to{transform:rotate(360deg)} }
        @keyframes rm-orb-drift  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,-14px) scale(1.08)} }
        @keyframes rm-shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }

        /* ── OVERLAY ── */
        .rm-overlay {
          position:fixed; inset:0; z-index:999;
          display:flex; align-items:center; justify-content:center; padding:16px;
          background:rgba(4,2,12,0.82);
          backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
          animation:rm-overlayIn 0.2s ease both;
        }

        /* ── CARD ── */
        .rm-card {
          position:relative; width:100%; max-width:420px;
          border-radius:24px; overflow:hidden;
          background:rgba(13,6,34,0.7);
          backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(160,96,240,0.22);
          box-shadow:0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(160,96,240,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
          animation:rm-cardIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both;
          font-family:'Montserrat',sans-serif;
        }

        /* ── GLOW ORBS ── */
        .rm-orb {
          position:absolute; border-radius:50%; pointer-events:none;
          filter:blur(60px); animation:rm-orb-drift 14s ease-in-out infinite;
        }
        .rm-orb-1 { width:260px;height:260px;top:-80px;left:-80px;background:radial-gradient(circle,rgba(225,29,72,.18) 0%,transparent 70%); }
        .rm-orb-2 { width:200px;height:200px;bottom:-60px;right:-60px;background:radial-gradient(circle,rgba(244,63,94,.15) 0%,transparent 70%);animation-delay:-7s; }

        /* ── TOP GLOW LINE ── */
        .rm-glow-line {
          height:1px;
          background:linear-gradient(90deg,transparent 0%,rgba(244,63,94,.5) 30%,rgba(253,164,175,.9) 50%,rgba(244,63,94,.5) 70%,transparent 100%);
        }

        /* ── CLOSE BUTTON ── */
        .rm-close {
          position:absolute; top:14px; right:16px; z-index:10;
          width:28px; height:28px; border-radius:50%; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          background:rgba(225,29,72,.1); color:rgba(253,164,175,.55);
          font-size:17px; line-height:1; transition:all .18s;
        }
        .rm-close:hover { background:rgba(225,29,72,.2); color:#ffe4e6; }

        /* ── BANNER ── */
        .rm-banner {
          padding:26px 28px 18px; position:relative; z-index:2;
          border-bottom:1px solid rgba(225,29,72,0.1);
        }
        .rm-brand {
          display:flex; align-items:center; gap:9px; margin-bottom:18px;
        }
        .rm-brand-icon {
          width:30px; height:30px; border-radius:8px; flex-shrink:0;
          background:linear-gradient(135deg,#e11d48,#f43f5e);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 0 14px rgba(225,29,72,.4);
        }
        .rm-brand-name {
          font-family:'Cinzel',serif; font-size:13px; font-weight:500;
          letter-spacing:0.08em;
          background:linear-gradient(135deg,#fecdd3,#fff1f2,#fb7185);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .rm-banner-title {
          font-family:'Cinzel',serif; font-size:22px; font-weight:500;
          letter-spacing:0.04em; margin-bottom:6px; line-height:1.2;
          background:linear-gradient(135deg,#ffe4e6 0%,#fff 50%,#fecdd3 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:rm-shimmer 5s linear infinite;
        }
        .rm-banner-sub {
          font-size:12px; font-weight:300; letter-spacing:.03em;
          color:rgba(253,164,175,.45); line-height:1.5;
        }

        /* ── BODY ── */
        .rm-body { padding:20px 28px 26px; position:relative; z-index:2; }

        /* ── FIELD ── */
        .rm-field { margin-bottom:14px; }
        .rm-label {
          display:block; font-size:10px; font-weight:600;
          color:rgba(253,164,175,.4); letter-spacing:.12em; text-transform:uppercase;
          margin-bottom:7px;
        }

        /* ── INPUT ── */
        .rm-input-wrap { position:relative; }
        .rm-input-icon {
          position:absolute; left:13px; top:50%; transform:translateY(-50%);
          color:rgba(225,29,72,.5); pointer-events:none;
          display:flex; align-items:center;
        }
        .rm-input {
          width:100%;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(225,29,72,.18);
          border-radius:10px;
          padding:12px 13px 12px 40px;
          font-size:13px; font-weight:400;
          color:rgba(255,228,230,.9);
          outline:none;
          font-family:'Montserrat',sans-serif;
          transition:border-color .2s, box-shadow .2s, background .2s;
        }
        .rm-input:focus {
          border-color:rgba(244,63,94,.55);
          box-shadow:0 0 0 3px rgba(225,29,72,.1);
          background:rgba(225,29,72,.06);
        }
        .rm-input::placeholder { color:rgba(251,113,133,.25); }

        /* ── EYE TOGGLE ── */
        .rm-eye {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer;
          color:rgba(244,63,94,.45); display:flex; align-items:center; padding:3px;
          transition:color .15s;
        }
        .rm-eye:hover { color:rgba(251,113,133,.8); }

        /* ── AGREE ROWS ── */
        .rm-agree {
          display:flex; align-items:flex-start; gap:8px; cursor:pointer;
          margin-bottom:18px; margin-top:-2px;
        }
        .rm-agree input { accent-color:#e11d48; width:14px; height:14px; cursor:pointer; flex-shrink:0; margin-top:2px; }
        .rm-agree-text {
          font-size:10px; color:rgba(251,113,133,.45);
          font-family:'Montserrat',sans-serif; line-height:1.4;
        }
        .rm-agree-link {
          color:rgba(244,63,94,.8); transition:color .15s;
        }
        .rm-agree-link:hover { color:#f43f5e; text-decoration:underline; }

        /* ── PRIMARY BUTTON ── */
        .rm-btn-primary {
          width:100%; border:none; border-radius:10px;
          padding:13px; font-size:13px; font-weight:600;
          cursor:pointer; letter-spacing:.06em; text-transform:uppercase;
          font-family:'Montserrat',sans-serif;
          background:linear-gradient(135deg,#be123c,#e11d48,#f43f5e);
          color:#fff;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all .22s;
          box-shadow:0 0 32px rgba(225,29,72,.35), 0 4px 14px rgba(0,0,0,.3);
          position:relative; overflow:hidden;
        }
        .rm-btn-primary::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
          transition:left .45s;
        }
        .rm-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 0 48px rgba(244,63,94,.5), 0 6px 18px rgba(0,0,0,.4); }
        .rm-btn-primary:hover:not(:disabled)::after { left:150%; }
        .rm-btn-primary:active:not(:disabled) { transform:scale(0.99); }
        .rm-btn-primary:disabled {
          background:rgba(225,29,72,.12); color:rgba(251,113,133,.35);
          cursor:not-allowed; transform:none; box-shadow:none;
        }

        /* ── SPINNER ── */
        .rm-spinner {
          display:inline-block; width:14px; height:14px; border-radius:50%;
          border:2px solid rgba(255,255,255,.2); border-top-color:#fff;
          animation:rm-spin .7s linear infinite;
        }

        /* ── DIVIDER ── */
        .rm-divider { display:flex; align-items:center; gap:10px; margin:16px 0; }
        .rm-div-line { flex:1; height:1px; background:rgba(225,29,72,.12); }
        .rm-div-txt { font-size:10px; color:rgba(251,113,133,.3); font-weight:500; letter-spacing:.08em; white-space:nowrap; }

        /* ── GOOGLE WRAPPER ── */
        .rm-google-wrap { width:100%; }
        .rm-google-wrap > div { width:100% !important; }

        /* ── FOOTER ── */
        .rm-footer {
          margin-top:16px; text-align:center;
          font-size:12px; color:rgba(251,113,133,.4); letter-spacing:.02em;
        }
        .rm-footer-btn {
          background:none; border:none; cursor:pointer;
          font-size:12px; font-weight:600; color:rgba(244,63,94,.75);
          font-family:'Montserrat',sans-serif; transition:color .15s;
        }
        .rm-footer-btn:hover { color:#fb7185; text-decoration:underline; }

        /* ════════════ LIGHT THEME ════════════ */
        .rm-overlay.light { background:rgba(255,241,242,0.75); }
        .rm-overlay.light .rm-card {
          background:rgba(255,255,255,0.9);
          border:1px solid rgba(225,29,72,0.15);
          box-shadow:0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(225,29,72,0.05);
        }
        .rm-overlay.light .rm-orb-1 { background:radial-gradient(circle,rgba(225,29,72,.15) 0%,transparent 70%); }
        .rm-overlay.light .rm-orb-2 { background:radial-gradient(circle,rgba(244,63,94,.12) 0%,transparent 70%); }
        .rm-overlay.light .rm-glow-line { background:linear-gradient(90deg,transparent 0%,rgba(225,29,72,.4) 30%,rgba(225,29,72,.8) 50%,rgba(225,29,72,.4) 70%,transparent 100%); }
        .rm-overlay.light .rm-banner { border-bottom:1px solid rgba(254,205,211,0.8); }
        .rm-overlay.light .rm-brand-icon { background:linear-gradient(135deg,#e11d48,#f43f5e); box-shadow:0 0 14px rgba(225,29,72,.3); }
        .rm-overlay.light .rm-brand-name {
          background:linear-gradient(135deg,#4c0519,#881337);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .rm-overlay.light .rm-banner-title {
          background:linear-gradient(135deg,#4c0519 0%,#e11d48 50%,#4c0519 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .rm-overlay.light .rm-banner-sub { color:#9f1239; }
        .rm-overlay.light .rm-close { background:rgba(225,29,72,.06); color:#881337; }
        .rm-overlay.light .rm-close:hover { background:rgba(225,29,72,.12); color:#4c0519; }
        .rm-overlay.light .rm-label { color:#881337; }
        .rm-overlay.light .rm-input-icon { color:#e11d48; }
        .rm-overlay.light .rm-input {
          background:rgba(255,241,242,0.6); border:1px solid rgba(254,205,211,0.8);
          color:#4c0519;
        }
        .rm-overlay.light .rm-input:focus {
          border-color:rgba(225,29,72,.4); box-shadow:0 0 0 3px rgba(225,29,72,.1);
          background:#ffffff;
        }
        .rm-overlay.light .rm-input::placeholder { color:#fda4af; }
        .rm-overlay.light .rm-eye { color:#fb7185; }
        .rm-overlay.light .rm-eye:hover { color:#e11d48; }
        .rm-overlay.light .rm-agree-text { color:#9f1239; }
        .rm-overlay.light .rm-agree-link { color:#e11d48; }
        .rm-overlay.light .rm-agree-link:hover { color:#be123c; }
        .rm-overlay.light .rm-btn-primary {
          background:linear-gradient(135deg,#be123c,#e11d48); color:#fff;
          box-shadow:0 8px 18px rgba(225,29,72,.2);
        }
        .rm-overlay.light .rm-btn-primary:hover:not(:disabled) { box-shadow:0 12px 24px rgba(225,29,72,.35); }
        .rm-overlay.light .rm-div-line { background:rgba(254,205,211,0.8); }
        .rm-overlay.light .rm-div-txt { color:#fb7185; }
        .rm-overlay.light .rm-footer { color:#9f1239; }
        .rm-overlay.light .rm-footer-btn { color:#e11d48; }
        .rm-overlay.light .rm-footer-btn:hover { color:#be123c; }

      `}</style>

      <div className={`rm-overlay${!isDark ? " light" : ""}`} onClick={onClose}>
        <div className="rm-card" onClick={(e) => e.stopPropagation()}>
          
          <div className="rm-orb rm-orb-1" />
          <div className="rm-orb rm-orb-2" />
          <div className="rm-glow-line" />

          <button className="rm-close" onClick={onClose} aria-label="Close">×</button>

          <div className="rm-banner">
            <div className="rm-brand">
              <div className="rm-brand-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 13h2l2 5 4-10 3 7 2-4h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="rm-brand-name">TableTime</span>
            </div>
            <div className="rm-banner-title">Create an account</div>
            <div className="rm-banner-sub">Join us to book tables & order food seamlessly</div>
          </div>

          <div className="rm-body">
            <form onSubmit={handleRegister}>
              {/* Name */}
              <div className="rm-field">
                <label className="rm-label">Full Name</label>
                <div className="rm-input-wrap">
                  <span className="rm-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    className="rm-input" type="text" name="name"
                    placeholder="John Doe"
                    value={formData.name} onChange={handleChange} required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="rm-field">
                <label className="rm-label">Email address</label>
                <div className="rm-input-wrap">
                  <span className="rm-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="3"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    className="rm-input" type="email" name="email"
                    placeholder="you@example.com"
                    value={formData.email} onChange={handleChange} required autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="rm-field">
                <label className="rm-label">Password</label>
                <div className="rm-input-wrap">
                  <span className="rm-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    className="rm-input" name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    style={{ paddingRight: 42 }}
                    value={formData.password} onChange={handleChange} required autoComplete="new-password"
                  />
                  <button type="button" className="rm-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="rm-agree">
                <input type="checkbox" checked={agree} onChange={() => setAgree(!agree)} />
                <span className="rm-agree-text">
                  I agree to TableTime's <span className="rm-agree-link">Terms of Service</span>, <span className="rm-agree-link">Privacy Policy</span> and <span className="rm-agree-link">Content Policies</span>
                </span>
              </label>

              {/* Submit */}
              <button type="submit" className="rm-btn-primary" disabled={loading || !agree}>
                {loading ? (
                  <><span className="rm-spinner" /> Creating account...</>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Create account
                  </>
                )}
              </button>
            </form>

            <div className="rm-divider">
              <div className="rm-div-line" />
              <span className="rm-div-txt">or continue with</span>
              <div className="rm-div-line" />
            </div>

            <div className="rm-google-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google Sign-Up failed")}
                width="364" theme="filled_black" size="large"
                shape="rectangular" text="signup_with" logo_alignment="left"
              />
            </div>

            <p className="rm-footer">
              Already have an account?{" "}
              <button type="button" className="rm-footer-btn" onClick={handleSwitchToLogin}>
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterModal;