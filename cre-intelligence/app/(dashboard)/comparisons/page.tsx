"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, ArrowUpDown } from "lucide-react";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { KPICardSkeleton } from "@/components/ui/LoadingSkeleton";
import { BarChart } from "@/components/charts/BarChart";
import { InsightCard } from "@/components/ui/InsightCard";
import { MARKET_TIERS, TIER_COLOR_MAP } from "@/lib/constants";
import { fetchFredLatestBatched, getAllMarkets } from "@/lib/api";
import { exportCsv } from "@/lib/utils";
import { Download } from "lucide-react";

interface MarketRow {
  market: string;
  tier: string;
  color: string;
  unemp: number | null;
}

type SortField = "market" | "unemp" | "tier";

export default function ComparisonsPage() {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("unemp");
  const [sortAsc, setSortAsc] = useState(true);
  const [tierFilter, setTierFilter] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const allMarkets = getAllMarkets(MARKET_TIERS as any);
      const unempMap = await fetchFredLatestBatched(
        allMarkets.map((m) => ({ key: m.name, seriesId: m.fredUnemp }))
      );
      const withUnemp: MarketRow[] = allMarkets.map((m) => ({
        market: m.name,
        tier: m.tier,
        color: m.color,
        unemp: unempMap[m.name] ?? null,
      }));
      setRows(withUnemp);
      setLoading(false);
    }
    load();
  }, []);

  const tierColorMap = TIER_COLOR_MAP;

  const filtered = tierFilter ? rows.filter((r) => r.tier === tierFilter) : rows;
  const sorted = [...filtered].sort((a, b) => {
    if (sortField === "unemp") {
      const av = a.unemp ?? 99;
      const bv = b.unemp ?? 99;
      return sortAsc ? av - bv : bv - av;
    }
    if (sortField === "market") return sortAsc ? a.market.localeCompare(b.market) : b.market.localeCompare(a.market);
    if (sortField === "tier") return sortAsc ? a.tier.localeCompare(b.tier) : b.tier.localeCompare(a.tier);
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((prev) => !prev);
    else { setSortField(field); setSortAsc(true); }
  };

  const chartData = sorted
    .filter((r) => r.unemp != null)
    .slice(0, 20)
    .map((r) => ({ Market: r.market, Unemployment: r.unemp!, Tier: r.tier }));

  const insights = [
    "Comparing unemployment across tiers reveals that Tier 2 markets have closed the gap vs. Gateway over 5 years.",
    "Markets with unemployment below 3.5% typically see strongest rent growth and absorption.",
    "Use this comparison table to quickly benchmark a target market against its peer group.",
    "Export the table to CSV to combine with your own deal underwriting models.",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Market Comparisons
          </h1>
          <GlowBadge label={`${rows.length} Markets`} variant="triangle" />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Side-by-side comparison of unemployment across all tracked CRE markets.
        </p>
      </div>

      {/* Tier filter + export */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        {[null, "Gateway", "Tier 1", "Tier 2 / Emerging"].map((tier) => (
          <button
            key={tier ?? "all"}
            onClick={() => setTierFilter(tier)}
            className="btn-neon"
            style={{ opacity: tierFilter === tier ? 1 : 0.5, borderColor: tier ? tierColorMap[tier] + "60" : undefined, color: tier ? tierColorMap[tier] : undefined }}
          >
            {tier ?? "All"}
          </button>
        ))}
        <button
          onClick={() => exportCsv(sorted.map((r) => ({ Market: r.market, Tier: r.tier, Unemployment: r.unemp ?? "N/A" })), "market_comparisons.csv")}
          className="btn-neon btn-green"
          style={{ marginLeft: "auto" }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <BarChart
            data={chartData}
            xKey="Unemployment"
            yKey="Market"
            title="Unemployment Rate — Top 20 Markets (%)"
            orientation="horizontal"
            colorKey="Tier"
            colorMap={tierColorMap}
            height={Math.max(400, chartData.length * 28)}
            yAxisWidth={160}
            showLabels
            exportFilename="market_unemployment.csv"
          />
        </div>
      )}

      {/* Table */}
      <div className="glass" style={{ overflow: "hidden", marginBottom: 28 }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            padding: "12px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-dim)",
          }}
        >
          {(["market", "tier", "unemp"] as SortField[]).map((field) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: sortField === field ? "#00f5ff" : "var(--color-text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "0.7rem",
                fontWeight: 700,
              }}
            >
              {field === "unemp" ? "Unemployment" : field.charAt(0).toUpperCase() + field.slice(1)}
              <ArrowUpDown size={10} />
            </button>
          ))}
        </div>

        {/* Table rows */}
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "12px 18px", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="skeleton" style={{ height: 14 }} />
                  <div className="skeleton" style={{ height: 14, width: "60%" }} />
                  <div className="skeleton" style={{ height: 14, width: "40%" }} />
                </div>
              ))
            : sorted.map((row, i) => (
                <motion.div
                  key={row.market}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    padding: "11px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,245,255,0.025)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: "0.82rem", color: "var(--color-text)", fontWeight: row.market.includes("Raleigh") ? 600 : 400 }}>
                    {row.market.includes("Raleigh") ? "⭐ " : ""}{row.market}
                  </span>
                  <span className={`badge ${row.tier === "Gateway" ? "badge-gateway" : row.tier === "Tier 1" ? "badge-tier1" : "badge-tier2"}`}>
                    {row.tier}
                  </span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: row.unemp != null ? row.color : "var(--color-text-dim)" }}>
                    {row.unemp != null ? `${row.unemp.toFixed(1)}%` : "—"}
                  </span>
                </motion.div>
              ))
          }
        </div>
      </div>

      <InsightCard bullets={insights} />
    </motion.div>
  );
}
