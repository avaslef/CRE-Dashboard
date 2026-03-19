from __future__ import annotations

import pandas as pd
import streamlit as st

from config import MARKET_TIERS, COLORS, GLOSSARY
from helpers import (
    fetch_fred_latest, fetch_fred_multi,
    api_key_warning, source_badge, render_glossary_expander,
    metric_card, insight_card, tier_badge, df_download_btn, fig_download_btn,
    load_css, render_sidebar, render_footer,
    FRED_KEY,
)
from charts import line_chart, bar_chart

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>🗂️ Market Tiers</h1></div>', unsafe_allow_html=True)
st.markdown("Full breakdown of all tracked U.S. markets by tier with key economic proxies.")

render_glossary_expander(["Gateway Market", "Tier 1 Market", "Tier 2 / Emerging", "MSA"], GLOSSARY)

# Build unified market table
rows = []
for tier_name, tier_data in MARKET_TIERS.items():
    for mkt in tier_data["markets"]:
        unemp = fetch_fred_latest(mkt["fred_unemp"]) if FRED_KEY else None
        rows.append({
            "Tier":      tier_name,
            "Market":    mkt["name"],
            "State":     mkt["state"],
            "MSA":       mkt["msa"],
            "Unemp (%)": round(unemp, 1) if unemp else None,
            "Highlight": "⭐ Triangle Focus" if mkt.get("highlight") else "",
        })

df_all = pd.DataFrame(rows)

col_f1, col_f2 = st.columns([2, 3])
with col_f1:
    sel_tier = st.multiselect("Filter by Tier",
                              options=list(MARKET_TIERS.keys()),
                              default=list(MARKET_TIERS.keys()))
with col_f2:
    sort_col = st.selectbox("Sort by", ["Tier", "Market", "Unemp (%)"])

df_filtered = df_all[df_all["Tier"].isin(sel_tier)].sort_values(sort_col, na_position="last")

st.dataframe(
    df_filtered[["Tier", "Market", "State", "Unemp (%)", "Highlight"]],
    use_container_width=True,
    hide_index=True,
)
df_download_btn(df_filtered, "market_tiers.csv")

st.divider()

df_chart = df_filtered.dropna(subset=["Unemp (%)"])
if not df_chart.empty:
    tier_colors = {
        "Gateway":           COLORS["gateway"],
        "Tier 1":            COLORS["tier1"],
        "Tier 2 / Emerging": COLORS["tier2"],
    }
    fig = bar_chart(
        df_chart.sort_values("Unemp (%)"),
        x="Market", y="Unemp (%)",
        title="Current Unemployment Rate by Market",
        color="Tier", color_discrete_map=tier_colors,
    )
    fig.update_xaxes(tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)
    fig_download_btn(fig, "unemp_by_market.png")
    source_badge("FRED — Metro Area Unemployment", "https://fred.stlouisfed.org")
else:
    st.info("Configure FRED API key to populate unemployment data.")

st.divider()

st.subheader("Unemployment Trends — Selected Markets")
tab_gw, tab_t1, tab_t2 = st.tabs(["Gateway", "Tier 1", "Tier 2 / Emerging"])


def _trend_tab(tier_name):
    markets = MARKET_TIERS[tier_name]["markets"]
    sel = st.multiselect(
        "Select markets to plot",
        [m["name"] for m in markets],
        default=[m["name"] for m in markets[:4]],
        key=f"trend_{tier_name}",
    )
    series_dict = {m["name"]: m["fred_unemp"] for m in markets if m["name"] in sel}
    if series_dict and FRED_KEY:
        df_trend = fetch_fred_multi(series_dict)
        if not df_trend.empty:
            df_trend = df_trend.reset_index()
            cols = [c for c in df_trend.columns if c != "date"]
            fig = line_chart(df_trend, "date", cols,
                             f"{tier_name} Unemployment Trends", "Rate (%)")
            st.plotly_chart(fig, use_container_width=True)
            fig_download_btn(fig, f"trend_{tier_name.replace('/', '-')}.png")
    elif not FRED_KEY:
        api_key_warning("FRED API Key")


with tab_gw: _trend_tab("Gateway")
with tab_t1: _trend_tab("Tier 1")
with tab_t2: _trend_tab("Tier 2 / Emerging")

render_footer()
