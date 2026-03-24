import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Nav from "./Components/Nav.js";
import ToggleSwitch from "./Components/ToggleSwitch.js";
import SignupModal from "./Pages/SignupModal.js";
import Loader from "./Components/loader.js";
//import Lottie from "lottie-react";
//import LocationDetector from "./Components/LocationDetector.js";
import SplashScreen from "./Components/SplashScreen.js"; // Import SplashScreen

const Coursel = lazy(() => import("./Components/Coursel.js"));
const Collection = lazy(() => import("./Components/Collection.js"));
const About = lazy(() => import("./Pages/About.js"));
const Login = lazy(() => import("./Pages/Login.js"));

function App() {
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true); // Control Splash Screen
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Optional: You can keep this for other loading logic or remove if SplashScreen handles it.
    // The SplashScreen component handles its own timeout for visibility.
    const timer = setTimeout(() => setLoading(false), 2000); // Simulate content loading
    return () => clearTimeout(timer);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {!showSplash && (
        <Router>
          <Nav setLoading={setLoading} onSignupClick={() => setShowSignup(true)} onLoginClick={() => setShowLogin(true)} />
          {loading && <Loader />}
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<><Coursel /><Collection /></>} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Suspense>
          <SignupModal show={showSignup} onClose={() => setShowSignup(false)} />
          {showLogin && <Login show={showLogin} onClose={() => setShowLogin(false)} />}
        </Router>
      )}
    </>
  );
}

export default App;
