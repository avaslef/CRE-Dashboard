from __future__ import annotations

import streamlit as st

from config import MARKET_TIERS, NATIONAL_SERIES, COLORS, GLOSSARY
from helpers import (
    fetch_fred_series, fetch_fred_latest, fetch_fred_multi,
    api_key_warning, source_badge, render_glossary_expander,
    metric_card, insight_card, tier_badge, fig_download_btn,
    load_css, render_sidebar,
    FRED_KEY,
)
from charts import line_chart, bar_chart

st.set_page_config(
    page_title="Overview — CRE Intelligence",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded",
)

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>🏢 CRE Market Overview</h1></div>', unsafe_allow_html=True)
st.markdown("National commercial real estate snapshot — macro conditions, market tiers, and key indicators.")

if not FRED_KEY:
    api_key_warning("FRED API Key")

# ── Row 1: macro KPIs ─────────────────────────────────────────────────────
col1, col2, col3, col4, col5 = st.columns(5)

fed_rate   = fetch_fred_latest(NATIONAL_SERIES["fed_funds_rate"])
nat_unemp  = fetch_fred_latest(NATIONAL_SERIES["national_unemp"])
t10        = fetch_fred_latest(NATIONAL_SERIES["treasury_10yr"])
cre_price  = fetch_fred_latest(NATIONAL_SERIES["cre_price_index"])
mortgage   = fetch_fred_latest(NATIONAL_SERIES["mortgage_30yr"])

with col1:
    metric_card("Fed Funds Rate", f"{fed_rate:.2f}%" if fed_rate else "N/A",
                "Target rate set by FOMC", "🏦")
with col2:
    metric_card("National Unemployment", f"{nat_unemp:.1f}%" if nat_unemp else "N/A",
                "U-3 rate, seasonally adjusted", "👷")
with col3:
    metric_card("10-Yr Treasury", f"{t10:.2f}%" if t10 else "N/A",
                "Key CRE cap rate benchmark", "📊")
with col4:
    metric_card("CRE Price Index", f"{cre_price:.1f}" if cre_price else "N/A",
                "FRED COMREPUSQ159N", "🏗️")
with col5:
    metric_card("30-Yr Mortgage", f"{mortgage:.2f}%" if mortgage else "N/A",
                "National average", "🏠")

st.divider()

# ── Row 2: charts ─────────────────────────────────────────────────────────
col_a, col_b = st.columns(2)

with col_a:
    st.subheader("CRE Price Index (National)")
    df_cre = fetch_fred_series(NATIONAL_SERIES["cre_price_index"])
    if not df_cre.empty:
        fig = line_chart(df_cre, "date", "value",
                         "Commercial Real Estate Price Index", "Index Level")
        fig.add_vline(x="2020-03-01", line_dash="dot", line_color="rgba(248,113,113,0.5)", line_width=1)
        fig.add_annotation(x="2020-03-01", y=1.08, yref="paper", text="COVID-19",
                           showarrow=False, font=dict(color="#f87171", size=9),
                           bgcolor="rgba(11,15,25,0.85)", borderpad=3,
                           bordercolor="rgba(248,113,113,0.3)", borderwidth=1)
        fig.add_vline(x="2022-03-01", line_dash="dot", line_color="rgba(251,191,36,0.5)", line_width=1)
        fig.add_annotation(x="2022-03-01", y=1.08, yref="paper", text="Rate Hikes",
                           showarrow=False, font=dict(color="#fbbf24", size=9),
                           bgcolor="rgba(11,15,25,0.85)", borderpad=3,
                           bordercolor="rgba(251,191,36,0.3)", borderwidth=1)
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "cre_price_index.png")
        source_badge("FRED COMREPUSQ159N", "https://fred.stlouisfed.org/series/COMREPUSQ159N")
    else:
        st.info("Add FRED API key to load CRE price index.")

with col_b:
    st.subheader("Fed Funds Rate & 10-Yr Treasury")
    df_rates = fetch_fred_multi({
        "Fed Funds Rate": NATIONAL_SERIES["fed_funds_rate"],
        "10-Yr Treasury": NATIONAL_SERIES["treasury_10yr"],
        "30-Yr Mortgage": NATIONAL_SERIES["mortgage_30yr"],
    })
    if not df_rates.empty:
        df_rates = df_rates.reset_index()
        cols = [c for c in df_rates.columns if c != "date"]
        fig = line_chart(df_rates, "date", cols, "Interest Rate Environment (%)", "Rate (%)",
                         color_map={
                             "Fed Funds Rate": COLORS["danger"],
                             "10-Yr Treasury": COLORS["secondary"],
                             "30-Yr Mortgage": COLORS["warning"],
                         })
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "interest_rates.png")
        source_badge("FRED", "https://fred.stlouisfed.org")
    else:
        st.info("Add FRED API key to load interest rate data.")

st.divider()

# ── Row 3: market tier summary cards ──────────────────────────────────────
st.subheader("Market Tier Summary")
for tier_name, tier_data in MARKET_TIERS.items():
    with st.expander(f"{tier_badge(tier_name)}  **{tier_name}** — {len(tier_data['markets'])} markets",
                     expanded=(tier_name == "Tier 2 / Emerging")):
        cols = st.columns(min(4, len(tier_data["markets"])))
        for i, mkt in enumerate(tier_data["markets"]):
            with cols[i % 4]:
                unemp = fetch_fred_latest(mkt["fred_unemp"]) if FRED_KEY else None
                star  = " ⭐" if mkt.get("highlight") else ""
                uval  = f"{unemp:.1f}%" if unemp else "—"
                st.markdown(f"""
<div class="metric-card" style="min-height:90px">
  <h3>{mkt['name']}{star}</h3>
  <p class="value" style="font-size:1.3em">{uval}</p>
  <p class="delta">Unemployment rate</p>
</div>""", unsafe_allow_html=True)

st.divider()
insight_card([
    "Rising interest rates since 2022 have compressed CRE valuations across all property types.",
    "Gateway markets face steeper office vacancy headwinds; Tier 2/Emerging markets show more resilience.",
    "The Triangle NC (Raleigh-Durham) stands out with below-average unemployment and sustained population inflows.",
    "Cap rate expansion has been uneven — industrial and multifamily remain most attractive vs. office.",
])

st.divider()
st.markdown("""
<div style="text-align:center;padding:8px 0;color:#475569;font-size:0.78em">
  CRE Intelligence Dashboard &nbsp;·&nbsp; Data: FRED, U.S. Census, NewsAPI &nbsp;·&nbsp;
  Built with Streamlit + Plotly &nbsp;·&nbsp; Alexander Vaslef
</div>""", unsafe_allow_html=True)
