"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { motion } from "framer-motion";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { MARKET_TIERS } from "@/lib/constants";
import type { MarketCity } from "@/types";
import "leaflet/dist/leaflet.css";

interface MarketWithTier extends MarketCity {
  tier: string;
  tierColor: string;
  neonColor: string;
}

const TIER_COLORS = {
  Gateway:           { stroke: "#ef4444",  fill: "rgba(239,68,68,0.3)",  neon: "#ff6b6b"  },
  "Tier 1":          { stroke: "#f59e0b",  fill: "rgba(245,158,11,0.3)", neon: "#fcd34d"  },
  "Tier 2 / Emerging":{ stroke: "#00ff9d", fill: "rgba(0,255,157,0.3)",  neon: "#00ff9d"  },
} as const;

interface InteractiveMapProps {
  focusTriangle?: boolean;
  height?: number;
}

export default function InteractiveMap({ focusTriangle = false, height = 520 }: InteractiveMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const center: [number, number] = focusTriangle ? [35.85, -78.9] : [39, -96];
  const zoom = focusTriangle ? 8 : 4;

  const allMarkets: MarketWithTier[] = Object.entries(MARKET_TIERS).flatMap(([tier, data]) =>
    data.markets.map((m: (typeof data.markets)[number]) => ({
      ...m,
      tier,
      tierColor: TIER_COLORS[tier as keyof typeof TIER_COLORS].stroke,
      neonColor: TIER_COLORS[tier as keyof typeof TIER_COLORS].neon,
    }))
  );

  if (!isMounted) {
    return (
      <div
        className="skeleton"
        style={{ height, borderRadius: 16, width: "100%" }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,245,255,0.15)",
        boxShadow: "0 0 40px rgba(0,245,255,0.06)",
        height,
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Dark Stamen-style tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {allMarkets.map((market) => {
          const isTriangle = !!market.highlight;
          const radius = isTriangle ? 12 : market.tier === "Gateway" ? 9 : 7;
          const tc = TIER_COLORS[market.tier as keyof typeof TIER_COLORS];

          return (
            <CircleMarker
              key={market.name}
              center={[market.lat, market.lon]}
              radius={radius}
              pathOptions={{
                color: tc.stroke,
                fillColor: tc.fill,
                fillOpacity: isTriangle ? 0.85 : 0.6,
                weight: isTriangle ? 2.5 : 1.5,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "var(--font-body)", minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: tc.neon,
                        boxShadow: `0 0 8px ${tc.neon}`,
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text)" }}>
                      {market.name}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 8 }}>
                    {market.msa}
                  </p>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span
                      className={`badge ${
                        market.tier === "Gateway" ? "badge-gateway" :
                        market.tier === "Tier 1"  ? "badge-tier1"   : "badge-tier2"
                      }`}
                    >
                      {market.tier}
                    </span>
                    {isTriangle && (
                      <span className="badge badge-triangle">⭐ Triangle Focus</span>
                    )}
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--color-text-dim)",
                        padding: "2px 6px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 4,
                      }}
                    >
                      {market.state}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", marginTop: 8 }}>
                    FRED: {market.fredUnemp}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </motion.div>
  );
}
