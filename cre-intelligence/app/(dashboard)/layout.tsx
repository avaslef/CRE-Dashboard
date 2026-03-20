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

  // Close sidebar by default on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile]);

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--color-bg)", position: "relative" }}>
      <ParticleBackground />

      {/* Ambient orbs */}
      <div aria-hidden style={{ position: "fixed", top: "-20%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div aria-hidden style={{ position: "fixed", bottom: "-20%", left: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(0,255,157,0.03) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div aria-hidden className="dot-grid" style={{ position: "fixed", inset: 0, opacity: 0.5, pointerEvents: "none", zIndex: 0 }} />

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      {/*
        MOBILE: sidebar is position:fixed, slides in/out via translateX.
                isOpen is forced true so it always shows full labels.
        DESKTOP: sidebar is inline in the flex row, collapses to icon-only.
      */}
      {isMobile ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100%",
            zIndex: 20,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s cubic-bezier(0.25,0.1,0.25,1)",
          }}
        >
          <Sidebar
            isOpen={true}
            onToggle={() => setSidebarOpen(false)}
            onNavClick={() => setSidebarOpen(false)}
          />
        </div>
      ) : (
        <div style={{ position: "relative", zIndex: 10, flexShrink: 0 }}>
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      )}

      {/* Main content — always full width on mobile since sidebar is fixed */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1, minWidth: 0 }}>
        <Navbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "clamp(12px, 3vw, 28px)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
