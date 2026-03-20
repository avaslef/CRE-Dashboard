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
        {/* Header card */}
        <div className="glass" style={{ padding: 24, marginBottom: 16, borderColor: "rgba(239,68,68,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <TrendingDown size={20} color="#ef4444" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
              The "Can't Sell House" Index (CSHI)
            </h3>
            <GlowBadge label="Google Trends" variant="triangle" />
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: 16 }}>
            A leading indicator of housing market stress — aggregates Google Trends search interest for four seller-distress signals.
            Search behavior typically <strong style={{ color: "var(--color-text)" }}>leads formal housing data by 4–8 weeks</strong>.
          </p>

          {/* Legend row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { label: "CSHI < 35", desc: "Strong seller's market", color: "#00ff9d" },
              { label: "35 – 50",   desc: "Healthy / mild seller confidence", color: "#00ff9d" },
              { label: "50 – 65",   desc: "Softening demand, some stress", color: "#fcd34d" },
              { label: "> 65",      desc: "Elevated distress, buyer's market", color: "#ef4444" },
            ].map(({ label, desc, color }) => (
              <div key={label} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30`, borderRadius: 8, flex: "1 1 160px" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color, fontFamily: "var(--font-display)" }}>{label}</p>
                <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 2 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* One card per search signal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { kw: "can%27t+sell+house",    label: "\"Can't Sell House\"",       desc: "Homeowners stuck with unsold inventory — a direct proxy for illiquid seller conditions." },
            { kw: "house+won%27t+sell",    label: "\"House Won't Sell\"",        desc: "Signals failed listing attempts and buyer hesitation in the market." },
            { kw: "price+reduction+home",  label: "\"Price Reduction Home\"",    desc: "Searches spike when sellers are forced to cut asking prices — confirms softening demand." },
            { kw: "how+long+to+sell+house",label: "\"How Long to Sell House\"",  desc: "Rising interest signals lengthening days-on-market and reduced transaction velocity." },
          ].map(({ kw, label, desc }) => (
            <div key={kw} className="glass" style={{ overflow: "hidden", padding: 0, borderColor: "rgba(239,68,68,0.15)" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(239,68,68,0.1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{label}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 560 }}>{desc}</p>
                </div>
                <a
                  href={`https://trends.google.com/trends/explore?q=${kw.replace(/%27/g, "'").replace(/\+/g, " ")}&geo=US`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", textDecoration: "none", whiteSpace: "nowrap", alignSelf: "center" }}
                >
                  Open in Trends ↗
                </a>
              </div>
              <iframe
                title={`CSHI — ${label}`}
                src={`https://trends.google.com/trends/embed/explore/TIMESERIES?req=%7B%22comparisonItem%22%3A%5B%7B%22keyword%22%3A%22${kw}%22%2C%22geo%22%3A%22US%22%2C%22time%22%3A%22today%205-y%22%7D%5D%2C%22category%22%3A0%2C%22property%22%3A%22%22%7D&tz=-300&lang=en`}
                width="100%"
                height="380"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="no-referrer"
                style={{ border: "none", display: "block" }}
              />
            </div>
          ))}
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
