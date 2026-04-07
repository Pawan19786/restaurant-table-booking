import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "../src/context/CartContext";
import { NotificationProvider } from "../src/context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
// import RestaurantScene from "./components/RestaurantScene"; // ← HELD (included inside LandingPage)
import HeroSection from "./Pages/HeroSection";
import LandingPage from "./Pages/LandingPage";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import AdminDashboard from "./Pages/AdminDashboard";
import OwnerDashboard from "./Pages/OwnerDashboard";
import Unauthorized from "./Pages/Unauthorized";
import ApplyOwner from "./Pages/Applyowner";
import RestaurantListing from "../src/Pages/Restaurantlisting";
import Restaurantdetail from "./Pages/Restaurantdetail";   // updated file
import MyBookings from "./Pages/MyBookings";
import CartPage from "../src/Pages/CartPage";            // NEW

function App() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <ThemeProvider>
            <Router>
            <Toaster position="top-center" toastOptions={{ style: { zIndex: 999999 } }} containerStyle={{ zIndex: 999999 }} />
            <Routes>

              {/* ── Public ───────────────────────────────────── */}
              {/* LandingPage = Bottle → RestaurantScene → HeroSection */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/restaurants" element={<RestaurantListing />} />
              <Route path="/restaurants/:id" element={<Restaurantdetail />} />

              <Route path="/login" element={
                <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}
                  onSwitchToRegister={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }} />
              } />
              <Route path="/register" element={
                <Register isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)}
                  onSwitchToLogin={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }} />
              } />

              {/* ── Logged-in users ──────────────────────────── */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={["user", "owner", "superadmin"]}>
                  <HeroSection />
                </ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute allowedRoles={["user", "owner", "superadmin"]}>
                  <MyBookings />
                </ProtectedRoute>
              } />
              <Route path="/apply-owner" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <ApplyOwner />
                </ProtectedRoute>
              } />

              {/* ── Cart (NEW) ───────────────────────────────── */}
              <Route path="/cart" element={
                <ProtectedRoute allowedRoles={["user", "owner", "superadmin"]}>
                  <CartPage />
                </ProtectedRoute>
              } />

              {/* ── Owner only ───────────────────────────────── */}
              <Route path="/owner/dashboard" element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />

              {/* ── Superadmin only ──────────────────────────── */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={["superadmin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* <Route path="/restaurant-scene" element={<RestaurantScene />} /> */}
            </Routes>
          </Router>
          </ThemeProvider>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;