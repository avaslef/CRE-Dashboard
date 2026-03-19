"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Map } from "lucide-react";
import dynamic from "next/dynamic";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { MARKET_TIERS } from "@/lib/constants";

// SSR-disabled map
const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="skeleton" style={{ height: 520, borderRadius: 16 }} />
  ),
});

export default function MapPage() {
  const [focusTriangle, setFocusTriangle] = useState(false);

  const totalMarkets = Object.values(MARKET_TIERS).reduce((sum, t) => sum + t.markets.length, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Interactive Map
          </h1>
          <GlowBadge label={`${totalMarkets} Markets`} variant="triangle" />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Click any market pin to see tier classification, MSA details, and FRED series ID.
        </p>
      </div>

      {/* Map controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setFocusTriangle(false)}
          className="btn-neon"
          style={{ opacity: !focusTriangle ? 1 : 0.5 }}
        >
          <Map size={14} />
          National View
        </button>
        <button
          onClick={() => setFocusTriangle(true)}
          className="btn-neon btn-green"
          style={{ opacity: focusTriangle ? 1 : 0.5 }}
        >
          🔺 Triangle NC
        </button>

        {/* Legend */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "Gateway",            color: "#ef4444" },
            { label: "Tier 1",             color: "#f59e0b" },
            { label: "Tier 2 / Emerging",  color: "#00ff9d" },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, display: "inline-block" }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <InteractiveMap focusTriangle={focusTriangle} height={560} />

      {/* Market count cards below map */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 20 }}>
        {Object.entries(MARKET_TIERS).map(([tier, data]) => (
          <motion.div
            key={tier}
            whileHover={{ y: -3 }}
            className="glass"
            style={{ padding: "16px 20px", borderColor: `${data.color}30` }}
          >
            <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 6 }}>
              {tier}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: data.color, marginBottom: 4 }}>
              {data.markets.length}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              Markets tracked
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
