"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, RefreshCw, Sun, Moon, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";

interface NavbarProps {
  onSidebarToggle: () => void;
}

function useLastUpdated() {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    // Actually refresh the page data via Next.js router
    router.refresh();
    // Small delay for visual feedback
    await new Promise((r) => setTimeout(r, 800));
    setLastUpdated(
      new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    );
    setIsRefreshing(false);

    // Confetti burst!
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: 0.85, y: 0.05 },
      colors: ["#00f5ff", "#00ff9d", "#a855f7", "#ffffff"],
      ticks: 80,
      gravity: 1.2,
    });
  }, [router]);

  return { lastUpdated, isRefreshing, refresh };
}

export function Navbar({ onSidebarToggle }: NavbarProps) {
  const { lastUpdated, isRefreshing, refresh } = useLastUpdated();
  const [darkMode, setDarkMode] = useState(true);

  // Apply dark/light theme class to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <header
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(5,5,10,0.6)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,245,255,0.07)",
        position: "relative",
        zIndex: 5,
        flexShrink: 0,
      }}
    >
      {/* Left: hamburger + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={onSidebarToggle}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: 6,
            borderRadius: 8,
            color: "var(--color-text-muted)",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00f5ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
        >
          <Menu size={20} />
        </button>

        <div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#00f5ff",
              textShadow: "0 0 20px rgba(0,245,255,0.5)",
            }}
          >
            CRE
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              color: "var(--color-text)",
              marginLeft: 6,
            }}
          >
            Intelligence
          </span>
        </div>
      </div>

      {/* Center: live status — hidden on mobile */}
      <div
        className="hide-mobile"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.73rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#00ff9d",
            boxShadow: "0 0 8px #00ff9d",
            display: "inline-block",
            animation: "border-pulse-green 2s ease-in-out infinite",
          }}
        />
        Live Data
        <span style={{ color: "var(--color-text-dim)", margin: "0 4px" }}>·</span>
        Updated {lastUpdated}
      </div>

      {/* Right: controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Dark/Light toggle — hidden on mobile */}
        <motion.button
          className="hide-mobile"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "7px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "var(--color-text-muted)",
            transition: "all 0.2s",
          }}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          <AnimatePresence mode="wait">
            {darkMode ? (
              <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Moon size={15} />
              </motion.div>
            ) : (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sun size={15} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* GitHub link */}
        <motion.a
          whileHover={{ scale: 1.05 }}
          href="https://github.com/alexvaslef/cre-dashboard"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "7px 10px",
            display: "flex",
            alignItems: "center",
            color: "var(--color-text-muted)",
            textDecoration: "none",
          }}
          title="View source"
        >
          <ExternalLink size={15} />
        </motion.a>

        {/* Refresh Data button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={refresh}
          disabled={isRefreshing}
          className="btn-neon"
          style={{ fontSize: "0.78rem", padding: "7px 16px" }}
        >
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.8, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
          >
            <RefreshCw size={14} />
          </motion.div>
          {isRefreshing ? "Refreshing…" : "Refresh Data"}
        </motion.button>
      </div>
    </header>
  );
}
