"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ParticleBackground } from "@/components/layout/ParticleBackground";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-collapse on mobile on first render
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile]);

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--color-bg)", position: "relative" }}>
      {/* Ambient background */}
      <ParticleBackground />

      {/* Cosmic gradient orbs */}
      <div aria-hidden style={{ position: "fixed", top: "-20%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div aria-hidden style={{ position: "fixed", bottom: "-20%", left: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(0,255,157,0.03) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Dot grid overlay */}
      <div aria-hidden className="dot-grid" style={{ position: "fixed", inset: 0, opacity: 0.5, pointerEvents: "none", zIndex: 0 }} />

      {/* Mobile backdrop — closes sidebar when tapping outside */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — overlay on mobile, inline on desktop */}
      <div style={isMobile ? { position: "fixed", top: 0, left: 0, height: "100%", zIndex: 10 } : { position: "relative", zIndex: 10, flexShrink: 0 }}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} onNavClick={() => { if (isMobile) setSidebarOpen(false); }} />
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1, minWidth: 0 }}>
        {/* Top navbar */}
        <Navbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable page content */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "clamp(12px, 3vw, 28px) clamp(12px, 3vw, 28px)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
