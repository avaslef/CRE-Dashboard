"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, TrendingDown } from "lucide-react";
import { NumericKPICard } from "@/components/ui/KPICard";
import { KPICardSkeleton, ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { InsightCard } from "@/components/ui/InsightCard";
import { LineChart, fredToChartData } from "@/components/charts/LineChart";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { NATIONAL_SERIES } from "@/lib/constants";
import { fetchFredLatest, fetchFredMulti } from "@/lib/api";
import type { FredObservation } from "@/types";


export default function HousingPage() {
  const [kpis, setKpis] = useState({ mortgage: null as number | null, housingStarts: null as number | null, permits: null as number | null });
  const [housingData, setHousingData] = useState<Record<string, FredObservation[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [mortgage, housingStarts, permits, housing] = await Promise.all([
        fetchFredLatest(NATIONAL_SERIES.mortgage30yr),
        fetchFredLatest(NATIONAL_SERIES.housingStarts),
        fetchFredLatest(NATIONAL_SERIES.permitIndex),
        fetchFredMulti({
          "Housing Starts":   NATIONAL_SERIES.housingStarts,
          "Building Permits": NATIONAL_SERIES.permitIndex,
          "30-Yr Mortgage":   NATIONAL_SERIES.mortgage30yr,
        }),
      ]);
      setKpis({ mortgage, housingStarts, permits });
      setHousingData(housing);
      setLoading(false);
    }
    load();
  }, []);

  const housingChart = fredToChartData(housingData);

  const insights = [
    "Mortgage rates above 6.5% have suppressed for-sale inventory, indirectly boosting multifamily demand.",
    "Housing starts in the Southeast remain elevated due to population migration from gateway markets.",
    "Raleigh-Durham consistently leads Sun Belt metros in new permit issuance per capita.",
    "Build-to-rent (BTR) communities are a fast-growing CRE niche, especially in NC's high-growth suburbs.",
    "Zillow ZHVI and ZORI data provide free market-level price/rent benchmarks for underwriting.",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: 6 }}>
          Housing &amp; Rents
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Residential housing supply, mortgage rates, and rent trends — indicators for multifamily CRE.
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <NumericKPICard title="30-Yr Mortgage Rate" value={kpis.mortgage} suffix="%" subtitle="National average" icon={<Home size={16} />} color="red" />
            <NumericKPICard title="Housing Starts" value={kpis.housingStarts} suffix="K" decimals={0} subtitle="Thousands of units (SAAR)" color="cyan" />
            <NumericKPICard title="Building Permits" value={kpis.permits} suffix="K" decimals={0} subtitle="New private housing units" color="green" />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Charts */}
      <div className="chart-grid">
        {loading ? (
          <><ChartSkeleton /><ChartSkeleton /></>
        ) : (
          <>
            <LineChart
              data={housingChart}
              series={[
                { key: "Housing Starts",   label: "Housing Starts (K)",   color: "#00f5ff" },
                { key: "Building Permits", label: "Building Permits (K)", color: "#00ff9d" },
              ]}
              title="Housing Starts & Permits"
              referenceLines={[{ x: "2020-03-01", label: "COVID", color: "rgba(239,68,68,0.5)" }]}
              exportFilename="housing_supply.csv"
            />
            <LineChart
              data={housingChart}
              series={[
                { key: "30-Yr Mortgage", label: "30-Yr Mortgage Rate (%)", color: "#ef4444" },
              ]}
              title="30-Year Mortgage Rate (%)"
              referenceLines={[{ x: "2022-03-01", label: "Rate Hikes", color: "rgba(245,158,11,0.5)" }]}
              exportFilename="mortgage_rates.csv"
            />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* CSHI — Can't Sell House Index */}
      <div style={{ marginBottom: 28 }}>
        <div className="glass" style={{ padding: 24, borderColor: "rgba(239,68,68,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <TrendingDown size={20} color="#ef4444" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
              The "Can't Sell House" Index (CSHI)
            </h3>
            <GlowBadge label="Google Trends Composite" variant="triangle" />
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: 20 }}>
            A composite index aggregating Google Trends search interest across 12 seller-distress and housing-stress signals.
            Higher scores indicate elevated seller anxiety; lower scores reflect healthy transaction velocity.
            Live CSHI scoring requires direct Trends API access (pytrends) — use the links below to monitor individual signals.
          </p>

          {/* Score display */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ padding: "14px 24px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, textAlign: "center", minWidth: 120 }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 6 }}>CSHI Score</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, color: "#fca5a5", lineHeight: 1 }}>N/A</p>
              <p style={{ fontSize: "0.65rem", color: "var(--color-text-dim)", marginTop: 6 }}>Requires Trends API</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "< 35",   desc: "Strong seller's market",        color: "#00ff9d" },
                { label: "35–50",  desc: "Healthy / stable",              color: "#00ff9d" },
                { label: "50–65",  desc: "Softening, some stress",        color: "#fcd34d" },
                { label: "> 65",   desc: "Elevated distress / buyer's market", color: "#ef4444" },
              ].map(({ label, desc, color }) => (
                <div key={label} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${color}25`, borderRadius: 8 }}>
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, color, fontFamily: "var(--font-display)" }}>{label}</p>
                  <p style={{ fontSize: "0.67rem", color: "var(--color-text-muted)", marginTop: 2 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 12-term signal table */}
          <div style={{ borderTop: "1px solid rgba(239,68,68,0.1)", paddingTop: 16 }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-dim)", marginBottom: 12 }}>
              Aggregated Search Signals (12 terms)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              {[
                { kw: "can't sell house",       desc: "Unsold inventory — direct seller distress proxy" },
                { kw: "house won't sell",        desc: "Failed listing attempts, buyer hesitation" },
                { kw: "price reduction home",    desc: "Forced price cuts, softening demand" },
                { kw: "how long to sell house",  desc: "Lengthening days-on-market signal" },
                { kw: "home price drop",         desc: "Buyer expectations shifting lower" },
                { kw: "housing market crash",    desc: "Macro fear / recession anxiety in housing" },
                { kw: "mortgage not approved",   desc: "Credit tightening, failed buyer qualification" },
                { kw: "cancel home purchase",    desc: "Falling through under contract — buyer cold feet" },
                { kw: "underwater mortgage",     desc: "Negative equity stress signal" },
                { kw: "seller concession",       desc: "Sellers offering credits — demand weakness" },
                { kw: "housing bubble",          desc: "Speculative fear index" },
                { kw: "extend listing days",     desc: "Stale inventory, reduced showing velocity" },
              ].map(({ kw, desc }) => (
                <div key={kw} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text)" }}>"{kw}"</p>
                    <p style={{ fontSize: "0.67rem", color: "var(--color-text-muted)", marginTop: 2 }}>{desc}</p>
                  </div>
                  <a
                    href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(kw)}&geo=US`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "0.65rem", color: "var(--color-text-dim)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    Trends ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Zillow data note */}
      <div className="glass insight-card" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: "1.1rem" }}>🏠</span>
          <strong style={{ fontSize: "0.85rem", color: "var(--color-text)" }}>Zillow Research Data</strong>
          <span className="badge badge-triangle">Free CSVs</span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          Zillow publishes free metro-level ZHVI (Home Value Index) and ZORI (Observed Rent Index) CSV datasets.
          These provide monthly time series for all U.S. metros — ideal for Triangle NC rent underwriting.
        </p>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="https://www.zillow.com/research/data/" target="_blank" rel="noopener noreferrer" className="btn-neon" style={{ fontSize: "0.74rem", padding: "5px 12px" }}>
            Zillow Research Data →
          </a>
        </div>
      </div>

      <InsightCard bullets={insights} />
    </motion.div>
  );
}
