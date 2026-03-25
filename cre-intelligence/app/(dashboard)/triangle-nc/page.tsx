"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Microscope, TrendingUp, Search, Loader2 } from "lucide-react";
import { NumericKPICard } from "@/components/ui/KPICard";
import { KPICardSkeleton, ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { InsightCard } from "@/components/ui/InsightCard";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { NewsCard } from "@/components/ui/NewsCard";
import { LineChart, fredToChartData } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { TRIANGLE_SERIES, NATIONAL_SERIES, RTP_FACTS, TRIANGLE_INSIGHTS } from "@/lib/constants";
import {
  fetchFredLatest, fetchFredMulti,
  fetchCensusPopulation, fetchCensusMedianIncome, fetchCensusCBP,
  fetchNews,
} from "@/lib/api";
import type { NewsArticle } from "@/types";

export default function TriangleNCPage() {
  const [kpis, setKpis] = useState({ raleigh: null as number | null, durham: null as number | null, nc: null as number | null, national: null as number | null });
  const [unempHistory, setUnempHistory] = useState<Record<string, { date: string; value: number }[]>>({});
  const [ratesHistory, setRatesHistory] = useState<Record<string, { date: string; value: number }[]>>({});
  const [population, setPopulation] = useState<{ County: string; population: number }[]>([]);
  const [income, setIncome] = useState<{ County: string; median_income: number }[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsQuery, setNewsQuery] = useState("commercial real estate Raleigh OR Durham OR Triangle OR Chapel Hill");
  const [newsLoading, setNewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [raleigh, durham, nc, national, unempSeries, rates, popRaw, incomeRaw, newsRaw] = await Promise.all([
        fetchFredLatest(TRIANGLE_SERIES.raleighUnemp),
        fetchFredLatest(TRIANGLE_SERIES.durhamUnemp),
        fetchFredLatest(TRIANGLE_SERIES.ncUnemp),
        fetchFredLatest(NATIONAL_SERIES.nationalUnemp),
        fetchFredMulti({
          "Raleigh-Cary": TRIANGLE_SERIES.raleighUnemp,
          "Durham":       TRIANGLE_SERIES.durhamUnemp,
          "NC Statewide": TRIANGLE_SERIES.ncUnemp,
          "National":     NATIONAL_SERIES.nationalUnemp,
        }),
        fetchFredMulti({
          "10-Yr Treasury": NATIONAL_SERIES.treasury10yr,
          "Fed Funds Rate": NATIONAL_SERIES.fedFundsRate,
        }),
        fetchCensusPopulation("37"),
        fetchCensusMedianIncome("37"),
        fetchNews("commercial real estate Raleigh OR Durham OR Triangle OR Chapel Hill", 8),
      ]);

      setKpis({ raleigh, durham, nc, national });
      setUnempHistory(unempSeries);
      setRatesHistory(rates);
      setNews(newsRaw);

      const triangleNames = ["Wake", "Durham", "Orange", "Chatham", "Johnston"];
      const pop = popRaw
        .filter((d: Record<string, unknown>) => triangleNames.some((n) => String(d.NAME ?? "").includes(n)))
        .map((d: Record<string, unknown>) => ({
          County: String(d.NAME ?? "").replace(" County, North Carolina", ""),
          population: Number(d.population),
        }))
        .filter((d: { County: string; population: number }) => !isNaN(d.population));
      setPopulation(pop);

      const inc = incomeRaw
        .filter((d: Record<string, unknown>) => triangleNames.some((n) => String(d.NAME ?? "").includes(n)))
        .map((d: Record<string, unknown>) => ({
          County: String(d.NAME ?? "").replace(" County, North Carolina", ""),
          median_income: Number(d.median_income),
        }))
        .filter((d: { County: string; median_income: number }) => !isNaN(d.median_income));
      setIncome(inc);

      setLoading(false);
    }
    load();
  }, []);

  const searchNews = async () => {
    setNewsLoading(true);
    const results = await fetchNews(newsQuery, 8);
    setNews(results);
    setNewsLoading(false);
  };

  const unempData = fredToChartData(unempHistory);
  const ratesData = fredToChartData(ratesHistory);
  const advantage = kpis.raleigh != null && kpis.national != null
    ? (kpis.national - kpis.raleigh).toFixed(1)
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Triangle NC Deep Dive
          </h1>
          <GlowBadge label="Top Growth Market" variant="growth" pulse icon={<TrendingUp size={9} />} />
          <GlowBadge label="RTP Spotlight" variant="triangle" icon={<Star size={9} />} />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Research Triangle — Raleigh, Durham &amp; Chapel Hill. One of the fastest-growing metros in the U.S.
        </p>
      </div>

      {/* Hero KPIs */}
      <div className="kpi-grid-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <NumericKPICard title="Raleigh-Cary Unemployment" value={kpis.raleigh} suffix="%" subtitle={kpis.national ? `vs. National: ${kpis.national?.toFixed(1)}%` : ""} icon={<MapPin size={16} />} color="cyan" />
            <NumericKPICard title="Durham Unemployment" value={kpis.durham} suffix="%" subtitle="Durham-Chapel Hill MSA" color="green" />
            <NumericKPICard title="NC State Unemployment" value={kpis.nc} suffix="%" subtitle="North Carolina statewide" color="amber" />
            <NumericKPICard title="Triangle Advantage" value={advantage ? parseFloat(advantage) : null} suffix="% below national" subtitle="Raleigh vs. national" icon={<Star size={16} />} color="purple" />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Unemp + Rates charts */}
      <div className="chart-grid">
        {loading ? (<><ChartSkeleton /><ChartSkeleton /></>) : (
          <>
            <LineChart
              data={unempData}
              series={[
                { key: "Raleigh-Cary", label: "Raleigh-Cary", color: "#00f5ff" },
                { key: "Durham",       label: "Durham",        color: "#00ff9d" },
                { key: "NC Statewide", label: "NC Statewide",  color: "#f59e0b" },
                { key: "National",     label: "National",      color: "#ef4444" },
              ]}
              title="Unemployment Rate Comparison (%)"
              yAxisLabel="Rate (%)"
              exportFilename="triangle_unemployment.csv"
            />
            <LineChart
              data={ratesData}
              series={[
                { key: "10-Yr Treasury", label: "10-Yr Treasury", color: "#00f5ff" },
                { key: "Fed Funds Rate", label: "Fed Funds Rate", color: "#ef4444", type: "stepAfter" },
              ]}
              title="National Rates (CRE Cost of Capital)"
              yAxisLabel="Rate (%)"
              exportFilename="rates_triangle.csv"
            />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Census charts */}
      {population.length > 0 && (
        <div className="chart-grid">
          <BarChart
            data={[...population].sort((a, b) => a.population - b.population)}
            xKey="population"
            yKey="County"
            title="Population by Triangle County"
            orientation="horizontal"
            showLabels
            exportFilename="triangle_population.csv"
          />
          <BarChart
            data={[...income].sort((a, b) => b.median_income - a.median_income)}
            xKey="County"
            yKey="median_income"
            title="Median Household Income ($)"
            exportFilename="triangle_income.csv"
          />
        </div>
      )}

      <div className="neon-divider" />

      {/* RTP Key Facts */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Microscope size={20} color="#00f5ff" />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Research Triangle Park — Key Facts
          </h2>
        </div>
        <div className="kpi-grid-3" style={{ marginBottom: 0 }}>
          {RTP_FACTS.map((fact, i) => (
            <motion.div
              key={fact.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass glass-hover glass-cyan"
              style={{ padding: "16px 18px" }}
            >
              <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 6 }}>
                {fact.label}
              </p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#00f5ff", fontFamily: "var(--font-display)", marginBottom: 4 }}>
                {fact.value}
              </p>
              {fact.note && <p style={{ fontSize: "0.73rem", color: "var(--color-text-muted)" }}>{fact.note}</p>}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="neon-divider" />

      {/* News feed */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Search size={18} color="#00f5ff" />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Live Triangle CRE News
          </h2>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            value={newsQuery}
            onChange={(e) => setNewsQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchNews()}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "8px 14px",
              color: "var(--color-text)",
              fontSize: "0.83rem",
              outline: "none",
              fontFamily: "var(--font-body)",
            }}
            placeholder="Search CRE news…"
          />
          <button
            onClick={searchNews}
            disabled={newsLoading}
            className="btn-neon"
            style={{ flexShrink: 0 }}
          >
            {newsLoading ? <Loader2 size={14} className="spin-ring" /> : <Search size={14} />}
            Search
          </button>
        </div>

        {news.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {news.map((article, i) => (
              <NewsCard key={article.url} article={article} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass" style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)" }}>
            No articles found — try a different search query.
          </div>
        )}
      </div>

      <InsightCard bullets={TRIANGLE_INSIGHTS} />
    </motion.div>
  );
}
