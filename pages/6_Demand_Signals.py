from __future__ import annotations

import streamlit as st

from helpers import (
    fetch_google_trends,
    source_badge,
    insight_card, fig_download_btn,
    load_css, render_sidebar, render_footer,
)
from charts import line_chart

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>🔍 Demand Signals — Google Trends</h1></div>',
            unsafe_allow_html=True)
st.markdown(
    "Real-time search-volume data as an alternative demand proxy for CRE asset types and markets. "
    "Higher search interest = rising tenant / investor demand."
)

try:
    from pytrends.request import TrendReq  # noqa: F401
    _HAS_PYTRENDS = True
except ImportError:
    _HAS_PYTRENDS = False

if not _HAS_PYTRENDS:
    st.warning("Install `pytrends` for Google Trends data: `pip install pytrends`")
    st.info("Google Trends provides free, real-time search interest data — no API key needed.")
    st.stop()

# ── Section 1: CRE Asset Type Demand ───────────────────────────────────
st.subheader("CRE Asset Type Search Demand (National)")
st.caption("Google search interest (0–100 scale) for major CRE property types over 5 years.")

col_preset, col_tf = st.columns([3, 1])
with col_preset:
    asset_keywords = st.multiselect(
        "Select CRE search terms",
        options=["office space for rent", "warehouse for lease", "retail space for rent",
                 "industrial space for lease", "multifamily investment",
                 "data center lease", "lab space for rent", "coworking space",
                 "self storage investment", "medical office lease"],
        default=["office space for rent", "warehouse for lease",
                 "retail space for rent", "multifamily investment"],
        key="demand_assets",
    )
with col_tf:
    timeframe = st.selectbox("Timeframe", ["today 5-y", "today 3-y", "today 12-m"],
                             index=0, key="demand_tf")

if asset_keywords:
    kws = asset_keywords[:5]
    with st.spinner("Fetching Google Trends data..."):
        df = fetch_google_trends(kws, timeframe=timeframe)
    if not df.empty:
        fig = line_chart(df, "date", kws,
                         "Google Search Interest — CRE Asset Types", "Interest (0–100)")
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "demand_signals_assets.png")
        source_badge("Google Trends", "https://trends.google.com")
    else:
        st.info("No trend data returned. Google may be rate-limiting — try again in a moment.")

st.divider()

# ── Section 2: Market-Specific Demand ──────────────────────────────────
st.subheader("Market-Specific CRE Demand")
st.caption("Compare search interest for a CRE term across different geographic markets.")

col_term, col_mkts = st.columns([1, 2])
with col_term:
    base_term = st.selectbox("CRE search term",
                             ["office space", "warehouse lease", "apartment",
                              "commercial real estate", "industrial space"],
                             key="demand_term")
with col_mkts:
    markets = st.multiselect(
        "Markets to compare",
        options=["Raleigh", "Austin", "Nashville", "Charlotte", "Atlanta",
                 "Denver", "Miami", "Phoenix", "Dallas", "Seattle", "Boston", "Chicago"],
        default=["Raleigh", "Austin", "Nashville", "Charlotte"],
        key="demand_mkts",
    )

if markets:
    geo_keywords = [f"{base_term} {m}" for m in markets[:5]]
    with st.spinner("Fetching market comparison..."):
        df = fetch_google_trends(geo_keywords, timeframe=timeframe)
    if not df.empty:
        fig = line_chart(df, "date", geo_keywords,
                         f"Search Interest: '{base_term}' by Market", "Interest (0–100)")
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "demand_signals_markets.png")
    else:
        st.info("No trend data returned.")

st.divider()

# ── Section 3: Triangle NC Deep Demand ─────────────────────────────────
st.subheader("🔺 Triangle NC — Granular Demand Signals")
triangle_terms = [
    "office space Raleigh", "warehouse Raleigh", "apartment Raleigh",
    "lab space Durham", "commercial real estate Triangle"
]
with st.spinner("Fetching Triangle NC trends..."):
    df_tri = fetch_google_trends(triangle_terms, timeframe="today 5-y")
if not df_tri.empty:
    fig = line_chart(df_tri, "date", triangle_terms,
                     "Triangle NC — CRE Search Demand", "Interest (0–100)")
    st.plotly_chart(fig, use_container_width=True)
    fig_download_btn(fig, "demand_triangle.png")
else:
    st.info("No Triangle trend data returned.")

st.divider()
insight_card([
    "Google search volume for 'warehouse for lease' surged post-2020, reflecting the e-commerce logistics boom.",
    "'Office space for rent' searches declined sharply during COVID and have not fully recovered — a structural shift.",
    "Markets where CRE search volume is rising fastest often see rent growth 6–12 months later.",
    "Raleigh/Durham 'lab space' searches have grown significantly, driven by life-sciences expansion from RTP.",
    "Comparing search interest across markets is a quick, free way to gauge relative tenant demand.",
])

render_footer()
