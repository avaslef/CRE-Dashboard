"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { InsightCard } from "@/components/ui/InsightCard";
import { MARKET_TIERS, TIER_COLOR_MAP } from "@/lib/constants";
import { fetchFredLatest, fetchFredLatestBatched, getAllMarkets } from "@/lib/api";
import { exportCsv } from "@/lib/utils";
import { Download } from "lucide-react";
import { NATIONAL_SERIES } from "@/lib/constants";

interface MarketRow {
  market: string;
  tier: string;
  color: string;
  unemp: number | null;
}

type SortField = "market" | "unemp" | "tier";

export default function ComparisonsPage() {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [nationalUnemp, setNationalUnemp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("unemp");
  const [sortAsc, setSortAsc] = useState(true);
  const [tierFilter, setTierFilter] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const allMarkets = getAllMarkets(MARKET_TIERS as any);
      const [unempMap, natUnemp] = await Promise.all([
        fetchFredLatestBatched(
          allMarkets.map((m) => ({ key: m.name, seriesId: m.fredUnemp }))
        ),
        fetchFredLatest(NATIONAL_SERIES.nationalUnemp),
      ]);
      const withUnemp: MarketRow[] = allMarkets.map((m) => ({
        market: m.name,
        tier: m.tier,
        color: m.color,
        unemp: unempMap[m.name] ?? null,
      }));
      setRows(withUnemp);
      setNationalUnemp(natUnemp);
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

      {/* Multi-Metric Market Scorecard */}
      <div className="glass" style={{ marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>
            Multi-Metric Market Scorecard
          </span>
          {nationalUnemp != null && (
            <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
              National avg: <strong style={{ color: "#a855f7" }}>{nationalUnemp.toFixed(1)}%</strong> (UNRATE)
            </span>
          )}
        </div>

        {/* Scorecard header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1.2fr", padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-dim)", gap: 8 }}>
          <span>Market</span>
          <span>Tier</span>
          <span>Rate</span>
          <span>vs National</span>
          <span>Signal</span>
        </div>

        {/* National avg reference row */}
        {!loading && nationalUnemp != null && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1.2fr", padding: "9px 18px", borderBottom: "1px solid rgba(168,85,247,0.15)", background: "rgba(168,85,247,0.05)", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#a855f7" }}>National Average</span>
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)" }}>—</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: "#a855f7" }}>{nationalUnemp.toFixed(1)}%</span>
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)" }}>Benchmark</span>
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)" }}>UNRATE</span>
          </div>
        )}

        {/* Market rows */}
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1.2fr", padding: "10px 18px", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="skeleton" style={{ height: 14 }} />
                  <div className="skeleton" style={{ height: 14, width: "60%" }} />
                  <div className="skeleton" style={{ height: 14, width: "40%" }} />
                  <div className="skeleton" style={{ height: 14, width: "70%" }} />
                  <div className="skeleton" style={{ height: 14, width: "80%" }} />
                </div>
              ))
            : sorted.map((row, i) => {
                const delta = row.unemp != null && nationalUnemp != null ? row.unemp - nationalUnemp : null;
                const deltaColor = delta == null ? "var(--color-text-dim)"
                  : delta < -0.5 ? "#00ff9d"
                  : delta > 0.5 ? "#ef4444"
                  : "#fcd34d";
                const signal = delta == null ? "—"
                  : delta < -0.5 ? "Outperforming"
                  : delta > 0.5 ? "Underperforming"
                  : "At National";
                const barWidth = row.unemp != null ? Math.min((row.unemp / 10) * 100, 100) : 0;
                return (
                  <motion.div
                    key={row.market}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1.2fr", padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", gap: 8 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,245,255,0.025)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: "0.82rem", color: "var(--color-text)", fontWeight: row.market.includes("Raleigh") ? 600 : 400 }}>
                      {row.market.includes("Raleigh") ? "★ " : ""}{row.market}
                    </span>
                    <span className={`badge ${row.tier === "Gateway" ? "badge-gateway" : row.tier === "Tier 1" ? "badge-tier1" : "badge-tier2"}`}>
                      {row.tier === "Tier 2 / Emerging" ? "T2" : row.tier === "Tier 1" ? "T1" : "GW"}
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, color: row.unemp != null ? row.color : "var(--color-text-dim)" }}>
                          {row.unemp != null ? `${row.unemp.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                      {row.unemp != null && (
                        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginTop: 4, maxWidth: 60 }}>
                          <div style={{ height: "100%", width: `${barWidth}%`, borderRadius: 2, background: row.color, transition: "width 0.4s" }} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: deltaColor }}>
                      {delta == null ? "—" : `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}bps ${delta < 0 ? "▲" : delta > 0 ? "▼" : ""}`}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 500, color: deltaColor }}>
                      {signal}
                    </span>
                  </motion.div>
                );
              })
          }
        </div>
      </div>

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
