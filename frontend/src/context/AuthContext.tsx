import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import api from "../api/api";

// ── Types ─────────────────────────────────────────────────────
export interface AuthUser {
  id:          string;
  name:        string;
  email:       string;
  role:        "user" | "owner" | "superadmin";
  picture:     string | null;
  isGoogleUser:boolean;
}

interface AuthContextType {
  user:        AuthUser | null;
  token:       string | null;
  isLoggedIn:  boolean;
  loading:     boolean;
  login:       (token: string, user: AuthUser) => void;
  logout:      () => void;
  updateUser:  (updates: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── On mount — restore from localStorage ──────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser  = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        // Corrupted data — clear
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token",   newToken);
    localStorage.setItem("role",    newUser.role);
    localStorage.setItem("name",    newUser.name);
    localStorage.setItem("email",   newUser.email);
    localStorage.setItem("picture", newUser.picture || "");
    localStorage.setItem("user",    JSON.stringify(newUser));
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.clear();
  }, []);

  // ── Update user (partial) ─────────────────────────────────
  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("user",    JSON.stringify(updated));
      localStorage.setItem("role",    updated.role);
      localStorage.setItem("name",    updated.name);
      localStorage.setItem("picture", updated.picture || "");
      return updated;
    });
  }, []);

  // ── Refresh user from server ──────────────────────────────
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const freshUser = res.data.user;
      const updatedUser: AuthUser = {
        id:           freshUser._id,
        name:         freshUser.name,
        email:        freshUser.email,
        role:         freshUser.role,
        picture:      freshUser.picture || null,
        isGoogleUser: freshUser.isGoogleUser || false,
      };
      updateUser(updatedUser);
    } catch {
      // Token invalid — logout
      logout();
    }
  }, [token, updateUser, logout]);

  const value: AuthContextType = {
    user,
    token,
    isLoggedIn: !!token && !!user,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}