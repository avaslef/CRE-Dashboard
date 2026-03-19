from __future__ import annotations

import streamlit as st

from config import MARKET_TIERS, NATIONAL_SERIES
from helpers import (
    fetch_fred_multi,
    api_key_warning, source_badge,
    insight_card, df_download_btn, fig_download_btn,
    load_css, render_sidebar,
    FRED_KEY,
)
from charts import line_chart, box_chart

st.set_page_config(
    page_title="Market Comparisons — CRE Intelligence",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>📊 Market Comparisons</h1></div>', unsafe_allow_html=True)
st.markdown("Side-by-side comparison of any markets across unemployment, labor force, and economic trends.")

import pandas as pd  # noqa: E402

all_markets = []
for tier_name, tier_data in MARKET_TIERS.items():
    for mkt in tier_data["markets"]:
        all_markets.append({
            "name":  mkt["name"],
            "tier":  tier_name,
            "fred":  mkt["fred_unemp"],
            "state": mkt["state"],
        })
df_all = pd.DataFrame(all_markets)

default_sel = ["Raleigh-Durham, NC", "Atlanta, GA", "Austin, TX",
               "Charlotte, NC", "Nashville, TN", "National (U.S.)"]
all_names = df_all["name"].tolist() + ["National (U.S.)"]

selected = st.multiselect(
    "Select markets to compare (2–8 recommended)",
    options=all_names,
    default=[m for m in default_sel if m in all_names],
)

if not selected:
    st.info("Select at least 2 markets above.")
    st.stop()

if not FRED_KEY:
    api_key_warning("FRED API Key")
    st.stop()

series_dict = {}
for name in selected:
    if name == "National (U.S.)":
        series_dict["National (U.S.)"] = NATIONAL_SERIES["national_unemp"]
    else:
        row = df_all[df_all["name"] == name]
        if not row.empty:
            series_dict[name] = row.iloc[0]["fred"]

start_year = st.slider("Start Year", 2005, 2023, 2015, key="comp_start")
start_date = f"{start_year}-01-01"

df_comp = fetch_fred_multi(series_dict, start=start_date)

if df_comp.empty:
    st.warning("No data returned. Check FRED API key and series IDs.")
    st.stop()

df_comp = df_comp.reset_index()

st.subheader("Unemployment Rate Comparison (%)")
cols = [c for c in df_comp.columns if c != "date"]
fig = line_chart(df_comp, "date", cols,
                 "Unemployment Rate — Selected Markets (%)", "Rate (%)")
st.plotly_chart(fig, use_container_width=True)
fig_download_btn(fig, "market_comparison_unemp.png")

st.divider()

st.subheader("Current Snapshot — Latest Available Values")
snap_rows = []
for col in cols:
    series = df_comp[col].dropna()
    yoy = ((series.iloc[-1] - series.iloc[-13]) / series.iloc[-13] * 100) if len(series) >= 13 else None
    snap_rows.append({
        "Market":           col,
        "Latest Value (%)": round(series.iloc[-1], 2) if not series.empty else None,
        "YoY Change (pp)":  round(yoy, 2) if yoy is not None else None,
        "Min (period)":     round(series.min(), 2) if not series.empty else None,
        "Max (period)":     round(series.max(), 2) if not series.empty else None,
    })
df_snap = pd.DataFrame(snap_rows)
st.dataframe(df_snap, use_container_width=True, hide_index=True)
df_download_btn(df_snap, "comparison_snapshot.csv")

st.divider()

st.subheader("Unemployment Distribution (Box Plot)")
df_long = df_comp.melt(id_vars="date", var_name="Market", value_name="Unemployment (%)")
df_long = df_long.dropna(subset=["Unemployment (%)"])
fig_box = box_chart(df_long, "Market", "Unemployment (%)", "Market",
                    "Distribution of Unemployment Rates")
fig_box.update_xaxes(tickangle=-30)
st.plotly_chart(fig_box, use_container_width=True)
fig_download_btn(fig_box, "unemp_box_comparison.png")
source_badge("FRED — Metro Area Unemployment", "https://fred.stlouisfed.org")

st.divider()
insight_card([
    "Markets with consistently lower unemployment command lower cap rates — investors accept less yield for stability.",
    "Raleigh-Durham's unemployment trajectory mirrors Austin's — both benefit from tech/life-sciences job growth.",
    "Year-over-year changes in unemployment are a leading indicator of CRE demand shifts (positive = tightening market).",
])

st.divider()
st.markdown("""
<div style="text-align:center;padding:8px 0;color:#475569;font-size:0.78em">
  CRE Intelligence Dashboard &nbsp;·&nbsp; Data: FRED, U.S. Census, NewsAPI &nbsp;·&nbsp;
  Built with Streamlit + Plotly &nbsp;·&nbsp; Alexander Vaslef
</div>""", unsafe_allow_html=True)
