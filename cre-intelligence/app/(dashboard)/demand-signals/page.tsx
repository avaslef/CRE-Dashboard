"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Activity } from "lucide-react";
import { NumericKPICard } from "@/components/ui/KPICard";
import { KPICardSkeleton, ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { InsightCard } from "@/components/ui/InsightCard";
import { LineChart, fredToChartData } from "@/components/charts/LineChart";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { NATIONAL_SERIES } from "@/lib/constants";
import { fetchFredLatest, fetchFredMulti } from "@/lib/api";
import type { FredObservation } from "@/types";

function LazyTrendsIframe({ kw, label, desc }: { kw: string; label: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="glass" style={{ overflow: "hidden", padding: 0 }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>{label}</p>
          <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: 2 }}>{desc}</p>
        </div>
        <a href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(label.replace(/\+/g, " "))}&geo=US`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", textDecoration: "none" }}>
          Open in Trends ↗
        </a>
      </div>
      {visible ? (
        <iframe
          title={`Google Trends — ${label}`}
          src={`https://trends.google.com/trends/embed/explore/TIMESERIES?req=%7B%22comparisonItem%22%3A%5B%7B%22keyword%22%3A%22${kw}%22%2C%22geo%22%3A%22US%22%2C%22time%22%3A%22today%205-y%22%7D%5D%2C%22category%22%3A0%2C%22property%22%3A%22%22%7D&tz=-300&lang=en`}
          width="100%"
          height="400"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          style={{ border: "none", display: "block" }}
        />
      ) : (
        <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-dim)", fontSize: "0.8rem" }}>
          Loading trends data...
        </div>
      )}
    </div>
  );
}

export default function DemandSignalsPage() {
  const [kpis, setKpis] = useState({ retailSales: null as number | null, natUnemp: null as number | null, gdpGrowth: null as number | null });
  const [demandData, setDemandData] = useState<Record<string, FredObservation[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [retailSales, natUnemp, gdpGrowth, demand] = await Promise.all([
        fetchFredLatest(NATIONAL_SERIES.retailSales),
        fetchFredLatest(NATIONAL_SERIES.nationalUnemp),
        fetchFredLatest(NATIONAL_SERIES.gdpGrowth),
        fetchFredMulti({
          "Retail Sales ($M)": NATIONAL_SERIES.retailSales,
          "Unemployment (%)":  NATIONAL_SERIES.nationalUnemp,
        }),
      ]);
      setKpis({ retailSales, natUnemp, gdpGrowth });
      setDemandData(demand);
      setLoading(false);
    }
    load();
  }, []);

  const demandChart = fredToChartData(demandData);

  // Google Trends keywords for CRE
  const googleTrendsKeywords = [
    "commercial real estate",
    "industrial warehouse",
    "office for lease",
    "Raleigh real estate",
    "Triangle NC",
  ];

  const insights = [
    "Retail sales momentum is a leading indicator for retail CRE demand and tenant health.",
    "Declining unemployment below 4% typically triggers multifamily and industrial absorption upticks.",
    "Google Trends 'office for lease' declining nationally while 'industrial warehouse' surges.",
    "Remote work trends have permanently shifted office demand — track Google Trends for real-time sentiment.",
    "Retail foot traffic data (from Placer.ai, SafeGraph) supplements FRED data for retail CRE due diligence.",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Demand Signals
          </h1>
          <GlowBadge label="Leading Indicators" variant="growth" />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Economic demand signals that drive CRE occupancy and rent growth.
        </p>
      </div>

      <div className="kpi-grid-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <NumericKPICard title="Retail Sales" value={kpis.retailSales} prefix="$" suffix="M" decimals={0} subtitle="Advance retail & food services" icon={<Activity size={16} />} color="green" />
            <NumericKPICard title="National Unemployment" value={kpis.natUnemp} suffix="%" subtitle="Employment health signal" color="cyan" />
            <NumericKPICard title="GDP Growth" value={kpis.gdpGrowth} suffix="%" subtitle="Real GDP quarterly" icon={<TrendingUp size={16} />} color="purple" />
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
              data={demandChart}
              series={[
                { key: "Retail Sales ($M)", label: "Retail Sales ($M)", color: "#00ff9d" },
              ]}
              title="Advance Retail Sales"
              exportFilename="retail_sales.csv"
            />
            <LineChart
              data={demandChart}
              series={[
                { key: "Unemployment (%)", label: "Unemployment Rate", color: "#00f5ff" },
              ]}
              title="National Unemployment Rate (%)"
              exportFilename="unemployment.csv"
            />
          </>
        )}
      </div>

      {/* Google Trends placeholder */}
      <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Search size={18} color="#00f5ff" />
          <h3 style={{ fontSize: "1rem", fontWeight: 600, fontFamily: "var(--font-heading)" }}>
            Google Trends — CRE Search Interest
          </h3>
          <GlowBadge label="No API Key Required" variant="growth" />
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
          Monitor search interest for CRE keywords via Google Trends (no API key needed via pytrends).
          In the Python Streamlit app, this data is fetched live. In this Next.js version, use the
          Google Trends embed or the <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4, fontSize: "0.75rem" }}>pytrends</code> Python library in an API route.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {googleTrendsKeywords.map((kw) => (
            <a
              key={kw}
              href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(kw)}&geo=US`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon"
              style={{ fontSize: "0.74rem", padding: "5px 12px" }}
            >
              {kw} →
            </a>
          ))}
        </div>

        {/* Embedded Google Trends iframes — lazy-loaded via IntersectionObserver */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { kw: "commercial+real+estate", label: "commercial real estate", desc: "Broad CRE market sentiment" },
            { kw: "industrial+warehouse", label: "industrial warehouse", desc: "Industrial & logistics demand signal" },
            { kw: "office+for+lease", label: "office for lease", desc: "Office leasing demand trend" },
            { kw: "Raleigh+real+estate", label: "Raleigh real estate", desc: "Triangle NC market interest" },
          ].map(({ kw, label, desc }) => (
            <LazyTrendsIframe key={kw} kw={kw} label={label} desc={desc} />
          ))}
        </div>
      </div>

      <InsightCard bullets={insights} />
    </motion.div>
  );
}
