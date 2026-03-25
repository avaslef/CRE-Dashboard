"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Activity, Building2 } from "lucide-react";
import { NumericKPICard } from "@/components/ui/KPICard";
import { KPICardSkeleton, ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { InsightCard } from "@/components/ui/InsightCard";
import { LineChart, fredToChartData } from "@/components/charts/LineChart";
import { NATIONAL_SERIES, MACRO_INSIGHTS } from "@/lib/constants";
import { fetchFredLatest, fetchFredMulti } from "@/lib/api";
import type { FredObservation } from "@/types";

export default function MacroTrendsPage() {
  const [kpis, setKpis] = useState({
    gdpGrowth:  null as number | null,
    cpi:        null as number | null,
    natUnemp:   null as number | null,
    fedFunds:   null as number | null,
    t10yr:      null as number | null,
    constrSpend:null as number | null,
  });
  const [macroData, setMacroData] = useState<Record<string, FredObservation[]>>({});
  const [ratesData, setRatesData] = useState<Record<string, FredObservation[]>>({});
  const [laborData, setLaborData] = useState<Record<string, FredObservation[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [gdpGrowth, cpi, natUnemp, fedFunds, t10yr, constrSpend, macro, rates, labor] = await Promise.all([
        fetchFredLatest(NATIONAL_SERIES.gdpGrowth),
        fetchFredLatest(NATIONAL_SERIES.cpi),
        fetchFredLatest(NATIONAL_SERIES.nationalUnemp),
        fetchFredLatest(NATIONAL_SERIES.fedFundsRate),
        fetchFredLatest(NATIONAL_SERIES.treasury10yr),
        fetchFredLatest(NATIONAL_SERIES.constructionSpend),
        fetchFredMulti({
          "CRE Price Index": NATIONAL_SERIES.crePrice,
          "Construction Spend": NATIONAL_SERIES.constructionSpend,
        }),
        fetchFredMulti({
          "Fed Funds Rate": NATIONAL_SERIES.fedFundsRate,
          "10-Yr Treasury": NATIONAL_SERIES.treasury10yr,
          "30-Yr Mortgage": NATIONAL_SERIES.mortgage30yr,
        }),
        fetchFredMulti({
          "Unemployment Rate": NATIONAL_SERIES.nationalUnemp,
          "GDP Growth (%)":    NATIONAL_SERIES.gdpGrowth,
        }),
      ]);
      setKpis({ gdpGrowth, cpi, natUnemp, fedFunds, t10yr, constrSpend });
      setMacroData(macro);
      setRatesData(rates);
      setLaborData(labor);
      setLoading(false);
    }
    load();
  }, []);

  const macroChart  = fredToChartData(macroData);
  const ratesChart  = fredToChartData(ratesData);
  const laborChart  = fredToChartData(laborData);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)", marginBottom: 6 }}>
          Macro Trends
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          National macroeconomic indicators that drive commercial real estate performance.
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <NumericKPICard title="GDP Growth" value={kpis.gdpGrowth} suffix="%" subtitle="Real GDP, quarter" source="BEA via FRED (A191RL1Q225SBEA)" icon={<TrendingUp size={15} />} color="green" />
            <NumericKPICard title="CPI (Inflation)" value={kpis.cpi} decimals={1} subtitle="Consumer Price Index" source="BLS via FRED (CPIAUCSL)" icon={<Activity size={15} />} color="amber" />
            <NumericKPICard title="National Unemp." value={kpis.natUnemp} suffix="%" source="BLS via FRED (UNRATE)" color="cyan" />
            <NumericKPICard title="Fed Funds Rate" value={kpis.fedFunds} suffix="%" source="Federal Reserve via FRED (FEDFUNDS)" color="red" />
            <NumericKPICard title="10-Yr Treasury" value={kpis.t10yr} suffix="%" source="U.S. Treasury via FRED (DGS10)" color="purple" />
            <NumericKPICard title="Construction Spend" value={kpis.constrSpend != null ? kpis.constrSpend * 1e6 : null} prefix="$" decimals={2} abbrev subtitle="Non-residential (annualized)" source="Census Bureau via FRED (TLNRESCONS)" icon={<Building2 size={15} />} color="cyan" />
          </>
        )}
      </div>

      <div className="neon-divider" />

      {/* Charts */}
      <div className="chart-grid" style={{ marginBottom: 20 }}>
        {loading ? (
          <><ChartSkeleton /><ChartSkeleton /></>
        ) : (
          <>
            <LineChart
              data={ratesChart}
              series={[
                { key: "Fed Funds Rate", label: "Fed Funds Rate", color: "#ef4444", type: "stepAfter" },
                { key: "10-Yr Treasury", label: "10-Yr Treasury", color: "#00f5ff" },
                { key: "30-Yr Mortgage", label: "30-Yr Mortgage", color: "#f59e0b" },
              ]}
              title="Interest Rate Environment (%)"
              yAxisLabel="Rate (%)"
              referenceLines={[
                { x: "2022-03-01", label: "Rate Hikes Begin", color: "rgba(245,158,11,0.5)" },
              ]}
              exportFilename="interest_rates.csv"
            />
            <LineChart
              data={laborChart}
              series={[
                { key: "Unemployment Rate", label: "Unemployment Rate", color: "#00ff9d" },
              ]}
              title="National Unemployment Rate (%)"
              yAxisLabel="Rate (%)"
              referenceLines={[
                { x: "2020-03-01", label: "COVID-19", color: "rgba(239,68,68,0.5)" },
              ]}
              exportFilename="unemployment.csv"
            />
          </>
        )}
      </div>

      <div className="chart-grid">
        {!loading && (
          <>
            <LineChart
              data={macroChart}
              series={[
                { key: "CRE Price Index", label: "CRE Price Index", color: "#00f5ff" },
              ]}
              title="Commercial Real Estate Price Index"
              exportFilename="cre_price.csv"
            />
            <LineChart
              data={macroChart}
              series={[
                { key: "Construction Spend", label: "Non-Residential Construction ($M)", color: "#a855f7" },
              ]}
              title="Non-Residential Construction Spending"
              exportFilename="construction.csv"
            />
          </>
        )}
      </div>

      <InsightCard bullets={MACRO_INSIGHTS} />
    </motion.div>
  );
}
