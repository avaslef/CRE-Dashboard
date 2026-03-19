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

const ZILLOW_METROS = ["Raleigh", "Charlotte", "Nashville", "Austin", "Atlanta", "New York", "Los Angeles"];

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
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
      <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <TrendingDown size={18} color="#ef4444" />
          <h3 style={{ fontSize: "1rem", fontWeight: 600, fontFamily: "var(--font-heading)" }}>
            The "Can't Sell House" Index (CSHI)
          </h3>
          <GlowBadge label="Google Trends" variant="triangle" />
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 4, lineHeight: 1.6 }}>
          A tongue-in-cheek — but surprisingly useful — leading indicator of housing market stress. Aggregates
          Google Trends search interest for four distress signals: <em>"can't sell house"</em>, <em>"house won't sell"</em>,{" "}
          <em>"price reduction home"</em>, and <em>"how long to sell house"</em>.
        </p>
        <p style={{ fontSize: "0.77rem", color: "var(--color-text-dim)", marginBottom: 16, lineHeight: 1.6 }}>
          <strong style={{ color: "var(--color-text-muted)" }}>Formula:</strong>{" "}
          CSHI(t) = (raw_avg(t) / period_mean) × 50 — centered at 50. Readings above 65 signal elevated seller stress;
          below 35 indicates a strong seller's market.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { kw: "can%27t+sell+house",       label: `"can't sell house"` },
            { kw: "house+won%27t+sell",        label: `"house won't sell"` },
            { kw: "price+reduction+home",      label: `"price reduction home"` },
            { kw: "how+long+to+sell+house",    label: `"how long to sell house"` },
          ].map(({ kw, label }) => (
            <div key={kw} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p style={{ fontSize: "0.68rem", color: "var(--color-text-dim)", padding: "5px 10px", background: "rgba(239,68,68,0.04)" }}>
                {label}
              </p>
              <iframe
                title={`CSHI — ${label}`}
                src={`https://trends.google.com/trends/embed/explore/TIMESERIES?req=%7B%22comparisonItem%22%3A%5B%7B%22keyword%22%3A%22${kw}%22%2C%22geo%22%3A%22US%22%2C%22time%22%3A%22today%205-y%22%7D%5D%2C%22category%22%3A0%2C%22property%22%3A%22%22%7D&tz=-300&lang=en`}
                width="100%"
                height="280"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="no-referrer"
                style={{ border: "none", display: "block" }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.05)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.1)" }}>
          <p style={{ fontSize: "0.73rem", color: "var(--color-text-muted)", lineHeight: 1.7 }}>
            <strong>Reading the index:</strong>{" "}
            <span style={{ color: "#00ff9d" }}>CSHI &lt; 35</span> — Strong seller's market.{" "}
            <span style={{ color: "#00ff9d" }}>35–50</span> — Healthy, mild seller confidence.{" "}
            <span style={{ color: "#fcd34d" }}>50–65</span> — Some seller stress, softening demand.{" "}
            <span style={{ color: "#ef4444" }}>&gt; 65</span> — Elevated distress, buyer's market, price cuts likely.
            Search behavior typically leads formal housing data by 4–8 weeks.
          </p>
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
