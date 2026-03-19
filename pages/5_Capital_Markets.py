from __future__ import annotations

import streamlit as st

from config import GLOSSARY
from helpers import (
    fetch_fred_series, fetch_fred_latest, fetch_fred_multi, fetch_reit_etf,
    api_key_warning, source_badge, render_glossary_expander,
    metric_card, insight_card, fig_download_btn,
    load_css, render_sidebar, render_footer,
    FRED_KEY,
)
from charts import line_chart, area_chart

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>💰 Capital Markets</h1></div>', unsafe_allow_html=True)
st.markdown("CRE lending conditions, credit stress indicators, and capital flows that drive deal activity.")

render_glossary_expander(["Cap Rate", "LTV", "DSCR", "NOI"], GLOSSARY)

if not FRED_KEY:
    api_key_warning("FRED API Key")
    st.stop()

start_year = st.slider("Start Year", 2005, 2023, 2015, key="cap_start")
start_date = f"{start_year}-01-01"

# ── KPI gauges ──────────────────────────────────────────────────────────
col1, col2, col3, col4 = st.columns(4)
fed    = fetch_fred_latest("FEDFUNDS")
t10    = fetch_fred_latest("DGS10")
spread = fetch_fred_latest("T10Y2Y")
delin  = fetch_fred_latest("DRCLACBS")

with col1:
    metric_card("Fed Funds Rate", f"{fed:.2f}%" if fed else "N/A", "FOMC target rate", "🏦")
with col2:
    metric_card("10-Yr Treasury", f"{t10:.2f}%" if t10 else "N/A", "CRE cap rate benchmark", "📊")
with col3:
    spread_color = "🟢" if spread and spread > 0 else "🔴"
    metric_card("Yield Curve Spread", f"{spread:.2f}%" if spread else "N/A",
                f"{spread_color} {'Normal' if spread and spread > 0 else 'Inverted — recession signal'}", "📉")
with col4:
    metric_card("CRE Delinquency Rate", f"{delin:.2f}%" if delin else "N/A",
                "All commercial banks", "⚠️")

st.divider()

col_a, col_b = st.columns(2)

with col_a:
    st.subheader("Yield Curve Spread (10Y - 2Y Treasury)")
    df = fetch_fred_series("T10Y2Y", start=start_date)
    if not df.empty:
        fig = line_chart(df, "date", "value", "Yield Curve Spread (%)", "Spread (%)")
        fig.add_hrect(y0=-3, y1=0, fillcolor="rgba(248,113,113,0.04)", line_width=0)
        fig.add_annotation(x=0.98, xref="paper", xanchor="right", y=-2.5,
                           text="⚠ Inverted = Recession Signal",
                           showarrow=False, font=dict(color="#f87171", size=9),
                           bgcolor="rgba(11,15,25,0.9)", borderpad=4,
                           bordercolor="rgba(248,113,113,0.25)", borderwidth=1)
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "yield_curve_spread.png")
        source_badge("FRED T10Y2Y", "https://fred.stlouisfed.org/series/T10Y2Y")

with col_b:
    st.subheader("CRE Loan Delinquency Rate")
    df = fetch_fred_series("DRCLACBS", start=start_date)
    if not df.empty:
        fig = area_chart(df, "date", ["value"], "CRE Loan Delinquency Rate (%)", "Rate (%)")
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "cre_delinquency.png")
        source_badge("FRED DRCLACBS", "https://fred.stlouisfed.org/series/DRCLACBS")

st.divider()

col_c, col_d = st.columns(2)

with col_c:
    st.subheader("Commercial Bank Real Estate Loans Outstanding")
    df = fetch_fred_series("RHEACBW027SBOG", start=start_date)
    if not df.empty:
        fig = area_chart(df, "date", ["value"],
                         "RE Loans at Commercial Banks ($B)", "$Billions")
        st.plotly_chart(fig, use_container_width=True)
        source_badge("FRED RHEACBW027SBOG", "https://fred.stlouisfed.org/series/RHEACBW027SBOG")

with col_d:
    st.subheader("Rate Stack — Fed Funds vs. 10Y vs. 30Y Mortgage")
    df_rates = fetch_fred_multi({
        "Fed Funds":      "FEDFUNDS",
        "10-Yr Treasury": "DGS10",
        "30-Yr Mortgage": "MORTGAGE30US",
    }, start=start_date)
    if not df_rates.empty:
        df_rates = df_rates.reset_index()
        cols = [c for c in df_rates.columns if c != "date"]
        fig = line_chart(df_rates, "date", cols, "Key Interest Rates (%)", "Rate (%)",
                         color_map={
                             "Fed Funds":      "#f87171",
                             "10-Yr Treasury": "#60a5fa",
                             "30-Yr Mortgage": "#fbbf24",
                         })
        st.plotly_chart(fig, use_container_width=True)

st.divider()

col_e, col_f = st.columns(2)

with col_e:
    st.subheader("BBB Corporate Bond Spread (CMBS Proxy)")
    df = fetch_fred_series("BAMLC0A4CBBB", start=start_date)
    if not df.empty:
        fig = line_chart(df, "date", "value",
                         "BBB Option-Adjusted Spread (%)", "Spread (%)")
        st.plotly_chart(fig, use_container_width=True)
        st.caption("BBB corporate spreads proxy CMBS spreads. Widening = risk aversion, tighter CRE financing.")
        source_badge("FRED BAMLC0A4CBBB", "https://fred.stlouisfed.org/series/BAMLC0A4CBBB")

with col_f:
    st.subheader("Non-Residential Construction Spending")
    df = fetch_fred_series("TLNRESCONS", start=start_date)
    if not df.empty:
        fig = area_chart(df, "date", ["value"], "Construction Spending ($M)", "$Millions")
        st.plotly_chart(fig, use_container_width=True)
        source_badge("FRED TLNRESCONS", "https://fred.stlouisfed.org/series/TLNRESCONS")

st.divider()

st.subheader("REIT Market Sentiment — ETF Proxies")
col_r1, col_r2 = st.columns(2)
with col_r1:
    df_vnq = fetch_reit_etf("VNQ", "5y")
    if not df_vnq.empty:
        fig = line_chart(df_vnq, "date", "VNQ", "VNQ — Vanguard Real Estate ETF", "Price ($)")
        st.plotly_chart(fig, use_container_width=True)
with col_r2:
    df_xlre = fetch_reit_etf("XLRE", "5y")
    if not df_xlre.empty:
        fig = line_chart(df_xlre, "date", "XLRE", "XLRE — Real Estate Select Sector SPDR", "Price ($)")
        st.plotly_chart(fig, use_container_width=True)

st.divider()
insight_card([
    "An inverted yield curve (negative spread) has preceded every U.S. recession since 1970 — watch the T10Y2Y closely.",
    "CRE delinquency spikes lag the economic cycle by ~12–18 months; 2024–2025 will reveal post-rate-hike credit stress.",
    "When BBB spreads widen past 200 bps, CMBS issuance effectively freezes — distressed CRE opportunities emerge.",
    "Bank CRE loans outstanding at record levels create systemic risk if asset values correct >20%.",
    "The Fed's next move (cut or hold) will determine whether CRE transaction volume recovers in 2025–2026.",
])

render_footer()
