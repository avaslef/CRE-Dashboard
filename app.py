# app.py — CRE Dashboard entry point
# ====================================
# Run:  streamlit run app.py
# Requires:  .env file with FRED_API_KEY, CENSUS_API_KEY, NEWS_API_KEY
# ====================================
from __future__ import annotations

import streamlit as st

from helpers import load_css, render_sidebar

# ── PAGE CONFIG ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="CRE Intelligence Dashboard",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded",
)

load_css()
render_sidebar()

# ── LANDING ───────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>🏢 CRE Intelligence Dashboard</h1></div>',
            unsafe_allow_html=True)
st.markdown(
    "Welcome to the **Commercial Real Estate Intelligence Platform**. "
    "Use the sidebar to navigate between pages."
)

st.info(
    "👈 Select a page from the sidebar to get started — "
    "**Overview** is a good first stop.",
    icon="🗺️",
)

st.markdown("""
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px">
  <div class="metric-card" style="min-height:80px">
    <h3>🏠 Overview</h3>
    <p class="delta">National KPIs, interest rates, market tier summary</p>
  </div>
  <div class="metric-card" style="min-height:80px">
    <h3>📈 Macro Trends</h3>
    <p class="delta">CRE price index, GDP, inflation, REIT sentiment</p>
  </div>
  <div class="metric-card" style="min-height:80px">
    <h3>🔺 Triangle NC</h3>
    <p class="delta">Raleigh-Durham deep dive — demographics, labor, news</p>
  </div>
  <div class="metric-card" style="min-height:80px">
    <h3>💰 Capital Markets</h3>
    <p class="delta">Yield curve, delinquency, lending standards, REITs</p>
  </div>
  <div class="metric-card" style="min-height:80px">
    <h3>🏘️ Housing &amp; Rents</h3>
    <p class="delta">Zillow ZHVI/ZORI, gross yields, BEA GDP by metro</p>
  </div>
  <div class="metric-card" style="min-height:80px">
    <h3>🗺️ Interactive Map</h3>
    <p class="delta">Geographic market tier map with unemployment overlays</p>
  </div>
</div>
""", unsafe_allow_html=True)

st.divider()
st.markdown("""
<div style="text-align:center;padding:8px 0;color:#475569;font-size:0.78em">
  CRE Intelligence Dashboard &nbsp;·&nbsp; Data: FRED, U.S. Census, NewsAPI &nbsp;·&nbsp;
  Built with Streamlit + Plotly &nbsp;·&nbsp; Alexander Vaslef
</div>""", unsafe_allow_html=True)
