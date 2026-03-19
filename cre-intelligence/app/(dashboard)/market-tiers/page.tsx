"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { KPICardSkeleton } from "@/components/ui/LoadingSkeleton";
import { InsightCard } from "@/components/ui/InsightCard";
import { BarChart } from "@/components/charts/BarChart";
import { MARKET_TIERS } from "@/lib/constants";
import { fetchFredLatest } from "@/lib/api";

interface MarketData {
  name: string;
  unemp: number | null;
  tier: string;
  color: string;
  highlight: boolean;
}

export default function MarketTiersPage() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const allMarkets = Object.entries(MARKET_TIERS).flatMap(([tier, data]) =>
        data.markets.map((m: (typeof data.markets)[number]) => ({ ...m, tier, color: data.color, highlight: !!m.highlight }))
      );

      const withUnemp = await Promise.all(
        allMarkets.map(async (m) => ({
          name: m.name,
          unemp: await fetchFredLatest(m.fredUnemp),
          tier: m.tier,
          color: m.color,
          highlight: m.highlight,
        }))
      );
      setMarkets(withUnemp);
      setLoading(false);
    }
    load();
  }, []);

  const filteredMarkets = selectedTier
    ? markets.filter((m) => m.tier === selectedTier)
    : markets;

  const TIER_ORDER: Record<string, number> = { Gateway: 0, "Tier 1": 1, "Tier 2 / Emerging": 2 };

  const chartData = filteredMarkets
    .filter((m) => m.unemp != null)
    .sort((a, b) => {
      const tierDiff = (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9);
      if (tierDiff !== 0) return tierDiff;
      return a.name.localeCompare(b.name);
    })
    .map((m) => ({ Market: m.name, Unemployment: m.unemp ?? 0, Tier: m.tier }));

  const tierColorMap: Record<string, string> = {
    "Gateway":           "#ef4444",
    "Tier 1":            "#f59e0b",
    "Tier 2 / Emerging": "#00ff9d",
  };

  const insights = [
    "Gateway markets carry the lowest unemployment but face deeper structural headwinds in office demand.",
    "Tier 1 Sun Belt markets (Dallas, Miami, Phoenix) continue to attract corporate relocations.",
    "Tier 2/Emerging markets like Raleigh-Durham show the strongest relative job growth trajectories.",
    "Lower unemployment in a market correlates with higher multifamily demand and rent growth.",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Market Tiers
          </h1>
          <GlowBadge label={`${markets.length} Markets`} variant="triangle" />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Unemployment rates across Gateway, Tier 1, and Tier 2/Emerging CRE markets.
        </p>
      </div>

      {/* Tier filter buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[null, "Gateway", "Tier 1", "Tier 2 / Emerging"].map((tier) => (
          <button
            key={tier ?? "all"}
            onClick={() => setSelectedTier(tier)}
            className={tier === null
              ? (selectedTier === null ? "btn-neon" : "btn-neon")
              : "btn-neon"
            }
            style={{
              opacity: selectedTier === tier || (tier === null && selectedTier === null) ? 1 : 0.5,
              borderColor: tier ? tierColorMap[tier] + "60" : undefined,
              color: tier ? tierColorMap[tier] : undefined,
            }}
          >
            {tier ?? "All Markets"}
          </button>
        ))}
      </div>

      {/* Chart */}
      {!loading && chartData.length > 0 ? (
        <div style={{ marginBottom: 28 }}>
          <BarChart
            data={chartData}
            xKey="Unemployment"
            yKey="Market"
            title="Unemployment Rate by Market (%)"
            orientation="horizontal"
            colorKey="Tier"
            colorMap={tierColorMap}
            height={Math.max(400, chartData.length * 28)}
            yAxisWidth={160}
            showLabels
            exportFilename="market_unemployment.csv"
          />
        </div>
      ) : loading ? (
        <KPICardSkeleton />
      ) : null}

      <div className="neon-divider" />

      {/* Card grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 28 }}>
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <KPICardSkeleton key={i} />)
          : filteredMarkets.map((market, i) => (
              <motion.div
                key={market.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="glass"
                style={{
                  padding: "16px",
                  borderColor: `${market.color}30`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {market.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  >
                    <GlowBadge label="⭐ Focus" variant="triangle" />
                  </div>
                )}

                <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4 }}>
                  {market.name}
                </p>

                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: market.unemp != null ? market.color : "var(--color-text-dim)",
                    marginBottom: 4,
                  }}
                >
                  {market.unemp != null ? `${market.unemp.toFixed(1)}%` : "—"}
                </p>

                <span
                  className={`badge ${
                    market.tier === "Gateway" ? "badge-gateway" :
                    market.tier === "Tier 1"  ? "badge-tier1"   : "badge-tier2"
                  }`}
                >
                  {market.tier}
                </span>
              </motion.div>
            ))}
      </div>

      <InsightCard bullets={insights} />
    </motion.div>
  );
}
