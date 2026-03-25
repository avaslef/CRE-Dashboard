"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Microscope, TrendingUp, Search, Loader2, DollarSign, Briefcase, Home } from "lucide-react";
import { NumericKPICard } from "@/components/ui/KPICard";
import { KPICardSkeleton, ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { InsightCard } from "@/components/ui/InsightCard";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { NewsCard } from "@/components/ui/NewsCard";
import { LineChart, fredToChartData, computeFedFundsDiff } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { TRIANGLE_SERIES, NATIONAL_SERIES, RTP_FACTS, TRIANGLE_INSIGHTS } from "@/lib/constants";
import {
  fetchFredLatest, fetchFredMulti, fetchFredLatestBatched,
  fetchCensusPopulation, fetchCensusMedianIncome, fetchCensusGrossRent,
  fetchNews,
} from "@/lib/api";
import type { FredObservation, NewsArticle } from "@/types";

export default function TriangleNCPage() {
  const [kpis, setKpis] = useState({ raleigh: null as number | null, durham: null as number | null, nc: null as number | null, national: null as number | null });
  const [unempHistory, setUnempHistory]   = useState<Record<string, FredObservation[]>>({});
  const [ratesHistory, setRatesHistory]   = useState<Record<string, FredObservation[]>>({});
  const [hpiHistory, setHpiHistory]       = useState<Record<string, FredObservation[]>>({});
  const [pcpiHistory, setPcpiHistory]     = useState<Record<string, FredObservation[]>>({});
  const [laborHistory, setLaborHistory]   = useState<Record<string, FredObservation[]>>({});
  const [empSectors, setEmpSectors]       = useState<Record<string, number | null>>({});
  const [population, setPopulation]       = useState<{ County: string; population: number }[]>([]);
  const [income, setIncome]               = useState<{ County: string; median_income: number }[]>([]);
  const [grossRent, setGrossRent]         = useState<{ County: string; gross_rent: number }[]>([]);
  const [news, setNews]                   = useState<NewsArticle[]>([]);
  const [newsQuery, setNewsQuery]         = useState("commercial real estate Raleigh OR Durham OR Triangle OR Chapel Hill");
  const [newsLoading, setNewsLoading]     = useState(false);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [
        raleigh, durham, nc, national,
        unempSeries, rates, hpi, pcpi, labor,
        popRaw, incomeRaw, rentRaw, newsRaw,
      ] = await Promise.all([
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
          "FF Lower":       NATIONAL_SERIES.fedFundsLower,
          "FF Upper":       NATIONAL_SERIES.fedFundsUpper,
        }),
        fetchFredMulti({
          "Raleigh-Cary": TRIANGLE_SERIES.raleighHPI,
          "Durham-Chapel Hill": TRIANGLE_SERIES.durhamHPI,
          "National": TRIANGLE_SERIES.nationalHPI,
        }),
        fetchFredMulti({
          "Raleigh-Cary": TRIANGLE_SERIES.raleighPCPI,
          "Durham-Chapel Hill": TRIANGLE_SERIES.durhamPCPI,
          "U.S. Average": TRIANGLE_SERIES.nationalPCPI,
        }),
        fetchFredMulti({
          "Raleigh Labor Force": TRIANGLE_SERIES.raleighLaborForce,
          "Durham Labor Force":  TRIANGLE_SERIES.durhamLaborForce,
        }),
        fetchCensusPopulation("37"),
        fetchCensusMedianIncome("37"),
        fetchCensusGrossRent("37"),
        fetchNews("commercial real estate Raleigh OR Durham OR Triangle OR Chapel Hill", 8),
      ]);

      setKpis({ raleigh, durham, nc, national });
      setUnempHistory(unempSeries);

      const ffDiff = computeFedFundsDiff(rates["FF Lower"] ?? [], rates["FF Upper"] ?? []);
      setRatesHistory({ "10-Yr Treasury": rates["10-Yr Treasury"] ?? [], "FF Lower": rates["FF Lower"] ?? [], "FF Diff": ffDiff });
      setHpiHistory(hpi);
      setPcpiHistory(pcpi);
      setLaborHistory(labor);
      setNews(newsRaw);

      const triangleNames = ["Wake", "Durham", "Orange", "Chatham", "Johnston"];
      const filterTri = (raw: Record<string, unknown>[]) =>
        raw.filter((d) => triangleNames.some((n) => String(d.NAME ?? "").includes(n)));
      const toCounty = (d: Record<string, unknown>) =>
        String(d.NAME ?? "").replace(" County, North Carolina", "");

      setPopulation(filterTri(popRaw).map((d) => ({ County: toCounty(d), population: Number(d.population) })).filter((d) => !isNaN(d.population)));
      setIncome(filterTri(incomeRaw).map((d) => ({ County: toCounty(d), median_income: Number(d.median_income) })).filter((d) => !isNaN(d.median_income)));
      setGrossRent(filterTri(rentRaw).map((d) => ({ County: toCounty(d), gross_rent: Number(d.gross_rent) })).filter((d) => !isNaN(d.gross_rent)));

      setLoading(false);

      // Fetch employment sector KPIs separately (batched, graceful fail per series)
      const emp = await fetchFredLatestBatched([
        { key: "Total Nonfarm",    seriesId: TRIANGLE_SERIES.raleighEmpTotal },
        { key: "Prof/Business",    seriesId: TRIANGLE_SERIES.raleighEmpProBus },
        { key: "Ed/Health",        seriesId: TRIANGLE_SERIES.raleighEmpEdHlth },
        { key: "Government",       seriesId: TRIANGLE_SERIES.raleighEmpGovt },
        { key: "Construction",     seriesId: TRIANGLE_SERIES.raleighEmpConst },
        { key: "Information",      seriesId: TRIANGLE_SERIES.raleighEmpInfo },
      ]);
      setEmpSectors(emp);
    }
    load();
  }, []);

  const searchNews = async () => {
    setNewsLoading(true);
    setNews(await fetchNews(newsQuery, 8));
    setNewsLoading(false);
  };

  const unempData  = fredToChartData(unempHistory);
  const ratesData  = fredToChartData(ratesHistory);
  const hpiData    = fredToChartData(hpiHistory);
  const pcpiData   = fredToChartData(pcpiHistory);
  const laborData  = fredToChartData(laborHistory);
  const advantage  = kpis.raleigh != null && kpis.national != null ? (kpis.national - kpis.raleigh).toFixed(1) : null;

  const empBarData = Object.entries(empSectors)
    .filter(([, v]) => v != null && v > 0)
    .map(([sector, val]) => ({ Sector: sector, "Employees (000s)": val as number }))
    .sort((a, b) => b["Employees (000s)"] - a["Employees (000s)"]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>Triangle NC Deep Dive</h1>
          <GlowBadge label="Top Growth Market" variant="growth" pulse icon={<TrendingUp size={9} />} />
          <GlowBadge label="RTP Spotlight" variant="triangle" icon={<Star size={9} />} />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Research Triangle — Raleigh, Durham &amp; Chapel Hill. One of the fastest-growing metros in the U.S.
        </p>
      </div>

      {/* Hero KPIs */}
      <div className="kpi-grid-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />) : (
          <>
            <NumericKPICard title="Raleigh-Cary Unemployment" value={kpis.raleigh} suffix="%" subtitle={kpis.national ? `vs. National: ${kpis.national?.toFixed(1)}%` : ""} icon={<MapPin size={16} />} color="cyan" />
            <NumericKPICard title="Durham Unemployment"       value={kpis.durham}  suffix="%" subtitle="Durham-Chapel Hill MSA" color="green" />
            <NumericKPICard title="NC State Unemployment"     value={kpis.nc}      suffix="%" subtitle="North Carolina statewide" color="amber" />
            <NumericKPICard title="Triangle Advantage"        value={advantage ? parseFloat(advantage) : null} suffix="% below national" subtitle="Raleigh vs. national" icon={<Star size={16} />} color="purple" />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Unemployment + Rates */}
      <div className="chart-grid">
        {loading ? (<><ChartSkeleton /><ChartSkeleton /></>) : (
          <>
            <LineChart data={unempData} series={[
              { key: "Raleigh-Cary", label: "Raleigh-Cary", color: "#00f5ff" },
              { key: "Durham",       label: "Durham",        color: "#00ff9d" },
              { key: "NC Statewide", label: "NC Statewide",  color: "#f59e0b" },
              { key: "National",     label: "National",      color: "#ef4444" },
            ]} title="Unemployment Rate Comparison (%)" yAxisLabel="Rate (%)" exportFilename="triangle_unemployment.csv" />
            <LineChart data={ratesData} series={[
              { key: "10-Yr Treasury", label: "10-Yr Treasury", color: "#00f5ff" },
              { key: "FF Lower", label: "Fed Funds Rate", color: "#ef4444", area: true, stackId: "ff", fillOpacity: 0, strokeOpacity: 0.55, strokeWidth: 1.5, type: "stepAfter" },
              { key: "FF Diff",  label: "FF +25bps",      color: "#ef4444", area: true, stackId: "ff", fillOpacity: 0.18, strokeOpacity: 0, strokeWidth: 0, type: "stepAfter", bandBaseKey: "FF Lower" },
            ]} title="National Rates (CRE Cost of Capital)" yAxisLabel="Rate (%)" exportFilename="rates_triangle.csv" />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Census: Population + Income */}
      {population.length > 0 && (
        <div className="chart-grid">
          <BarChart data={[...population].sort((a, b) => a.population - b.population)} xKey="population" yKey="County" title="Population by Triangle County" orientation="horizontal" showLabels exportFilename="triangle_population.csv" />
          <BarChart data={[...income].sort((a, b) => b.median_income - a.median_income)} xKey="County" yKey="median_income" title="Median Household Income ($)" exportFilename="triangle_income.csv" />
        </div>
      )}

      <div className="neon-divider" />

      {/* Home Price Index + Labor Force */}
      <div className="chart-grid">
        {loading ? (<><ChartSkeleton /><ChartSkeleton /></>) : (
          <>
            <LineChart data={hpiData} series={[
              { key: "Raleigh-Cary",        label: "Raleigh-Cary",        color: "#00f5ff" },
              { key: "Durham-Chapel Hill",  label: "Durham-Chapel Hill",  color: "#00ff9d" },
              { key: "National",            label: "National",             color: "#a855f7" },
            ]} title="Home Price Index — Triangle vs. National (FHFA)" yAxisLabel="Index" exportFilename="triangle_hpi.csv" />
            <LineChart data={laborData} series={[
              { key: "Raleigh Labor Force", label: "Raleigh-Cary",  color: "#00f5ff" },
              { key: "Durham Labor Force",  label: "Durham",         color: "#00ff9d" },
            ]} title="Civilian Labor Force (thousands)" yAxisLabel="Thousands" exportFilename="triangle_labor_force.csv" />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Per Capita Income + Gross Rent */}
      <div className="chart-grid">
        {loading ? (<><ChartSkeleton /><ChartSkeleton /></>) : (
          <>
            <LineChart data={pcpiData} series={[
              { key: "Raleigh-Cary",       label: "Raleigh-Cary",       color: "#00f5ff" },
              { key: "Durham-Chapel Hill", label: "Durham-Chapel Hill", color: "#00ff9d" },
              { key: "U.S. Average",       label: "U.S. Average",       color: "#a855f7" },
            ]} title="Per Capita Personal Income — BEA ($)" yAxisLabel="USD" exportFilename="triangle_pcpi.csv" />
            {grossRent.length > 0 ? (
              <BarChart
                data={[...grossRent].sort((a, b) => b.gross_rent - a.gross_rent)}
                xKey="County" yKey="gross_rent"
                title="Median Gross Rent by County — ACS ($)"
                exportFilename="triangle_rent.csv"
              />
            ) : <ChartSkeleton />}
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Employment by Sector */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Briefcase size={20} color="#00f5ff" />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>Raleigh-Cary Employment by Sector</h2>
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginLeft: 4 }}>BLS CES, thousands</span>
        </div>
        {empBarData.length > 0 ? (
          <div className="chart-grid">
            <BarChart data={empBarData} xKey="Employees (000s)" yKey="Sector" title="Employment by Sector (000s)" orientation="horizontal" showLabels exportFilename="triangle_employment.csv" />
            <div className="kpi-grid-3" style={{ marginBottom: 0 }}>
              {empBarData.slice(0, 6).map((s) => (
                <div key={s.Sector} className="glass" style={{ padding: "14px 16px" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 6 }}>{s.Sector}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, color: "#00f5ff" }}>{s["Employees (000s)"].toFixed(1)}K</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass" style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.83rem" }}>
            <DollarSign size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p>Employment sector data loading or unavailable from FRED.</p>
          </div>
        )}
      </div>

      <div className="neon-divider" />

      {/* RTP Key Facts */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Microscope size={20} color="#00f5ff" />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>Research Triangle Park — Key Facts</h2>
        </div>
        <div className="kpi-grid-3" style={{ marginBottom: 0 }}>
          {RTP_FACTS.map((fact, i) => (
            <motion.div key={fact.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass glass-hover glass-cyan" style={{ padding: "16px 18px" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 6 }}>{fact.label}</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#00f5ff", fontFamily: "var(--font-display)", marginBottom: 4 }}>{fact.value}</p>
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
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>Live Triangle CRE News</h2>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input value={newsQuery} onChange={(e) => setNewsQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchNews()} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 14px", color: "var(--color-text)", fontSize: "0.83rem", outline: "none", fontFamily: "var(--font-body)" }} placeholder="Search CRE news…" />
          <button onClick={searchNews} disabled={newsLoading} className="btn-neon" style={{ flexShrink: 0 }}>
            {newsLoading ? <Loader2 size={14} className="spin-ring" /> : <Search size={14} />}
            Search
          </button>
        </div>
        {news.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {news.map((article, i) => <NewsCard key={article.url} article={article} index={i} />)}
          </div>
        ) : (
          <div className="glass" style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)" }}>No articles found — try a different search query.</div>
        )}
      </div>

      <InsightCard bullets={TRIANGLE_INSIGHTS} />
    </motion.div>
  );
}
