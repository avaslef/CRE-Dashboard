"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingDown, BarChart3, Home, Building,
  Activity, Layers,
} from "lucide-react";
import type { MarketCity } from "@/types";
import { KPICard, NumericKPICard } from "@/components/ui/KPICard";
import { KPICardSkeleton, ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { InsightCard } from "@/components/ui/InsightCard";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { LineChart, fredToChartData } from "@/components/charts/LineChart";
import { MARKET_TIERS, NATIONAL_SERIES, OVERVIEW_INSIGHTS } from "@/lib/constants";
import { fetchFredLatest, fetchFredMulti, fetchFredSeries, fetchFredLatestBatched, getAllMarkets } from "@/lib/api";
import type { FredObservation } from "@/types";

interface OverviewKPIs {
  fedRate: number | null;
  natUnemp: number | null;
  treasury10yr: number | null;
  crePrice: number | null;
  mortgage: number | null;
}

interface TierUnempMap {
  [market: string]: number | null;
}

export default function OverviewPage() {
  const [kpis, setKpis] = useState<OverviewKPIs>({
    fedRate: null, natUnemp: null, treasury10yr: null, crePrice: null, mortgage: null,
  });
  const [creHistory, setCreHistory] = useState<FredObservation[]>([]);
  const [ratesHistory, setRatesHistory] = useState<Record<string, FredObservation[]>>({});
  const [tierUnemp, setTierUnemp] = useState<TierUnempMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [fedRate, natUnemp, treasury10yr, crePrice, mortgage, cre, rates] = await Promise.all([
        fetchFredLatest(NATIONAL_SERIES.fedFundsRate),
        fetchFredLatest(NATIONAL_SERIES.nationalUnemp),
        fetchFredLatest(NATIONAL_SERIES.treasury10yr),
        fetchFredLatest(NATIONAL_SERIES.crePrice),
        fetchFredLatest(NATIONAL_SERIES.mortgage30yr),
        fetchFredSeries(NATIONAL_SERIES.crePrice),
        fetchFredMulti({
          "Fed Funds Rate": NATIONAL_SERIES.fedFundsRate,
          "10-Yr Treasury": NATIONAL_SERIES.treasury10yr,
          "30-Yr Mortgage": NATIONAL_SERIES.mortgage30yr,
        }),
      ]);
      setKpis({ fedRate, natUnemp, treasury10yr, crePrice, mortgage });
      setCreHistory(cre);
      setRatesHistory(rates);

      // Fetch unemployment for all markets — batched to avoid FRED rate limiting
      const allMarkets = getAllMarkets(MARKET_TIERS as any);
      const unempMap = await fetchFredLatestBatched(
        allMarkets.map((m) => ({ key: m.name, seriesId: m.fredUnemp }))
      );
      setTierUnemp(unempMap);
      setLoading(false);
    }
    load();
  }, []);

  const crePriceData = fredToChartData({ "CRE Price Index": creHistory });
  const ratesData = fredToChartData(ratesHistory);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page header */}
      <div className="section-header" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            CRE Market Overview
          </h1>
          <GlowBadge label="Live Data" variant="growth" pulse />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          National commercial real estate snapshot — macro conditions, market tiers, and key indicators.
        </p>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <NumericKPICard
              title="Fed Funds Rate"
              value={kpis.fedRate}
              suffix="%"
              subtitle="FOMC target rate"
              source="Federal Reserve via FRED"
              icon={<DollarSign size={16} />}
              color="cyan"
            />
            <NumericKPICard
              title="National Unemployment"
              value={kpis.natUnemp}
              suffix="%"
              subtitle="U-3 seasonally adjusted"
              source="BLS via FRED (UNRATE)"
              icon={<Activity size={16} />}
              color="amber"
            />
            <NumericKPICard
              title="10-Yr Treasury"
              value={kpis.treasury10yr}
              suffix="%"
              subtitle="CRE cap rate benchmark"
              source="U.S. Treasury via FRED"
              icon={<TrendingDown size={16} />}
              color="purple"
            />
            <NumericKPICard
              title="CRE Price Index"
              value={kpis.crePrice}
              decimals={1}
              subtitle="National index"
              source="CoStar via FRED (COMREPUSQ159N)"
              icon={<Building size={16} />}
              color="green"
            />
            <NumericKPICard
              title="30-Yr Mortgage"
              value={kpis.mortgage}
              suffix="%"
              subtitle="National average"
              source="Freddie Mac via FRED"
              icon={<Home size={16} />}
              color="red"
            />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Chart row */}
      <div className="chart-grid">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <LineChart
              data={crePriceData}
              series={[{ key: "CRE Price Index", label: "CRE Price Index", color: "#00f5ff" }]}
              title="CRE Price Index (National)"
              yAxisLabel="Index"
              referenceLines={[
                { x: "2020-03-01", label: "COVID", color: "rgba(239,68,68,0.6)" },
                { x: "2022-03-01", label: "Rate Hikes", color: "rgba(245,158,11,0.6)" },
              ]}
              exportFilename="cre_price_index.csv"
            />
            <LineChart
              data={ratesData}
              series={[
                { key: "Fed Funds Rate", label: "Fed Funds Rate", color: "#ef4444", type: "stepAfter" },
                { key: "10-Yr Treasury", label: "10-Yr Treasury", color: "#00f5ff" },
                { key: "30-Yr Mortgage", label: "30-Yr Mortgage", color: "#f59e0b" },
              ]}
              title="Interest Rate Environment"
              yAxisLabel="Rate (%)"
              exportFilename="interest_rates.csv"
            />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Market tier summary */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Layers size={20} color="#00f5ff" />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            Market Tier Summary
          </h2>
        </div>

        {Object.entries(MARKET_TIERS).map(([tierName, tierData]) => (
          <details key={tierName} style={{ marginBottom: 12 }} open={tierName === "Tier 2 / Emerging"}>
            <summary
              style={{
                cursor: "pointer",
                padding: "10px 16px",
                background: "rgba(255,255,255,0.025)",
                border: `1px solid ${tierData.color}30`,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "0.87rem",
                fontWeight: 600,
                color: "var(--color-text)",
                listStyle: "none",
                userSelect: "none",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: tierData.color, flexShrink: 0, boxShadow: `0 0 8px ${tierData.color}` }} />
              {tierName} — {tierData.markets.length} markets
              <BarChart3 size={14} style={{ marginLeft: "auto", color: "var(--color-text-dim)" }} />
            </summary>

            <div
              style={{
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 10,
                background: "rgba(255,255,255,0.01)",
                border: `1px solid ${tierData.color}18`,
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
              }}
            >
              {tierData.markets.map((market: MarketCity) => {
                const unemp = tierUnemp[market.name];
                return (
                  <motion.div
                    key={market.name}
                    whileHover={{ scale: 1.02, borderColor: `${tierData.color}60` }}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${tierData.color}20`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      transition: "all 0.2s",
                    }}
                  >
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
                      {market.name}
                      {market.highlight && " ⭐"}
                    </p>
                    <p
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: unemp != null ? tierData.color : "var(--color-text-dim)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {loading ? "…" : unemp != null ? `${unemp.toFixed(1)}%` : "—"}
                    </p>
                    <p style={{ fontSize: "0.67rem", color: "var(--color-text-dim)" }}>Unemployment</p>
                  </motion.div>
                );
              })}
            </div>
          </details>
        ))}
      </div>

      <InsightCard bullets={OVERVIEW_INSIGHTS} />
    </motion.div>
  );
}
