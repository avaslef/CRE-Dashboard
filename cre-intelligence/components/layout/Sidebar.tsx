"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Layers, TrendingUp, MapPin,
  Building2, Home, Newspaper, Briefcase, Gavel,
  Search, Map, BarChart2, ChevronLeft, ChevronRight,
  Zap,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Market Analysis",
    items: [
      { label: "Overview",      href: "/overview",       icon: LayoutDashboard },
      { label: "Market Tiers",  href: "/market-tiers",   icon: Layers },
      { label: "Macro Trends",  href: "/macro-trends",   icon: TrendingUp },
      { label: "Triangle NC",   href: "/triangle-nc",    icon: MapPin },
    ],
  },
  {
    label: "Capital & Housing",
    items: [
      { label: "Capital Markets", href: "/capital-markets", icon: Building2 },
      { label: "Housing & Rents", href: "/housing",          icon: Home },
    ],
  },
  {
    label: "Research & News",
    items: [
      { label: "Deal Flow & News",      href: "/deal-flow",   icon: Newspaper },
      { label: "Brokerage Research",    href: "/research",    icon: Briefcase },
      { label: "Business & Legislation",href: "/legislation", icon: Gavel },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Demand Signals",    href: "/demand-signals", icon: Search },
      { label: "Interactive Map",   href: "/map",             icon: Map },
      { label: "Market Comparisons",href: "/comparisons",    icon: BarChart2 },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: isOpen ? 240 : 60 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
        background: "rgba(5,5,10,0.8)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(0,245,255,0.08)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Logo area */}
      <div
        style={{
          padding: "18px 14px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 64,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,255,157,0.15))",
            border: "1px solid rgba(0,245,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 16px rgba(0,245,255,0.15)",
          }}
        >
          <Zap size={16} color="#00f5ff" />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden", whiteSpace: "nowrap" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#00f5ff",
                  textShadow: "0 0 16px rgba(0,245,255,0.5)",
                  lineHeight: 1.2,
                }}
              >
                CRE
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.6rem",
                  fontWeight: 400,
                  letterSpacing: "0.14em",
                  color: "rgba(0,245,255,0.55)",
                  textTransform: "uppercase",
                }}
              >
                Intelligence
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.58rem",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.28)",
                  marginTop: 3,
                  letterSpacing: "0.04em",
                }}
              >
                Alexander Vaslef
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 6px" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="sidebar-group-label"
                >
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>

            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <motion.div key={item.href} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={item.href}
                    className={`sidebar-item ${active ? "active" : ""}`}
                    title={!isOpen ? item.label : undefined}
                    style={{ justifyContent: isOpen ? "flex-start" : "center" }}
                  >
                    <Icon
                      size={18}
                      className="sidebar-icon"
                      style={{ flexShrink: 0 }}
                      color={active ? "#00f5ff" : undefined}
                    />
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.18 }}
                          style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active indicator dot when collapsed */}
                    {!isOpen && active && (
                      <span
                        style={{
                          position: "absolute",
                          right: 4,
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "#00f5ff",
                          boxShadow: "0 0 6px #00f5ff",
                        }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* API status dots */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "12px 14px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-dim)", marginBottom: 8 }}>
              Data Sources
            </div>
            {["FRED · St. Louis Fed", "U.S. Census Bureau", "NewsAPI.org", "Google Trends", "Zillow Research"].map((src) => (
              <div key={src} style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", lineHeight: "1.9", display: "flex", alignItems: "center" }}>
                <span className="api-dot on" />
                {src}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: "absolute",
          right: -12,
          top: "50%",
          transform: "translateY(-50%)",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "rgba(5,5,10,0.95)",
          border: "1px solid rgba(0,245,255,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
          boxShadow: "0 0 12px rgba(0,245,255,0.1)",
          transition: "box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,245,255,0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,245,255,0.1)";
        }}
      >
        {isOpen
          ? <ChevronLeft size={12} color="#00f5ff" />
          : <ChevronRight size={12} color="#00f5ff" />
        }
      </button>
    </motion.aside>
  );
}
