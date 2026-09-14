import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, NavLink, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import BookingPage from "./pages/BookingPage";
import AdminPanel from "./pages/AdminPanel";
import Team from "./pages/Team";
import { useLiveSensors } from "./hooks/useLiveSensors";
import { useSlotOccupancy } from "./hooks/useSlotOccupancy";
import { Menu, X, Database } from "lucide-react";

function AppContent() {
  const { liveData, isConnected } = useLiveSensors();
  const { slots, loading: slotsLoading } = useSlotOccupancy();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Scroll to `#live-status` element on hash change or route load
  useEffect(() => {
    if (location.hash === "#live-status") {
      const el = document.getElementById("live-status");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, [location]);

  // Derived occupancy metrics for navbar status pill
  const freeSlotsCount = slotsLoading ? 0 : slots.filter((s) => s.status === "Vacant").length;
  const totalSlots = slotsLoading ? 4 : slots.length;
  const isSandbox = localStorage.getItem("kalki_sandbox") === "true";

  const navLinkClass = ({ isActive }) => 
    `font-display text-xs uppercase tracking-wider font-semibold transition ${
      isActive ? "text-kalki-live" : "text-kalki-textMuted hover:text-kalki-textPrimary"
    } focus:ring-2 focus:ring-kalki-live focus:outline-none rounded px-2 py-1`;

  return (
    <div className="min-h-screen bg-kalki-bg text-kalki-textPrimary flex flex-col font-sans selection:bg-kalki-live selection:text-kalki-bg">
      
      {/* 1. Fixed top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-kalki-bg border-b border-kalki-border h-16 flex items-center px-4 md:px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          
          {/* Left: wordmark and online-status indicator dot */}
          <div className="flex items-center gap-2">
            <Link 
              to="/dashboard" 
              className="flex flex-col focus:ring-2 focus:ring-kalki-live focus:outline-none rounded px-1"
            >
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base sm:text-lg text-kalki-textPrimary tracking-tight uppercase">Kalki</span>
                <span 
                  className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors duration-300 ${
                    isConnected ? "bg-kalki-live" : "bg-kalki-alert"
                  }`}
                  title={isConnected ? "System Online" : "System Offline"}
                />
              </div>
              <span className="text-[8px] text-kalki-textMuted uppercase font-mono tracking-widest leading-none mt-0.5">
                By Niraj, Soniya, Ravi
              </span>
            </Link>
          </div>

          {/* Center nav links (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/book" className={navLinkClass}>
              Book a Slot
            </NavLink>
            <Link
              to="/dashboard#live-status"
              className="font-display text-xs uppercase tracking-wider font-semibold text-kalki-textMuted hover:text-kalki-textPrimary transition focus:ring-2 focus:ring-kalki-live focus:outline-none rounded px-2 py-1"
            >
              Live Status
            </Link>
            <NavLink to="/developers" className={navLinkClass}>
              Developers
            </NavLink>
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          </nav>

          {/* Right-most stats pill and hamburger toggle */}
          <div className="flex items-center gap-3">
            {isSandbox && (
              <div 
                className="font-mono text-[9px] bg-kalki-reserved/10 border border-kalki-reserved text-kalki-reserved px-2 py-0.5 rounded tracking-wide font-bold animate-pulse"
                title="Running in Local Offline Sandbox Mode because Firebase Authentication failed."
              >
                SANDBOX
              </div>
            )}
            {/* Occupancy free/total indicator */}
            <div className="font-mono text-xs bg-kalki-live/10 border border-kalki-live text-kalki-live px-2.5 py-0.5 rounded tracking-wide">
              {slotsLoading ? `--/${totalSlots} slots free` : `${freeSlotsCount}/${totalSlots} slots free`}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-kalki-textMuted hover:text-kalki-textPrimary focus:ring-2 focus:ring-kalki-live focus:outline-none rounded transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Collapsible Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-kalki-bg border-b border-kalki-border flex flex-col p-4 space-y-3 md:hidden animate-in slide-in-from-top-4 duration-200">
            <NavLink
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => 
                `font-display text-sm uppercase tracking-wider font-semibold p-2.5 rounded transition ${
                  isActive ? "text-kalki-live bg-kalki-panel" : "text-kalki-textMuted hover:text-kalki-textPrimary"
                } focus:ring-2 focus:ring-kalki-live focus:outline-none`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => 
                `font-display text-sm uppercase tracking-wider font-semibold p-2.5 rounded transition ${
                  isActive ? "text-kalki-live bg-kalki-panel" : "text-kalki-textMuted hover:text-kalki-textPrimary"
                } focus:ring-2 focus:ring-kalki-live focus:outline-none`
              }
            >
              Book a Slot
            </NavLink>
            <Link
              to="/dashboard#live-status"
              onClick={() => setMobileMenuOpen(false)}
              className="font-display text-sm uppercase tracking-wider font-semibold text-kalki-textMuted p-2.5 rounded hover:text-kalki-textPrimary focus:ring-2 focus:ring-kalki-live focus:outline-none"
            >
              Live Status
            </Link>
            <NavLink
              to="/developers"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => 
                `font-display text-sm uppercase tracking-wider font-semibold p-2.5 rounded transition ${
                  isActive ? "text-kalki-live bg-kalki-panel" : "text-kalki-textMuted hover:text-kalki-textPrimary"
                } focus:ring-2 focus:ring-kalki-live focus:outline-none`
              }
            >
              Developers
            </NavLink>
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => 
                `font-display text-sm uppercase tracking-wider font-semibold p-2.5 rounded transition ${
                  isActive ? "text-kalki-live bg-kalki-panel" : "text-kalki-textMuted hover:text-kalki-textPrimary"
                } focus:ring-2 focus:ring-kalki-live focus:outline-none`
              }
            >
              Admin
            </NavLink>
          </div>
        )}
      </header>

      {/* Main Container spacing offset for fixed header */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-24 pb-12 flex flex-col justify-start">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard liveData={liveData} isConnected={isConnected} />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/developers" element={<Team />} />
          <Route path="/admin" element={<AdminPanel liveData={liveData} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* 5. Minimal footer */}
      <footer className="w-full bg-kalki-bg border-t border-kalki-border py-6 px-6 text-center text-xs text-kalki-textMuted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <Database className="w-4 h-4 text-kalki-textMuted" />
            <span>Built on Firebase Realtime Database</span>
          </div>
          <p className="font-sans">© 2026 Kalki Smart Parking Console.</p>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <Router basename="/Smart_parking_system">
      <AppContent />
    </Router>
  );
}
