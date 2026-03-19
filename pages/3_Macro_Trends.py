from __future__ import annotations

import streamlit as st

from config import NATIONAL_SERIES, COLORS, GLOSSARY
from helpers import (
    fetch_fred_series, fetch_fred_multi, fetch_reit_etf,
    api_key_warning, source_badge, render_glossary_expander,
    insight_card, fig_download_btn,
    load_css, render_sidebar, render_footer,
    FRED_KEY,
)
from charts import line_chart, bar_chart, area_chart

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>📈 Macro Trends</h1></div>', unsafe_allow_html=True)
st.markdown("National macroeconomic indicators that drive CRE valuations, cap rates, and deal flow.")

render_glossary_expander(["Cap Rate", "NOI", "LTV", "DSCR"], GLOSSARY)

if not FRED_KEY:
    api_key_warning("FRED API Key")
    st.stop()

col_d1, _ = st.columns(2)
with col_d1:
    start_year = st.slider("Start Year", 2000, 2023, 2015)
start_date = f"{start_year}-01-01"

col1, col2 = st.columns(2)

with col1:
    st.subheader("National CRE Price Index")
    df = fetch_fred_series(NATIONAL_SERIES["cre_price_index"], start=start_date)
    if not df.empty:
        fig = area_chart(df, "date", ["value"], "CRE Price Index", "Index Level")
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "cre_price_national.png")
        source_badge("FRED COMREPUSQ159N", "https://fred.stlouisfed.org/series/COMREPUSQ159N")

with col2:
    st.subheader("Federal Funds Rate (FOMC Target)")
    df = fetch_fred_series(NATIONAL_SERIES["fed_funds_rate"], start=start_date)
    if not df.empty:
        fig = line_chart(df, "date", "value", "Fed Funds Rate (%)", "Rate (%)")
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "fed_funds.png")
        source_badge("FRED FEDFUNDS", "https://fred.stlouisfed.org/series/FEDFUNDS")

st.divider()

col3, col4 = st.columns(2)

with col3:
    st.subheader("National Unemployment Rate")
    df = fetch_fred_series(NATIONAL_SERIES["national_unemp"], start=start_date)
    if not df.empty:
        fig = line_chart(df, "date", "value", "U.S. Unemployment Rate (%)", "Rate (%)")
        fig.add_hrect(y0=3, y1=5, fillcolor="rgba(52,211,153,0.06)", line_width=0)
        fig.add_annotation(x=0.98, xref="paper", xanchor="right", y=4.8, text="Full Employment Zone",
                           showarrow=False, font=dict(color="#34d399", size=9),
                           bgcolor="rgba(11,15,25,0.85)", borderpad=3)
        st.plotly_chart(fig, use_container_width=True)

with col4:
    st.subheader("Consumer Price Index (YoY Inflation Proxy)")
    df = fetch_fred_series(NATIONAL_SERIES["cpi"], start=start_date)
    if not df.empty:
        df["yoy_pct"] = df["value"].pct_change(periods=12) * 100
        df = df.dropna(subset=["yoy_pct"])
        fig = line_chart(df, "date", "yoy_pct", "CPI Year-over-Year Change (%)", "YoY %")
        fig.add_hrect(y0=0, y1=2, fillcolor="rgba(52,211,153,0.06)", line_width=0)
        fig.add_annotation(x=0.98, xref="paper", xanchor="right", y=1.8, text="Fed 2% Target",
                           showarrow=False, font=dict(color="#34d399", size=9),
                           bgcolor="rgba(11,15,25,0.85)", borderpad=3)
        st.plotly_chart(fig, use_container_width=True)
        source_badge("FRED CPIAUCSL", "https://fred.stlouisfed.org/series/CPIAUCSL")

st.divider()

col5, col6 = st.columns(2)

with col5:
    st.subheader("Real GDP Growth Rate")
    df = fetch_fred_series(NATIONAL_SERIES["gdp_growth"], start=start_date)
    if not df.empty:
        fig = bar_chart(df, "date", "value", "Real GDP Growth (Quarterly, %)")
        fig.update_traces(marker_color=[
            COLORS["accent"] if v >= 0 else COLORS["danger"]
            for v in df["value"]
        ])
        st.plotly_chart(fig, use_container_width=True)

with col6:
    st.subheader("Non-Residential Construction Spending")
    df = fetch_fred_series(NATIONAL_SERIES["construction_spend"], start=start_date)
    if not df.empty:
        fig = area_chart(df, "date", ["value"],
                         "Non-Residential Construction ($M)", "$M")
        st.plotly_chart(fig, use_container_width=True)
        source_badge("FRED TLNRESCONS", "https://fred.stlouisfed.org/series/TLNRESCONS")

st.divider()

st.subheader("REIT Market Sentiment (VNQ ETF Price)")
df_vnq = fetch_reit_etf("VNQ")
if not df_vnq.empty:
    fig = line_chart(df_vnq, "date", "VNQ",
                     "Vanguard Real Estate ETF (VNQ) — CRE Sentiment Proxy", "Price ($)")
    st.plotly_chart(fig, use_container_width=True)
    st.caption("VNQ tracks publicly traded REITs; used as a liquid market sentiment proxy for CRE.")
    fig_download_btn(fig, "vnq_reit.png")
else:
    st.info("Install `yfinance` for REIT proxy data: `pip install yfinance`")

st.divider()
insight_card([
    "Rate hikes from 2022–2023 pushed cap rates up ~150-200 bps, compressing asset values significantly.",
    "GDP growth above 2% generally supports CRE demand; watch for stagflation signals.",
    "Construction spending trends ahead of occupancy — a leading indicator for supply pipeline pressure.",
    "When 10-Yr Treasury exceeds prevailing cap rates, equity CRE returns vs. risk-free assets compress.",
])

render_footer()
