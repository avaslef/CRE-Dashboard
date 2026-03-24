"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { NumericKPICard } from "@/components/ui/KPICard";
import { KPICardSkeleton, ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { LineChart, fredToChartData } from "@/components/charts/LineChart";
import { CAPITAL_SERIES } from "@/lib/constants";
import { fetchFredSeries, fetchFredLatest } from "@/lib/api";
import type { FredObservation } from "@/types";

/* ────────────────────────────── helpers ────────────────────────────── */

function pmt(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  const r = rate;
  return (pv * r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1);
}

function ratingColor(val: number, green: [number, number], yellow: [number, number]): string {
  if (val >= green[0] && val <= green[1]) return "#00ff9d";
  if (val >= yellow[0] && val <= yellow[1]) return "#f59e0b";
  return "#ef4444";
}

/* ────────────────────────────── component ─────────────────────────── */

export default function ForecastingPage() {
  /* ── FRED data state ── */
  const [kpis, setKpis] = useState({ t10: null as number | null, t2: null as number | null, fedFunds: null as number | null, hySpread: null as number | null, mortgage: null as number | null });
  const [spreadSeries, setSpreadSeries] = useState<Record<string, string | number>[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Cap Rate model state ── */
  const [riskPremium, setRiskPremium] = useState(300);
  const [growthExp, setGrowthExp] = useState(200);

  /* ── DSCR state ── */
  const [noi, setNoi] = useState(500000);
  const [loanAmt, setLoanAmt] = useState(5000000);
  const [intRate, setIntRate] = useState(6.5);
  const [amortYears, setAmortYears] = useState(30);
  const [rateShock, setRateShock] = useState(0);

  /* ── UI state ── */
  const [refsOpen, setRefsOpen] = useState(false);

  /* ── Load FRED data ── */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [t10, t2, fedFunds, hySpread, mortgage, t10Series, t2Series] = await Promise.all([
        fetchFredLatest(CAPITAL_SERIES.tenYrTreasury),
        fetchFredLatest(CAPITAL_SERIES.twoYrTreasury),
        fetchFredLatest(CAPITAL_SERIES.fedFunds),
        fetchFredLatest(CAPITAL_SERIES.highYieldSpread),
        fetchFredLatest(CAPITAL_SERIES.mortgage30yr),
        fetchFredSeries(CAPITAL_SERIES.tenYrTreasury, "2010-01-01"),
        fetchFredSeries(CAPITAL_SERIES.twoYrTreasury, "2010-01-01"),
      ]);
      setKpis({ t10, t2, fedFunds, hySpread, mortgage });

      /* Build spread series (10Y - 2Y) */
      const t2Map = new Map<string, number>();
      for (const o of t2Series) t2Map.set(o.date, o.value);
      const spread: Record<string, string | number>[] = [];
      for (const o of t10Series) {
        const t2Val = t2Map.get(o.date);
        if (t2Val !== undefined) spread.push({ date: o.date, "10Y-2Y Spread": +(o.value - t2Val).toFixed(3) });
      }
      setSpreadSeries(spread);

      if (t10 != null) setIntRate(+t10.toFixed(2) + 2); // seed DSCR rate near market
      setLoading(false);
    }
    load();
  }, []);

  /* ── Derived: Cap Rate ── */
  const riskFreeForModel = kpis.t10 ?? 4.5;
  const impliedCapRate = riskFreeForModel + riskPremium / 100 - growthExp / 100;

  /* ── Derived: DSCR ── */
  const effectiveRate = intRate + rateShock;
  const monthlyRate = effectiveRate / 100 / 12;
  const nPeriods = amortYears * 12;
  const monthlyPayment = pmt(monthlyRate, nPeriods, loanAmt);
  const annualDS = monthlyPayment * 12;
  const dscr = annualDS > 0 ? noi / annualDS : 0;
  const dscrColor = dscr >= 1.35 ? "#00ff9d" : dscr >= 1.2 ? "#f59e0b" : "#ef4444";
  const dscrLabel = dscr >= 1.35 ? "Healthy" : dscr >= 1.2 ? "Thin" : "Below threshold";

  /* ── Derived: yield curve ── */
  const spread = kpis.t10 != null && kpis.t2 != null ? +(kpis.t10 - kpis.t2).toFixed(2) : null;
  const inverted = spread != null && spread < 0;

  /* ── Financial conditions ── */
  const conditions = useMemo(() => [
    { label: "10-Yr Treasury", value: kpis.t10, unit: "%", color: kpis.t10 == null ? "#555" : kpis.t10 < 4 ? "#00ff9d" : kpis.t10 <= 5 ? "#f59e0b" : "#ef4444" },
    { label: "2-Yr Treasury", value: kpis.t2, unit: "%", color: kpis.t2 == null ? "#555" : kpis.t2 < 4 ? "#00ff9d" : kpis.t2 <= 5 ? "#f59e0b" : "#ef4444" },
    { label: "10Y-2Y Spread", value: spread, unit: "pp", color: spread == null ? "#555" : spread > 0 ? "#00ff9d" : "#ef4444" },
    { label: "Fed Funds Rate", value: kpis.fedFunds, unit: "%", color: kpis.fedFunds == null ? "#555" : kpis.fedFunds < 4 ? "#00ff9d" : kpis.fedFunds <= 5.25 ? "#f59e0b" : "#ef4444" },
    { label: "HY Credit Spread", value: kpis.hySpread, unit: "%", color: kpis.hySpread == null ? "#555" : kpis.hySpread < 4 ? "#00ff9d" : kpis.hySpread <= 5 ? "#f59e0b" : "#ef4444" },
    { label: "30-Yr Mortgage", value: kpis.mortgage, unit: "%", color: kpis.mortgage == null ? "#555" : kpis.mortgage < 5.5 ? "#00ff9d" : kpis.mortgage <= 7 ? "#f59e0b" : "#ef4444" },
  ], [kpis, spread]);

  /* ── slider style helper ── */
  const sliderStyle: React.CSSProperties = { width: "100%", accentColor: "#00f5ff", cursor: "pointer", height: 6, marginTop: 4 };
  const labelStyle: React.CSSProperties = { fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const };
  const valStyle: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700, color: "#00f5ff" };
  const sectionTitle: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 600, fontFamily: "var(--font-heading)", marginBottom: 16, color: "var(--color-text)" };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>Forecasting</h1>
          {inverted && (
            <span className="badge" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}>
              <AlertTriangle size={9} /> Yield Curve Inverted
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Academic-grade models for CRE rate forecasting, debt stress testing, and financial conditions monitoring.
        </p>
      </div>

      {/* ════════ 1. Yield Curve & Recession Monitor ════════ */}
      <div className="kpi-grid-3" style={{ marginBottom: 20 }}>
        {loading ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />) : (
          <>
            <NumericKPICard title="10-Yr Treasury" value={kpis.t10} suffix="%" subtitle="Risk-free anchor" source="FRED DGS10" color="cyan" />
            <NumericKPICard title="2-Yr Treasury" value={kpis.t2} suffix="%" subtitle="Short-term rate" source="FRED DGS2" color="purple" />
            <NumericKPICard title="10Y-2Y Spread" value={spread} suffix=" pp" subtitle={inverted ? "INVERTED" : "Normal"} source="Computed" color={inverted ? "red" : "green"} icon={inverted ? <AlertTriangle size={15} /> : <TrendingUp size={15} />} />
          </>
        )}
      </div>

      {loading ? <ChartSkeleton /> : (
        <LineChart
          data={spreadSeries}
          series={[{ key: "10Y-2Y Spread", label: "10Y - 2Y Spread", color: "#00f5ff" }]}
          title="Yield Curve Spread (10Y - 2Y Treasury)"
          yAxisLabel="Spread (pp)"
          referenceLines={[{ y: 0, label: "Inversion Threshold", color: "rgba(239,68,68,0.6)" }]}
          exportFilename="yield_spread.csv"
        />
      )}

      <div className="glass" style={{ padding: "14px 18px", marginTop: 12, marginBottom: 28, fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.7 }}>
        <strong style={{ color: "#00f5ff" }}>Harvey (1988):</strong> An inverted yield curve (2-year exceeding 10-year Treasury) has preceded every U.S. recession since 1969. The spread turning negative signals markets expect lower future rates due to economic slowdown.
      </div>

      <div className="neon-divider" />

      {/* ════════ 2. Cap Rate Model (Gordon Growth Variant) ════════ */}
      <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
        <h3 style={sectionTitle}>Implied Cap Rate Model (Gordon Growth Variant)</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
          Cap Rate = Risk-Free Rate + Risk Premium - Expected Growth. Based on the Gordon Growth / dividend discount framework applied to real estate (Sivitanides et al., 2001).
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 }}>
          {/* Risk-free (read-only from FRED) */}
          <div>
            <p style={labelStyle}>Risk-Free Rate (10Y Treasury)</p>
            <p style={valStyle}>{riskFreeForModel.toFixed(2)}%</p>
            <p style={{ fontSize: "0.68rem", color: "var(--color-text-dim)", marginTop: 2 }}>From FRED (live)</p>
          </div>
          {/* Risk premium slider */}
          <div>
            <p style={labelStyle}>Risk Premium</p>
            <p style={valStyle}>{riskPremium} bp ({(riskPremium / 100).toFixed(2)}%)</p>
            <input type="range" min={100} max={600} step={25} value={riskPremium} onChange={(e) => setRiskPremium(+e.target.value)} style={sliderStyle} />
          </div>
          {/* Growth slider */}
          <div>
            <p style={labelStyle}>Expected Growth</p>
            <p style={valStyle}>{growthExp} bp ({(growthExp / 100).toFixed(2)}%)</p>
            <input type="range" min={0} max={400} step={25} value={growthExp} onChange={(e) => setGrowthExp(+e.target.value)} style={sliderStyle} />
          </div>
        </div>

        <div style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 12, padding: "18px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Implied Cap Rate</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 700, color: "#00f5ff", textShadow: "0 0 20px rgba(0,245,255,0.3)" }}>
            {impliedCapRate.toFixed(2)}%
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: 4 }}>
            {riskFreeForModel.toFixed(2)}% + {(riskPremium / 100).toFixed(2)}% - {(growthExp / 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="neon-divider" />

      {/* ════════ 3. DSCR Stress Test ════════ */}
      <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
        <h3 style={sectionTitle}>DSCR Stress Test</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
          Debt Service Coverage Ratio = NOI / Annual Debt Service. Lenders typically require DSCR above 1.25x. Test how rate shocks impact coverage.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginBottom: 20 }}>
          <div>
            <p style={labelStyle}>Net Operating Income ($)</p>
            <input type="number" value={noi} onChange={(e) => setNoi(+e.target.value)} style={{ ...sliderStyle, width: "100%", height: "auto", padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--color-text)", fontFamily: "var(--font-display)", fontSize: "0.9rem" }} />
          </div>
          <div>
            <p style={labelStyle}>Loan Amount ($)</p>
            <input type="number" value={loanAmt} onChange={(e) => setLoanAmt(+e.target.value)} style={{ ...sliderStyle, width: "100%", height: "auto", padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--color-text)", fontFamily: "var(--font-display)", fontSize: "0.9rem" }} />
          </div>
          <div>
            <p style={labelStyle}>Interest Rate (%)</p>
            <p style={valStyle}>{effectiveRate.toFixed(2)}%</p>
            <input type="range" min={2} max={12} step={0.25} value={intRate} onChange={(e) => setIntRate(+e.target.value)} style={sliderStyle} />
          </div>
          <div>
            <p style={labelStyle}>Amortization (years)</p>
            <p style={valStyle}>{amortYears}</p>
            <input type="range" min={10} max={40} step={5} value={amortYears} onChange={(e) => setAmortYears(+e.target.value)} style={sliderStyle} />
          </div>
        </div>

        {/* Rate shock slider */}
        <div style={{ marginBottom: 20 }}>
          <p style={labelStyle}>Rate Shock Scenario</p>
          <p style={{ ...valStyle, color: rateShock > 0 ? "#f59e0b" : "var(--color-text-dim)" }}>+{rateShock} bp ({rateShock > 0 ? `${intRate.toFixed(2)}% + ${rateShock}% = ${effectiveRate.toFixed(2)}%` : "No shock"})</p>
          <input type="range" min={0} max={3} step={1} value={rateShock} onChange={(e) => setRateShock(+e.target.value)} style={sliderStyle} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--color-text-dim)", marginTop: 2 }}>
            <span>Base</span><span>+100bp</span><span>+200bp</span><span>+300bp</span>
          </div>
        </div>

        {/* DSCR result */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "14px 18px", border: `1px solid ${dscrColor}30` }}>
            <p style={{ ...labelStyle, marginBottom: 4 }}>DSCR</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, color: dscrColor }}>{dscr.toFixed(2)}x</p>
            <p style={{ fontSize: "0.7rem", color: dscrColor, marginTop: 2 }}>{dscrLabel}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "14px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ ...labelStyle, marginBottom: 4 }}>Annual Debt Service</p>
            <p style={valStyle}>${annualDS.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "14px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ ...labelStyle, marginBottom: 4 }}>Monthly Payment</p>
            <p style={valStyle}>${monthlyPayment.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      <div className="neon-divider" />

      {/* ════════ 4. Financial Conditions Heatmap ════════ */}
      <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
        <h3 style={sectionTitle}>Financial Conditions Heatmap</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
          Color-coded snapshot of key rates impacting CRE. Green = favorable, Yellow = neutral, Red = unfavorable.
        </p>

        {loading ? <ChartSkeleton /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {conditions.map((c) => (
              <div key={c.label} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${c.color}30`, textAlign: "center" }}>
                <p style={{ fontSize: "0.68rem", color: "var(--color-text-dim)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>{c.label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, color: c.color }}>
                  {c.value != null ? `${c.value.toFixed(2)}${c.unit}` : "N/A"}
                </p>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, margin: "8px auto 0", boxShadow: `0 0 8px ${c.color}` }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="neon-divider" />

      {/* ════════ 5. Academic References Panel ════════ */}
      <div className="glass" style={{ padding: "16px 20px", marginBottom: 28 }}>
        <button onClick={() => setRefsOpen(!refsOpen)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "100%", padding: 0 }}>
          <BookOpen size={16} color="#a855f7" />
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>Theory &amp; References</span>
          {refsOpen ? <ChevronUp size={14} color="var(--color-text-muted)" /> : <ChevronDown size={14} color="var(--color-text-muted)" />}
        </button>

        {refsOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 14 }}>
            {[
              { cite: "Harvey, C. R. (1988)", title: "The Real Term Structure and Consumption Growth", note: "Demonstrated that an inverted yield curve preceded every U.S. recession since 1969." },
              { cite: "DiPasquale, D. & Wheaton, W. C. (1992)", title: "The Markets for Real Estate Assets and Space: A Conceptual Framework", note: "Four-quadrant model linking property, asset, construction, and space markets." },
              { cite: "Gordon, M. J. (1962)", title: "The Investment, Financing, and Valuation of the Corporation", note: "Dividend discount model foundation for cap rate = risk-free + premium - growth." },
              { cite: "Sivitanides, P. et al. (2001)", title: "Determinants of Appraisal-Based Capitalization Rates", note: "Empirically decomposed cap rates into risk-free rate, risk premium, and growth expectations." },
              { cite: "Mueller, G. R. (1999)", title: "Real Estate Rental Growth Rates at Different Points in the Physical Market Cycle", note: "Identified recurring CRE market cycles and their impact on rental growth forecasts." },
            ].map((r) => (
              <div key={r.cite} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: "2px solid rgba(168,85,247,0.3)" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#a855f7" }}>{r.cite}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text)", fontStyle: "italic" }}>{r.title}</p>
                <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: 2 }}>{r.note}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
