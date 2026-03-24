"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, TrendingDown, AlertTriangle } from "lucide-react";
import { NumericKPICard } from "@/components/ui/KPICard";
import { KPICardSkeleton, ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { InsightCard } from "@/components/ui/InsightCard";
import { LineChart, fredToChartData } from "@/components/charts/LineChart";
import { CAPITAL_SERIES } from "@/lib/constants";
import { fetchFredLatest, fetchFredMulti } from "@/lib/api";
import type { FredObservation } from "@/types";

export default function CapitalMarketsPage() {
  const [kpis, setKpis] = useState({ t10: null as number | null, t2: null as number | null, fedFunds: null as number | null, mortgage: null as number | null, hySpread: null as number | null });
  const [ratesData, setRatesData] = useState<Record<string, FredObservation[]>>({});
  const [spreadData, setSpreadData] = useState<Record<string, FredObservation[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [t10, t2, fedFunds, mortgage, hySpread, rates, spreads] = await Promise.all([
        fetchFredLatest(CAPITAL_SERIES.tenYrTreasury),
        fetchFredLatest(CAPITAL_SERIES.twoYrTreasury),
        fetchFredLatest(CAPITAL_SERIES.fedFunds),
        fetchFredLatest(CAPITAL_SERIES.mortgage30yr),
        fetchFredLatest(CAPITAL_SERIES.highYieldSpread),
        fetchFredMulti({
          "10-Yr Treasury":  CAPITAL_SERIES.tenYrTreasury,
          "2-Yr Treasury":   CAPITAL_SERIES.twoYrTreasury,
          "Fed Funds Rate":  CAPITAL_SERIES.fedFunds,
          "30-Yr Mortgage":  CAPITAL_SERIES.mortgage30yr,
        }),
        fetchFredMulti({
          "High Yield Spread": CAPITAL_SERIES.highYieldSpread,
        }),
      ]);
      setKpis({ t10, t2, fedFunds, mortgage, hySpread });
      setRatesData(rates);
      setSpreadData(spreads);
      setLoading(false);
    }
    load();
  }, []);

  const ratesChart  = fredToChartData(ratesData);
  const spreadChart = fredToChartData(spreadData);

  const yieldCurveInverted = kpis.t2 != null && kpis.t10 != null && kpis.t2 > kpis.t10;

  const insights = [
    "Rising rates have increased CRE cost of capital, compressing debt service coverage ratios across portfolios.",
    "An inverted yield curve (2yr > 10yr) signals risk-off sentiment and potential recession watch.",
    "High-yield spreads widening beyond 400bp typically indicates credit stress in leveraged CRE assets.",
    "Cap rate expansion has lagged rate hikes — the 'denominator effect' is still playing out in valuations.",
    "DSCR requirements have tightened: many lenders now require >1.35x vs. historical 1.20x.",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Capital Markets
          </h1>
          {yieldCurveInverted && (
            <span className="badge" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}>
              <AlertTriangle size={9} />
              Inverted Yield Curve
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Interest rates, credit spreads, and capital availability for CRE lending.
        </p>
      </div>

      <div className="kpi-grid-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <NumericKPICard title="10-Yr Treasury" value={kpis.t10} suffix="%" subtitle="CRE cap rate anchor" source="U.S. Treasury via FRED (DGS10)" icon={<TrendingDown size={15} />} color="cyan" />
            <NumericKPICard title="2-Yr Treasury" value={kpis.t2} suffix="%" subtitle={yieldCurveInverted ? "⚠ Inverted vs 10yr" : "Short-term rate"} source="U.S. Treasury via FRED (DGS2)" color={yieldCurveInverted ? "red" : "purple"} />
            <NumericKPICard title="Fed Funds Rate" value={kpis.fedFunds} suffix="%" subtitle="FOMC target" source="Federal Reserve via FRED (FEDFUNDS)" color="amber" />
            <NumericKPICard title="30-Yr Mortgage" value={kpis.mortgage} suffix="%" subtitle="National average" source="Freddie Mac via FRED (MORTGAGE30US)" icon={<Building2 size={15} />} color="green" />
            <NumericKPICard title="HY Credit Spread" value={kpis.hySpread} suffix="%" subtitle="High-yield vs Treasuries" source="ICE BofA via FRED (BAMLH0A0HYM2)" color="red" />
          </>
        )}
      </div>

      <div className="neon-divider" />

      <div className="chart-grid">
        {loading ? (
          <><ChartSkeleton /><ChartSkeleton /></>
        ) : (
          <>
            <LineChart
              data={ratesChart}
              series={[
                { key: "10-Yr Treasury", label: "10-Yr Treasury", color: "#00f5ff" },
                { key: "2-Yr Treasury",  label: "2-Yr Treasury",  color: "#a855f7" },
                { key: "Fed Funds Rate", label: "Fed Funds Rate", color: "#ef4444" },
                { key: "30-Yr Mortgage",label: "30-Yr Mortgage",  color: "#f59e0b" },
              ]}
              title="U.S. Interest Rate Landscape (%)"
              yAxisLabel="Rate (%)"
              referenceLines={[
                { x: "2022-03-16", label: "Hikes Begin", color: "rgba(245,158,11,0.6)" },
              ]}
              exportFilename="interest_rates.csv"
            />
            <LineChart
              data={spreadChart}
              series={[
                { key: "High Yield Spread", label: "High Yield Credit Spread", color: "#ef4444" },
              ]}
              title="High Yield Credit Spread (%)"
              yAxisLabel="Spread (%)"
              referenceLines={[
                { x: "2020-03-01", label: "COVID Stress", color: "rgba(239,68,68,0.5)" },
              ]}
              exportFilename="credit_spreads.csv"
            />
          </>
        )}
      </div>

      {/* Conceptual cap rate table */}
      <div className="glass" style={{ padding: "20px", marginBottom: 28 }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, fontFamily: "var(--font-heading)", marginBottom: 16, color: "var(--color-text)" }}>
          Reference Cap Rate Ranges by Property Type
        </h3>
        <div className="kpi-grid-5" style={{ marginBottom: 0 }}>
          {[
            { type: "Industrial",    range: "4.5–6.0%",   trend: "up",   color: "#00ff9d" },
            { type: "Multifamily",   range: "4.8–6.5%",   trend: "up",   color: "#00f5ff" },
            { type: "Retail (A-class)",range:"5.5–7.0%",  trend: "neutral", color: "#f59e0b" },
            { type: "Office",        range: "7.0–10%+",   trend: "up",   color: "#ef4444" },
            { type: "Hotel",         range: "7.5–9.5%",   trend: "neutral", color: "#a855f7" },
          ].map(({ type, range, trend, color }) => (
            <div key={type} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${color}25` }}>
              <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{type}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color }}>{range}</p>
              <p style={{ fontSize: "0.68rem", color: trend === "up" ? "#fca5a5" : trend === "down" ? "#86efac" : "var(--color-text-dim)", marginTop: 4 }}>
                {trend === "up" ? "▲ Expanding" : trend === "down" ? "▼ Compressing" : "→ Stable"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <InsightCard bullets={insights} />
    </motion.div>
  );
}
