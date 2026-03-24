import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

type RegisterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
};

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [agree,   setAgree]   = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate       = useNavigate();
  const { login }      = useAuth();

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
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-[3px] px-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[420px] rounded-xl bg-white px-7 py-7 shadow-[0_8px_40px_rgba(0,0,0,0.25)] animate-[popup_0.28s_ease-out]"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-4 text-3xl leading-none text-gray-600 transition hover:text-black"
        >
          ×
        </button>

        <h2 className="mb-6 text-3xl font-medium text-gray-800">Sign up</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            name="name" type="text" placeholder="Full Name"
            value={formData.name} onChange={handleChange} required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <input
            name="email" type="email" placeholder="Email"
            value={formData.email} onChange={handleChange} required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <input
            name="password" type="password" placeholder="Password"
            value={formData.password} onChange={handleChange} required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />

          <label className="flex items-start gap-3 text-sm leading-6 text-gray-600">
            <input
              type="checkbox" checked={agree} onChange={() => setAgree(!agree)}
              className="mt-1 h-4 w-4 accent-red-500"
            />
            <span>
              I agree to TableTime&apos;s{" "}
              <span className="cursor-pointer text-red-500 hover:underline">Terms of Service</span>,{" "}
              <span className="cursor-pointer text-red-500 hover:underline">Privacy Policy</span>{" "}
              and{" "}
              <span className="cursor-pointer text-red-500 hover:underline">Content Policies</span>
            </span>
          </label>

          <button
            type="submit" disabled={loading || !agree}
            className={`w-full rounded-lg py-3 text-base font-medium text-white transition ${
              loading || !agree ? "cursor-not-allowed bg-gray-300" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center">
          <div className="h-px flex-1 bg-gray-300"></div>
          <span className="px-4 text-sm text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-300"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google Sign-Up failed")}
          />
        </div>

        <p className="mt-6 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <button type="button" onClick={handleSwitchToLogin}
            className="font-medium text-red-500 hover:underline">
            Log in
          </button>
        </p>

        <style>{`
          @keyframes popup {
            0%   { opacity:0; transform:scale(0.92) translateY(18px); }
            100% { opacity:1; transform:scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default RegisterModal;