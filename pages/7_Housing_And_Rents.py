from __future__ import annotations

import pandas as pd
import streamlit as st

from helpers import (
    get_zillow_metro_ts, get_zillow_latest_multi,
    fetch_bea_gdp_metro,
    source_badge,
    insight_card, df_download_btn, fig_download_btn,
    load_css, render_sidebar, render_footer,
    BEA_KEY,
)
from charts import line_chart, bar_chart

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>🏘️ Housing & Rent Trends</h1></div>',
            unsafe_allow_html=True)
st.markdown(
    "Zillow research data on home values and observed rents by metro — "
    "key context for multifamily CRE and residential-adjacent investment."
)

TRACKED_METROS = [
    "Raleigh", "Durham", "Charlotte", "Atlanta", "Austin", "Dallas",
    "Houston", "Nashville", "Denver", "Phoenix", "Miami", "Tampa",
    "Orlando", "Las Vegas", "Seattle", "Portland", "San Francisco",
    "Los Angeles", "New York", "Chicago", "Boston", "Washington",
    "Minneapolis", "San Diego", "Indianapolis", "Columbus",
    "Kansas City", "Salt Lake City", "Richmond", "Jacksonville",
]

selected_metros = st.multiselect(
    "Select metros to compare",
    options=TRACKED_METROS,
    default=["Raleigh", "Durham", "Charlotte", "Austin", "Nashville", "Atlanta"],
    key="zillow_metros",
)

if not selected_metros:
    st.info("Select at least one metro above.")
    st.stop()

# ── Section 1: Home Values (ZHVI) ──────────────────────────────────────
st.subheader("Zillow Home Value Index (ZHVI) — Typical Home Value")
st.caption("Smoothed, seasonally adjusted measure of the typical home value for single-family residences and condos.")

col_h1, col_h2 = st.columns([2, 1])

with col_h1:
    fig_data = {}
    for metro in selected_metros[:6]:
        df_ts = get_zillow_metro_ts("zhvi_metro", metro)
        if not df_ts.empty:
            fig_data[metro] = df_ts.set_index("date")["value"]

    if fig_data:
        df_combined = pd.DataFrame(fig_data).reset_index().rename(columns={"index": "date"})
        cols = [c for c in df_combined.columns if c != "date"]
        fig = line_chart(df_combined, "date", cols,
                         "Typical Home Value by Metro ($)", "Home Value ($)")
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "zillow_zhvi_comparison.png")
    else:
        st.info("Zillow data loading... If this persists, check internet connectivity.")

with col_h2:
    df_snap = get_zillow_latest_multi("zhvi_metro", selected_metros)
    if not df_snap.empty:
        df_snap["Latest"] = df_snap["Latest"].apply(lambda x: f"${x:,.0f}" if pd.notna(x) else "N/A")
        df_snap["YoY %"] = df_snap["YoY %"].apply(lambda x: f"{x:+.1f}%" if pd.notna(x) else "N/A")
        st.dataframe(df_snap[["Metro", "Latest", "YoY %"]], use_container_width=True, hide_index=True)
        df_download_btn(df_snap, "zillow_zhvi_snapshot.csv")

source_badge("Zillow Research", "https://www.zillow.com/research/data/")

st.divider()

# ── Section 2: Observed Rents (ZORI) ───────────────────────────────────
st.subheader("Zillow Observed Rent Index (ZORI) — Typical Rent")
st.caption("Smoothed measure of the typical observed market rent across all residential property types.")

col_r1, col_r2 = st.columns([2, 1])

with col_r1:
    fig_data_rent = {}
    for metro in selected_metros[:6]:
        df_ts = get_zillow_metro_ts("zori_metro", metro)
        if not df_ts.empty:
            fig_data_rent[metro] = df_ts.set_index("date")["value"]

    if fig_data_rent:
        df_rent = pd.DataFrame(fig_data_rent).reset_index().rename(columns={"index": "date"})
        cols = [c for c in df_rent.columns if c != "date"]
        fig = line_chart(df_rent, "date", cols,
                         "Typical Observed Rent by Metro ($/mo)", "Rent ($/mo)")
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "zillow_zori_comparison.png")
    else:
        st.info("Rent data loading or unavailable for selected metros.")

with col_r2:
    df_rsnap = get_zillow_latest_multi("zori_metro", selected_metros)
    if not df_rsnap.empty:
        df_rsnap["Latest"] = df_rsnap["Latest"].apply(
            lambda x: f"${x:,.0f}/mo" if pd.notna(x) else "N/A")
        df_rsnap["YoY %"] = df_rsnap["YoY %"].apply(
            lambda x: f"{x:+.1f}%" if pd.notna(x) else "N/A")
        st.dataframe(df_rsnap[["Metro", "Latest", "YoY %"]], use_container_width=True, hide_index=True)
        df_download_btn(df_rsnap, "zillow_zori_snapshot.csv")

source_badge("Zillow Research", "https://www.zillow.com/research/data/")

st.divider()

# ── Section 3: BEA GDP by Metro ────────────────────────────────────────
st.subheader("GDP by Metro Area (BEA)")
if BEA_KEY:
    df_gdp = fetch_bea_gdp_metro()
    if not df_gdp.empty:
        pattern = "|".join(selected_metros)
        df_gdp_filt = df_gdp[df_gdp["Metro"].str.contains(pattern, case=False, na=False)]
        if not df_gdp_filt.empty:
            df_gdp_filt = df_gdp_filt.copy()
            df_gdp_filt["GDP_billions"] = df_gdp_filt["GDP_thousands"] / 1e6
            fig = bar_chart(
                df_gdp_filt[df_gdp_filt["Year"] == df_gdp_filt["Year"].max()].sort_values(
                    "GDP_billions", ascending=True),
                x="GDP_billions", y="Metro",
                title=f"GDP by Metro ({df_gdp_filt['Year'].max()}, $B)",
                orientation="h",
            )
            st.plotly_chart(fig, use_container_width=True)
            source_badge("Bureau of Economic Analysis", "https://www.bea.gov")
        else:
            st.info("No GDP data matched selected metros.")
    else:
        st.info("BEA data unavailable.")
else:
    st.markdown("""
<div class="insight-card">
  <b>💡 Optional Enhancement: BEA API</b>
  <ul style="margin:8px 0 0;padding-left:18px;color:#cbd5e1">
    <li>Add <code>BEA_API_KEY</code> to your <code>.env</code> file for GDP-by-metro data</li>
    <li>Free key: <a href="https://apps.bea.gov/api/signup/" target="_blank" rel="noopener noreferrer" style="color:#60a5fa">apps.bea.gov/api/signup</a></li>
    <li>Enables GDP, personal income, and economic growth comparisons by MSA</li>
  </ul>
</div>""", unsafe_allow_html=True)

st.divider()

# ── Affordability context ──────────────────────────────────────────────
st.subheader("Home Value vs. Rent — Affordability Context")
df_hv_num = get_zillow_latest_multi("zhvi_metro", selected_metros)
df_rv_num = get_zillow_latest_multi("zori_metro", selected_metros)
if not df_hv_num.empty and not df_rv_num.empty:
    merged = df_hv_num.merge(df_rv_num, on="Metro", suffixes=("_home", "_rent"))
    if not merged.empty and "Latest_home" in merged.columns and "Latest_rent" in merged.columns:
        merged["Gross Yield %"] = (merged["Latest_rent"] * 12 / merged["Latest_home"] * 100).round(2)
        merged["Price/Rent Ratio"] = (merged["Latest_home"] / (merged["Latest_rent"] * 12)).round(1)
        merged["Home Value"] = merged["Latest_home"].apply(
            lambda x: f"${x:,.0f}" if pd.notna(x) else "N/A")
        merged["Monthly Rent"] = merged["Latest_rent"].apply(
            lambda x: f"${x:,.0f}" if pd.notna(x) else "N/A")

        col_af1, col_af2 = st.columns(2)
        with col_af1:
            fig = bar_chart(
                merged.sort_values("Gross Yield %", ascending=True),
                x="Gross Yield %", y="Metro",
                title="Gross Rental Yield by Metro (%)",
                orientation="h",
            )
            st.plotly_chart(fig, use_container_width=True)
        with col_af2:
            st.dataframe(
                merged[["Metro", "Home Value", "Monthly Rent", "Gross Yield %", "Price/Rent Ratio"]],
                use_container_width=True, hide_index=True,
            )
            df_download_btn(
                merged[["Metro", "Home Value", "Monthly Rent", "Gross Yield %", "Price/Rent Ratio"]],
                "affordability_comparison.csv",
            )

        st.caption(
            "Gross yield = (Annual Rent / Home Value) × 100. Higher yield = more favorable for rental investors. "
            "Price/Rent ratio above 20 generally indicates a 'rent-favored' market."
        )

st.divider()
insight_card([
    "Zillow ZHVI and ZORI are the most widely used free residential price/rent indices — updated monthly.",
    "Raleigh-Durham's home values grew faster than national average 2020–2024, but rent growth has moderated.",
    "Gross rental yields above 6% signal markets where buy-and-rent strategies pencil more easily.",
    "Markets with high price/rent ratios (>25) often see more renter demand — good for multifamily CRE.",
    "Rising rents + stable home prices = expanding multifamily cap rate compression opportunity.",
])

render_footer()
