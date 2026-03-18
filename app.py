# app.py — CRE Dashboard (Commercial Real Estate Intelligence Platform)
# ======================================================================
# Run:  streamlit run app.py
# Requires:  .env file with FRED_API_KEY, CENSUS_API_KEY, NEWS_API_KEY
# ======================================================================

from __future__ import annotations

import os
import io
import base64
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from datetime import datetime

# ── Local modules ─────────────────────────────────────────────────────────────
from config import (
    MARKET_TIERS, NATIONAL_SERIES, TRIANGLE_SERIES,
    TRIANGLE_COUNTIES, GLOSSARY, COLORS, PLOTLY_TEMPLATE,
    NAICS_REAL_ESTATE, DURHAM_FRED_UNEMP,
)
from helpers import (
    fetch_fred_series, fetch_fred_latest, fetch_fred_multi,
    fetch_census_population, fetch_census_cbp, fetch_census_median_income,
    fetch_news, fetch_reit_etf,
    fetch_google_trends, fetch_google_trends_by_region,
    get_zillow_metro_ts, get_zillow_latest_multi,
    fetch_bea_gdp_metro, fetch_bea_personal_income_metro,
    format_number, last_updated_badge, api_key_warning,
    render_glossary_expander, source_badge, news_card,
    FRED_KEY, CENSUS_KEY, NEWS_KEY,
    BEA_KEY,
)
from charts import (
    line_chart, bar_chart, scatter_chart, area_chart,
    gauge_chart, waterfall_chart, heatmap_chart,
)

# ── PAGE CONFIG ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="CRE Intelligence Dashboard",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CUSTOM CSS — polished dark theme ──────────────────────────────────────────
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── UNC Chapel Hill Color Tokens ─────────────────────────────────────── */
  :root {
    --unc-blue: #4B9CD3;
    --unc-navy: #13294B;
    --unc-light: #7BAFD4;
    --unc-white: #FFFFFF;
    --bg-primary: #0b0f19;
    --bg-card: #111827;
    --bg-card-end: #1a2640;
    --border-subtle: rgba(75,156,211,0.15);
    --border-hover: rgba(75,156,211,0.4);
    --text-primary: #f1f5f9;
    --text-secondary: #4B9CD3;
    --text-muted: #7BAFD4;
    --text-dim: #64748b;
  }

  /* ── Base ──────────────────────────────────────────────────────────────── */
  html, body, [class*="css"]  { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  .main { background: var(--bg-primary); }
  section[data-testid="stSidebar"] { background: #0c1021; border-right: 1px solid #1a2540; }
  section[data-testid="stSidebar"] .stRadio label { font-size: 0.88rem; padding: 6px 0; }

  /* ── Metric cards ─────────────────────────────────────────────────────── */
  .metric-card {
    background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-end) 100%);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 20px 22px;
    margin-bottom: 10px;
    transition: border-color 0.2s, box-shadow 0.2s;
    min-height: 120px;
  }
  .metric-card:hover {
    border-color: var(--border-hover);
    box-shadow: 0 4px 24px rgba(75,156,211,0.1);
  }
  .metric-card h3 {
    margin: 0 0 8px; font-size: 0.72em; font-weight: 600;
    color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1.2px;
  }
  .metric-card .value {
    font-size: 1.7em; font-weight: 700; color: var(--text-primary);
    margin: 0; line-height: 1.2; letter-spacing: -0.02em;
  }
  .metric-card .delta {
    font-size: 0.76em; margin-top: 6px; color: #94a3b8;
    line-height: 1.4;
  }

  /* ── Section headers ──────────────────────────────────────────────────── */
  .section-header {
    border-left: 3px solid var(--unc-blue);
    padding-left: 14px;
    margin: 28px 0 18px;
  }
  .section-header h1 {
    font-size: 1.6rem !important; font-weight: 700; color: var(--unc-blue);
    letter-spacing: -0.02em;
  }

  /* ── Tier badges ──────────────────────────────────────────────────────── */
  .badge-gateway  { background:#dc2626; color:#fff; border-radius:6px; padding:3px 10px; font-size:0.72em; font-weight:600; letter-spacing:0.5px; }
  .badge-tier1    { background:#d97706; color:#fff; border-radius:6px; padding:3px 10px; font-size:0.72em; font-weight:600; letter-spacing:0.5px; }
  .badge-tier2    { background:#059669; color:#fff; border-radius:6px; padding:3px 10px; font-size:0.72em; font-weight:600; letter-spacing:0.5px; }
  .badge-triangle { background:var(--unc-blue); color:#fff; border-radius:6px; padding:3px 10px; font-size:0.72em; font-weight:600; letter-spacing:0.5px; }

  /* ── Insight cards ────────────────────────────────────────────────────── */
  .insight-card {
    background: linear-gradient(135deg, #0c1021 0%, #13294B 100%);
    border-left: 3px solid var(--unc-blue);
    border-radius: 0 12px 12px 0;
    padding: 16px 20px;
    margin: 14px 0;
  }
  .insight-card b { color: var(--unc-blue); }
  .insight-card li { color: #cbd5e1; margin-bottom: 4px; font-size: 0.9em; line-height: 1.55; }

  /* ── News cards ───────────────────────────────────────────────────────── */
  .news-card {
    border: 1px solid #1a2540;
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #0c1021 0%, var(--bg-card) 100%);
    transition: border-color 0.2s;
  }
  .news-card:hover { border-color: var(--unc-blue); }
  .news-card a { color: var(--unc-blue); text-decoration: none; font-weight: 600; }
  .news-card a:hover { text-decoration: underline; color: var(--unc-light); }
  .news-card .meta { color: var(--text-dim); font-size: 0.8em; margin-top: 2px; }
  .news-card .desc { color: #94a3b8; font-size: 0.86em; margin-top: 6px; line-height: 1.5; }

  /* ── Source badges ────────────────────────────────────────────────────── */
  .source-link { font-size: 0.78em; color: var(--text-dim); }
  .source-link a { color: var(--unc-blue); }

  /* ── Data tables ──────────────────────────────────────────────────────── */
  .stDataFrame { border-radius: 10px; overflow: hidden; }

  /* ── Dividers ─────────────────────────────────────────────────────────── */
  hr { border-color: #1a2540 !important; margin: 20px 0; }

  /* ── Buttons ──────────────────────────────────────────────────────────── */
  .stDownloadButton > button {
    background: transparent; border: 1px solid #2a3a55; color: var(--text-muted);
    font-size: 0.8em; border-radius: 8px; padding: 4px 14px;
  }
  .stDownloadButton > button:hover {
    border-color: var(--unc-blue); color: var(--text-primary);
  }

  /* ── Sidebar polish ───────────────────────────────────────────────────── */
  .sidebar-brand {
    display: flex; align-items: center; gap: 10px;
    padding: 4px 0 8px; margin-bottom: 4px;
  }
  .sidebar-brand .logo {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, var(--unc-blue) 0%, var(--unc-navy) 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: white; flex-shrink: 0;
  }
  .sidebar-brand .title {
    font-size: 1.05rem; font-weight: 700; color: var(--text-primary);
    line-height: 1.2;
  }
  .sidebar-brand .subtitle {
    font-size: 0.72rem; color: var(--unc-blue); font-weight: 500;
    letter-spacing: 0.3px;
  }
  .api-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
  .api-dot.on  { background: #34d399; box-shadow: 0 0 6px rgba(52,211,153,0.4); }
  .api-dot.off { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.3); }

  /* ── Streamlit overrides ──────────────────────────────────────────────── */
  .stSubheader, h2, h3 { color: var(--unc-blue) !important; }
  .stMarkdown p { color: var(--unc-blue); }
  .stCaption p { color: #94a3b8; }

  /* ── Sidebar text — white for readability on navy ────────────────────── */
  section[data-testid="stSidebar"] label span,
  section[data-testid="stSidebar"] .stRadio label,
  section[data-testid="stSidebar"] .stMarkdown p,
  section[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p,
  section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
    color: #e2e8f0 !important;
  }
  section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover {
    color: #ffffff !important;
  }

  /* ── Hide default Streamlit chrome ────────────────────────────────────── */
  #MainMenu { visibility: hidden; }
  header[data-testid="stHeader"] { background: rgba(11,15,25,0.85); backdrop-filter: blur(12px); }
  footer { visibility: hidden; }
</style>
""", unsafe_allow_html=True)


# ── SIDEBAR ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div class="sidebar-brand">
      <div class="logo">🏢</div>
      <div>
        <div class="title">CRE Intelligence</div>
        <div class="subtitle">Commercial Real Estate Dashboard</div>
      </div>
    </div>""", unsafe_allow_html=True)
    st.divider()

    page = st.radio(
        "Navigation",
        [
            "🏠 Overview",
            "🗂️ Market Tiers",
            "📈 Macro Trends",
            "🔺 Triangle NC Deep Dive",
            "💰 Capital Markets",
            "🔍 Demand Signals",
            "🏘️ Housing & Rents",
            "📰 Deal Flow & News",
            "🏢 Brokerage Research",
            "⚖️ Business & Legislation",
            "🗺️ Interactive Map",
            "📊 Market Comparisons",
        ],
        label_visibility="collapsed",
    )

    st.divider()

    if st.button("🔄 Refresh All Data", use_container_width=True):
        st.cache_data.clear()
        st.rerun()

    st.caption(last_updated_badge())
    st.divider()

    # API key status — compact
    fred_dot  = "on" if FRED_KEY   else "off"
    census_dot= "on" if CENSUS_KEY else "off"
    news_dot  = "on" if NEWS_KEY   else "off"
    bea_dot   = "on" if BEA_KEY    else "off"
    st.markdown(f"""
    <div style="font-size:0.82em; color:#94a3b8; line-height:2">
      <b style="color:#cbd5e1">Data Connections</b><br>
      <span class="api-dot {fred_dot}"></span> FRED (St. Louis Fed)<br>
      <span class="api-dot {census_dot}"></span> U.S. Census Bureau<br>
      <span class="api-dot {news_dot}"></span> NewsAPI.org<br>
      <span class="api-dot {bea_dot}"></span> BEA (optional)<br>
      <span class="api-dot on"></span> Google Trends (no key)<br>
      <span class="api-dot on"></span> Zillow Research (no key)
    </div>""", unsafe_allow_html=True)
    st.divider()

    with st.expander("📖 CRE Glossary"):
        for term, defn in GLOSSARY.items():
            st.markdown(f"**{term}:** {defn}")


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER: reusable metric card
# ═══════════════════════════════════════════════════════════════════════════════
def metric_card(title: str, value: str, delta: str = "", icon: str = ""):
    st.markdown(f"""
<div class="metric-card">
  <h3>{icon} {title}</h3>
  <p class="value">{value}</p>
  <p class="delta">{delta}</p>
</div>""", unsafe_allow_html=True)


def insight_card(bullets: list[str]):
    items = "".join(f"<li>{b}</li>" for b in bullets)
    st.markdown(f"""
<div class="insight-card">
  <b>💡 Key Insights</b>
  <ul style="margin:8px 0 0;padding-left:18px;color:#cdd6e0">{items}</ul>
</div>""", unsafe_allow_html=True)


def tier_badge(tier: str) -> str:
    mapping = {
        "Gateway":          '<span class="badge-gateway">Gateway</span>',
        "Tier 1":           '<span class="badge-tier1">Tier 1</span>',
        "Tier 2 / Emerging":'<span class="badge-tier2">Tier 2/Emerging</span>',
    }
    return mapping.get(tier, tier)


# ── CSV/PNG export helpers ────────────────────────────────────────────────────
def df_download_btn(df: pd.DataFrame, filename: str, label: str = "⬇ Export CSV"):
    csv = df.to_csv(index=False)
    st.download_button(label, csv, file_name=filename, mime="text/csv")


def fig_download_btn(fig: go.Figure, filename: str, label: str = "⬇ Export PNG"):
    try:
        img_bytes = fig.to_image(format="png", width=1200, height=600)
        st.download_button(label, img_bytes, file_name=filename, mime="image/png")
    except Exception:
        st.caption("Install `kaleido` for PNG export: `pip install kaleido`")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: OVERVIEW
# ═══════════════════════════════════════════════════════════════════════════════
def page_overview():
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
                               bgcolor="rgba(11,15,25,0.85)", borderpad=3, bordercolor="rgba(248,113,113,0.3)", borderwidth=1)
            fig.add_vline(x="2022-03-01", line_dash="dot", line_color="rgba(251,191,36,0.5)", line_width=1)
            fig.add_annotation(x="2022-03-01", y=1.08, yref="paper", text="Rate Hikes",
                               showarrow=False, font=dict(color="#fbbf24", size=9),
                               bgcolor="rgba(11,15,25,0.85)", borderpad=3, bordercolor="rgba(251,191,36,0.3)", borderwidth=1)
            st.plotly_chart(fig, use_container_width=True)
            fig_download_btn(fig, "cre_price_index.png")
            source_badge("FRED COMREPUSQ159N", "https://fred.stlouisfed.org/series/COMREPUSQ159N")
        else:
            st.info("Add FRED API key to load CRE price index.")

    with col_b:
        st.subheader("Fed Funds Rate & 10-Yr Treasury")
        df_rates = fetch_fred_multi({
            "Fed Funds Rate":    NATIONAL_SERIES["fed_funds_rate"],
            "10-Yr Treasury":    NATIONAL_SERIES["treasury_10yr"],
            "30-Yr Mortgage":    NATIONAL_SERIES["mortgage_30yr"],
        })
        if not df_rates.empty:
            df_rates = df_rates.reset_index()
            cols = [c for c in df_rates.columns if c != "date"]
            fig = line_chart(df_rates, "date", cols, "Interest Rate Environment (%)",
                             "Rate (%)",
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


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: MARKET TIERS
# ═══════════════════════════════════════════════════════════════════════════════
def page_market_tiers():
    st.markdown('<div class="section-header"><h1>🗂️ Market Tiers</h1></div>', unsafe_allow_html=True)
    st.markdown("Full breakdown of all tracked U.S. markets by tier with key economic proxies.")

    render_glossary_expander(["Gateway Market", "Tier 1 Market", "Tier 2 / Emerging", "MSA"], GLOSSARY)

    # Build unified market table
    rows = []
    for tier_name, tier_data in MARKET_TIERS.items():
        for mkt in tier_data["markets"]:
            unemp = fetch_fred_latest(mkt["fred_unemp"]) if FRED_KEY else None
            rows.append({
                "Tier":        tier_name,
                "Market":      mkt["name"],
                "State":       mkt["state"],
                "MSA":         mkt["msa"],
                "Unemp (%)":   round(unemp, 1) if unemp else None,
                "Highlight":   "⭐ Triangle Focus" if mkt.get("highlight") else "",
            })

    df_all = pd.DataFrame(rows)

    # Tier filter
    col_f1, col_f2 = st.columns([2, 3])
    with col_f1:
        sel_tier = st.multiselect("Filter by Tier",
                                  options=list(MARKET_TIERS.keys()),
                                  default=list(MARKET_TIERS.keys()))
    with col_f2:
        sort_col = st.selectbox("Sort by", ["Tier", "Market", "Unemp (%)"])

    df_filtered = df_all[df_all["Tier"].isin(sel_tier)].sort_values(sort_col, na_position="last")

    st.dataframe(
        df_filtered[["Tier","Market","State","Unemp (%)","Highlight"]],
        use_container_width=True,
        hide_index=True,
    )
    df_download_btn(df_filtered, "market_tiers.csv")

    st.divider()

    # Unemployment bar chart across all tiers
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

    # Per-tier trend lines (spot check a few)
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
        series_dict = {m["name"]: m["fred_unemp"]
                       for m in markets if m["name"] in sel}
        if series_dict and FRED_KEY:
            df_trend = fetch_fred_multi(series_dict)
            if not df_trend.empty:
                df_trend = df_trend.reset_index()
                cols = [c for c in df_trend.columns if c != "date"]
                fig = line_chart(df_trend, "date", cols,
                                 f"{tier_name} Unemployment Trends", "Rate (%)")
                st.plotly_chart(fig, use_container_width=True)
                fig_download_btn(fig, f"trend_{tier_name.replace('/','-')}.png")
        elif not FRED_KEY:
            api_key_warning("FRED API Key")

    with tab_gw: _trend_tab("Gateway")
    with tab_t1: _trend_tab("Tier 1")
    with tab_t2: _trend_tab("Tier 2 / Emerging")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: MACRO TRENDS
# ═══════════════════════════════════════════════════════════════════════════════
def page_macro_trends():
    st.markdown('<div class="section-header"><h1>📈 Macro Trends</h1></div>', unsafe_allow_html=True)
    st.markdown("National macroeconomic indicators that drive CRE valuations, cap rates, and deal flow.")

    render_glossary_expander(["Cap Rate", "NOI", "LTV", "DSCR"], GLOSSARY)

    if not FRED_KEY:
        api_key_warning("FRED API Key")
        return

    # Date range selector
    col_d1, col_d2 = st.columns(2)
    with col_d1:
        start_year = st.slider("Start Year", 2000, 2023, 2015)
    start_date = f"{start_year}-01-01"

    col1, col2 = st.columns(2)

    # CRE Price Index
    with col1:
        st.subheader("National CRE Price Index")
        df = fetch_fred_series(NATIONAL_SERIES["cre_price_index"], start=start_date)
        if not df.empty:
            fig = area_chart(df, "date", ["value"], "CRE Price Index", "Index Level")
            st.plotly_chart(fig, use_container_width=True)
            fig_download_btn(fig, "cre_price_national.png")
            source_badge("FRED COMREPUSQ159N", "https://fred.stlouisfed.org/series/COMREPUSQ159N")

    # Fed Funds Rate
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

    # National Unemployment
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

    # CPI Inflation
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

    # GDP Growth
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

    # Non-Residential Construction Spending
    with col6:
        st.subheader("Non-Residential Construction Spending")
        df = fetch_fred_series(NATIONAL_SERIES["construction_spend"], start=start_date)
        if not df.empty:
            fig = area_chart(df, "date", ["value"],
                             "Non-Residential Construction ($M)", "$M")
            st.plotly_chart(fig, use_container_width=True)
            source_badge("FRED TLNRESCONS", "https://fred.stlouisfed.org/series/TLNRESCONS")

    st.divider()

    # REIT ETF (VNQ) as market sentiment
    st.subheader("REIT Market Sentiment (VNQ ETF Price)")
    df_vnq = fetch_reit_etf("VNQ")
    if not df_vnq.empty:
        fig = line_chart(df_vnq, "date", "VNQ", "Vanguard Real Estate ETF (VNQ) — CRE Sentiment Proxy", "Price ($)")
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


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: TRIANGLE NC DEEP DIVE
# ═══════════════════════════════════════════════════════════════════════════════
def page_triangle():
    st.markdown('<div class="section-header"><h1>🔺 Triangle NC Deep Dive</h1></div>', unsafe_allow_html=True)
    st.markdown("**Research Triangle** — Raleigh, Durham & Chapel Hill. One of the fastest-growing metros in the U.S.")

    render_glossary_expander(["RTP", "Cap Rate", "Absorption", "Vacancy Rate", "MSA"], GLOSSARY)

    # ── Hero KPIs ─────────────────────────────────────────────────────────────
    col1, col2, col3, col4 = st.columns(4)

    rale_unemp = fetch_fred_latest(TRIANGLE_SERIES["raleigh_unemp"]) if FRED_KEY else None
    durh_unemp = fetch_fred_latest(TRIANGLE_SERIES["durham_unemp"]) if FRED_KEY else None
    nc_unemp   = fetch_fred_latest(TRIANGLE_SERIES["nc_unemp"])      if FRED_KEY else None
    nat_unemp  = fetch_fred_latest(NATIONAL_SERIES["national_unemp"])if FRED_KEY else None

    with col1:
        metric_card("Raleigh-Cary Unemployment", f"{rale_unemp:.1f}%" if rale_unemp else "N/A",
                    f"vs. National: {nat_unemp:.1f}%" if nat_unemp else "", "📍")
    with col2:
        metric_card("Durham Unemployment", f"{durh_unemp:.1f}%" if durh_unemp else "N/A",
                    "Durham-Chapel Hill MSA", "🎓")
    with col3:
        metric_card("NC State Unemployment", f"{nc_unemp:.1f}%" if nc_unemp else "N/A",
                    "North Carolina statewide", "🌲")
    with col4:
        delta_str = ""
        if rale_unemp and nat_unemp:
            delta = rale_unemp - nat_unemp
            arrow = "below" if delta < 0 else "above"
            delta_str = f"{abs(delta):.1f}% {arrow} national avg"
        metric_card("Triangle Advantage", delta_str if delta_str else "—",
                    "Raleigh vs. national unemployment", "⭐")

    st.divider()

    # ── Unemployment trend chart ───────────────────────────────────────────────
    col_a, col_b = st.columns(2)

    with col_a:
        st.subheader("Raleigh vs. Durham vs. National Unemployment")
        if FRED_KEY:
            df_tri = fetch_fred_multi({
                "Raleigh-Cary":   TRIANGLE_SERIES["raleigh_unemp"],
                "Durham":         TRIANGLE_SERIES["durham_unemp"],
                "NC Statewide":   TRIANGLE_SERIES["nc_unemp"],
                "National":       NATIONAL_SERIES["national_unemp"],
            })
            if not df_tri.empty:
                df_tri = df_tri.reset_index()
                cols  = [c for c in df_tri.columns if c != "date"]
                fig = line_chart(df_tri, "date", cols,
                                 "Unemployment Rate Comparison (%)", "Rate (%)",
                                 color_map={
                                     "Raleigh-Cary": COLORS["triangle"],
                                     "Durham":       COLORS["accent"],
                                     "NC Statewide": COLORS["warning"],
                                     "National":     COLORS["danger"],
                                 })
                st.plotly_chart(fig, use_container_width=True)
                fig_download_btn(fig, "triangle_unemp.png")
                source_badge("FRED", "https://fred.stlouisfed.org/series/RALE537URN")
        else:
            api_key_warning("FRED API Key")

    with col_b:
        st.subheader("Interest Rate Context for Triangle CRE")
        if FRED_KEY:
            df_rates = fetch_fred_multi({
                "10-Yr Treasury": NATIONAL_SERIES["treasury_10yr"],
                "Fed Funds Rate": NATIONAL_SERIES["fed_funds_rate"],
            })
            if not df_rates.empty:
                df_rates = df_rates.reset_index()
                cols = [c for c in df_rates.columns if c != "date"]
                fig = line_chart(df_rates, "date", cols,
                                 "National Rates (CRE Cost of Capital)", "Rate (%)")
                st.plotly_chart(fig, use_container_width=True)

    st.divider()

    # ── Census data for Triangle ───────────────────────────────────────────────
    st.subheader("Triangle County Demographics (Census ACS 2022)")
    if CENSUS_KEY:
        df_pop = fetch_census_population("37")  # NC FIPS
        if not df_pop.empty:
            # Filter to Triangle counties
            triangle_names = ["Wake", "Durham", "Orange", "Chatham", "Johnston"]
            df_pop["is_triangle"] = df_pop["NAME"].apply(
                lambda x: any(n in x for n in triangle_names)
            )
            df_tri_pop = df_pop[df_pop["is_triangle"]].copy()

            if not df_tri_pop.empty:
                df_tri_pop["County"] = df_tri_pop["NAME"].str.replace(r" County, North Carolina", "", regex=True)
                col_p1, col_p2 = st.columns(2)
                with col_p1:
                    fig = bar_chart(
                        df_tri_pop.sort_values("population", ascending=True),
                        x="population", y="County",
                        title="Population by Triangle County",
                        orientation="h",
                    )
                    st.plotly_chart(fig, use_container_width=True)
                with col_p2:
                    st.dataframe(
                        df_tri_pop[["County", "population"]].sort_values("population", ascending=False),
                        hide_index=True, use_container_width=True,
                    )
                    df_download_btn(df_tri_pop[["County", "population"]], "triangle_population.csv")
                source_badge("U.S. Census ACS 2022", "https://data.census.gov")
            else:
                st.info("No Triangle county data matched.")
        else:
            st.info("Census data unavailable.")

        # Median income
        st.subheader("Median Household Income — Triangle Counties")
        df_inc = fetch_census_median_income("37")
        if not df_inc.empty:
            triangle_names = ["Wake", "Durham", "Orange", "Chatham", "Johnston"]
            df_inc["is_triangle"] = df_inc["NAME"].apply(
                lambda x: any(n in x for n in triangle_names)
            )
            df_tri_inc = df_inc[df_inc["is_triangle"]].dropna(subset=["median_income"])
            if not df_tri_inc.empty:
                df_tri_inc["County"] = df_tri_inc["NAME"].str.replace(
                    r" County, North Carolina", "", regex=True)
                fig = bar_chart(
                    df_tri_inc.sort_values("median_income", ascending=False),
                    x="County", y="median_income",
                    title="Median Household Income by Triangle County ($)",
                )
                st.plotly_chart(fig, use_container_width=True)
                source_badge("U.S. Census ACS 2022", "https://data.census.gov")
    else:
        api_key_warning("Census API Key")

    st.divider()

    # ── Real Estate Employment (CBP) ───────────────────────────────────────────
    st.subheader("Real Estate Sector Employment — NC Counties (Census CBP 2021)")
    if CENSUS_KEY:
        df_cbp = fetch_census_cbp("37", NAICS_REAL_ESTATE)
        if not df_cbp.empty:
            triangle_names = ["Wake", "Durham", "Orange", "Chatham", "Johnston"]
            df_cbp["is_triangle"] = df_cbp["NAME"].apply(
                lambda x: any(n in x for n in triangle_names)
            )
            df_nc_top = df_cbp.dropna(subset=["EMP"]).nlargest(15, "EMP")
            df_nc_top["County"] = df_nc_top["NAME"].str.split(",").str[0]
            df_nc_top["In Triangle"] = df_nc_top["is_triangle"].map({True: "Triangle", False: "Other NC"})

            fig = bar_chart(
                df_nc_top.sort_values("EMP", ascending=True),
                x="EMP", y="County",
                title="Top NC Counties — Real Estate Employment (NAICS 531)",
                color="In Triangle",
                color_discrete_map={"Triangle": COLORS["triangle"], "Other NC": COLORS["secondary"]},
                orientation="h",
            )
            st.plotly_chart(fig, use_container_width=True)
            df_download_btn(df_nc_top[["County","EMP","PAYANN","ESTAB"]], "re_employment_nc.csv")
            source_badge("Census County Business Patterns 2021", "https://www.census.gov/programs-surveys/cbp.html")

    st.divider()

    # ── RTP & Key Employers ────────────────────────────────────────────────────
    st.subheader("Research Triangle Park — Key Facts")
    col_rtp1, col_rtp2, col_rtp3 = st.columns(3)
    rtp_facts = [
        ("Acreage",           "7,000 acres", "7,000-acre dedicated R&D campus"),
        ("Companies",         "300+",         "Global tech, pharma & life-sci tenants"),
        ("Workers (on-site)", "~65,000",      "Direct employees in RTP campus"),
        ("Est. Economic Impact","$2.7B+",     "Annual contribution to NC economy"),
        ("Major Tenants",     "IBM, Cisco, GSK, Biogen, EPA, RTI International", ""),
        ("CRE Demand",        "Industrial, Lab/R&D, Data Centers", "Hot CRE property types in Triangle"),
    ]
    for i, (k, v, note) in enumerate(rtp_facts):
        with [col_rtp1, col_rtp2, col_rtp3][i % 3]:
            metric_card(k, v, note, "🔬" if i < 3 else "🏭")

    st.divider()

    # ── News Feed ──────────────────────────────────────────────────────────────
    st.subheader("Live Triangle CRE News Feed")
    if NEWS_KEY:
        q = st.text_input(
            "News query",
            value="commercial real estate Raleigh OR Durham OR Triangle OR Chapel Hill",
            key="triangle_news_q",
        )
        n_articles = st.slider("Number of articles", 3, 20, 8, key="triangle_n")
        articles = fetch_news(q, page_size=n_articles)
        if articles:
            for a in articles:
                news_card(a)
        else:
            st.info("No articles found — try adjusting the search query.")
        source_badge("NewsAPI.org", "https://newsapi.org")
    else:
        api_key_warning("NewsAPI Key")

    st.divider()
    insight_card([
        "Raleigh-Durham consistently outperforms national unemployment by 0.5–1.5 pp — signaling labor market strength.",
        "Wake County's population growth ranks top-5 nationally, driving multifamily and industrial CRE demand.",
        "RTP's life sciences cluster (Biogen, GSK, Pfizer) anchors lab/R&D real estate as a premium CRE niche.",
        "North Carolina's business-friendly tax environment (flat 2.5% corporate tax by 2025) continues to attract HQ relocations.",
        "Risks: office oversupply in downtown Raleigh, rising construction costs, and I-40 corridor congestion.",
    ])


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: DEAL FLOW & NEWS
# ═══════════════════════════════════════════════════════════════════════════════
def page_deal_flow():
    st.markdown('<div class="section-header"><h1>📰 Deal Flow & News</h1></div>', unsafe_allow_html=True)
    st.markdown("Live CRE transaction news and market deals filtered by tier and geography.")

    if not NEWS_KEY:
        api_key_warning("NewsAPI Key")
        st.markdown("""
**Get a free NewsAPI key:**
1. Visit [newsapi.org](https://newsapi.org/register)
2. Register a free developer account (100 req/day)
3. Add `NEWS_API_KEY=your_key` to your `.env` file
        """)
        return

    # Query presets
    col_q1, col_q2 = st.columns([3, 1])
    with col_q1:
        preset = st.selectbox("Quick query presets", [
            "commercial real estate deal Raleigh OR Triangle OR Durham",
            "CRE transaction multifamily industrial office",
            "real estate investment sale acquisition 2024 2025",
            "REIT acquisition commercial property",
            "North Carolina real estate development permit",
            "office vacancy sublease commercial market",
            "industrial warehouse logistics real estate deal",
            "data center real estate acquisition lease",
            "Custom query...",
        ])
    with col_q2:
        n_art = st.number_input("# Articles", 3, 30, 10)

    if preset == "Custom query...":
        query = st.text_input("Enter custom query")
    else:
        query = preset

    if query:
        with st.spinner("Fetching news..."):
            articles = fetch_news(query, page_size=int(n_art))

        if articles:
            st.success(f"Found {len(articles)} articles")

            # Table view
            with st.expander("📋 Table View"):
                df_news = pd.DataFrame([{
                    "Date":    a.get("publishedAt","")[:10],
                    "Title":   a.get("title",""),
                    "Source":  a.get("source",{}).get("name",""),
                    "URL":     a.get("url",""),
                } for a in articles])
                st.dataframe(df_news[["Date","Title","Source"]], use_container_width=True, hide_index=True)
                df_download_btn(df_news, "deal_flow_news.csv")

            # Card view
            st.subheader("Article Cards")
            for a in articles:
                news_card(a)
        else:
            st.info("No results. NewsAPI free tier limits: 100 req/day, past 30 days only.")

        source_badge("NewsAPI.org", "https://newsapi.org")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: BUSINESS & LEGISLATION
# ═══════════════════════════════════════════════════════════════════════════════
def page_legislation():
    st.markdown('<div class="section-header"><h1>⚖️ Business Climate & Legislation</h1></div>', unsafe_allow_html=True)
    st.markdown("Key policy environment, state incentives, and legislative trends affecting CRE in the Triangle and NC.")

    # Static key facts
    st.subheader("North Carolina Business Climate — Key Facts")
    facts = {
        "Corporate Tax Rate":          "2.5% (flat) — decreasing to 0% by 2030 per HB 334",
        "Individual Income Tax":       "Flat 4.5% (2024), trending toward 3.99%",
        "Property Tax (Wake County)":  "~$0.60 per $100 assessed value (Raleigh city + county)",
        "Right-to-Work State":         "Yes — reduces labor friction for employers",
        "Opportunity Zones":           "252 designated OZs in NC, including parts of Durham and Raleigh",
        "JDIG Incentive Program":      "Job Development Investment Grant — cash grants for new jobs created in NC",
        "Site Readiness Program":      "NC DEQ/Commerce pre-permitted industrial sites program",
        "UNC System R&D Spending":     "$1.4B+ annually — major demand driver for lab/office CRE",
    }
    for k, v in facts.items():
        st.markdown(f"**{k}:** {v}")

    st.divider()

    # Live legislation news
    st.subheader("Live Policy & Legislation News")
    if NEWS_KEY:
        queries = {
            "NC CRE Legislation":         "North Carolina commercial real estate legislation OR zoning OR incentives",
            "Triangle Development":       "Raleigh Durham development permit zoning OR rezoning",
            "NC Business Incentives":     "North Carolina business incentive JDIG OR opportunity zone OR tax",
            "CRE Policy National":        "commercial real estate policy legislation federal 2024 2025",
        }
        tab_keys = list(queries.keys())
        tabs = st.tabs(tab_keys)
        for tab, (label, q) in zip(tabs, queries.items()):
            with tab:
                articles = fetch_news(q, page_size=6)
                if articles:
                    for a in articles:
                        news_card(a)
                else:
                    st.info("No articles found for this query.")
        source_badge("NewsAPI.org", "https://newsapi.org")
    else:
        api_key_warning("NewsAPI Key")

    st.divider()
    insight_card([
        "NC's declining corporate tax rate makes it one of the most competitive states for HQ relocations — a direct CRE demand driver.",
        "Wake & Durham counties are active rezoners: mixed-use and high-density residential rezonings are at record levels (2023-2025).",
        "JDIG incentives require job creation timelines; CRE investors can model absorption based on announced deals.",
        "Opportunity Zones in East Durham/East Raleigh offer tax-advantaged equity plays for value-add multifamily.",
    ])


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: INTERACTIVE MAP
# ═══════════════════════════════════════════════════════════════════════════════
def page_map():
    st.markdown('<div class="section-header"><h1>🗺️ Interactive CRE Market Map</h1></div>', unsafe_allow_html=True)
    st.markdown("Geographic distribution of tracked markets by tier. Zoom into the Research Triangle for detailed local context.")

    try:
        import folium
        from streamlit_folium import st_folium
        _HAS_FOLIUM = True
    except ImportError:
        _HAS_FOLIUM = False

    if not _HAS_FOLIUM:
        st.warning(
            "Map requires `folium` and `streamlit-folium`. "
            "Install with: `pip install folium streamlit-folium`"
        )
        st.info("Showing tabular fallback instead.")

        # Fallback: plotly scatter geo
        rows = []
        for tier_name, tier_data in MARKET_TIERS.items():
            for m in tier_data["markets"]:
                unemp = fetch_fred_latest(m["fred_unemp"]) if FRED_KEY else None
                rows.append({
                    "Market": m["name"], "Tier": tier_name,
                    "Lat": m["lat"], "Lon": m["lon"],
                    "Unemp": unemp,
                })
        df_map = pd.DataFrame(rows)
        tier_colors = {
            "Gateway":           COLORS["gateway"],
            "Tier 1":            COLORS["tier1"],
            "Tier 2 / Emerging": COLORS["tier2"],
        }
        fig = px.scatter_geo(
            df_map, lat="Lat", lon="Lon",
            text="Market", color="Tier",
            color_discrete_map=tier_colors,
            hover_name="Market",
            hover_data={"Unemp": ":.1f", "Tier": True, "Lat": False, "Lon": False},
            scope="usa",
            title="U.S. CRE Markets by Tier",
            template=PLOTLY_TEMPLATE,
        )
        fig.update_traces(marker_size=12, textposition="top center")
        fig.update_layout(height=550, margin=dict(l=0, r=0, t=40, b=0))
        st.plotly_chart(fig, use_container_width=True)
        fig_download_btn(fig, "cre_market_map.png")
        return

    # ── Full Folium Map ────────────────────────────────────────────────────────
    col_map, col_ctrl = st.columns([3, 1])

    with col_ctrl:
        default_zoom = st.selectbox("Default zoom", ["National", "Triangle NC", "Custom"])
        show_tiers  = st.multiselect("Show tiers",
                                     list(MARKET_TIERS.keys()),
                                     default=list(MARKET_TIERS.keys()))
        show_unemp  = st.checkbox("Show unemployment in popup", value=True)

    if default_zoom == "Triangle NC":
        center, zoom = [35.85, -79.0], 9
    else:
        center, zoom = [38.0, -96.0], 4

    m = folium.Map(location=center, zoom_start=zoom,
                   tiles="CartoDB dark_matter")

    tier_icon_colors = {
        "Gateway":           "red",
        "Tier 1":            "orange",
        "Tier 2 / Emerging": "green",
    }

    for tier_name, tier_data in MARKET_TIERS.items():
        if tier_name not in show_tiers:
            continue
        icon_color = tier_icon_colors.get(tier_name, "blue")
        for mkt in tier_data["markets"]:
            unemp = fetch_fred_latest(mkt["fred_unemp"]) if (FRED_KEY and show_unemp) else None
            unemp_str = f"<b>Unemployment:</b> {unemp:.1f}%" if unemp else ""
            highlight = " ⭐ (Triangle Focus)" if mkt.get("highlight") else ""
            popup_html = f"""
<div style="font-family:sans-serif;min-width:180px">
  <b style="font-size:14px">{mkt['name']}{highlight}</b><br>
  <span style="color:gray">{tier_name}</span><br>
  {unemp_str}<br>
  <small>MSA: {mkt['msa']}</small>
</div>"""
            # Use star icon for Triangle
            icon_name = "star" if mkt.get("highlight") else "home"
            folium.Marker(
                location=[mkt["lat"], mkt["lon"]],
                popup=folium.Popup(popup_html, max_width=250),
                tooltip=mkt["name"],
                icon=folium.Icon(color=icon_color, icon=icon_name, prefix="fa"),
            ).add_to(m)

    # Add Research Triangle polygon
    if "Tier 2 / Emerging" in show_tiers:
        triangle_coords = [
            [35.7796, -78.6382],  # Raleigh
            [35.9940, -78.8986],  # Durham
            [35.9132, -79.0558],  # Chapel Hill
        ]
        folium.Polygon(
            locations=triangle_coords,
            color="#8e44ad", weight=2, fill=True, fill_opacity=0.1,
            tooltip="Research Triangle",
        ).add_to(m)

    # Legend
    legend_html = """
<div style="position:fixed;bottom:30px;left:30px;z-index:9999;background:rgba(0,0,0,0.8);
     padding:12px;border-radius:8px;font-family:sans-serif;color:white;font-size:13px">
  <b>Market Tiers</b><br>
  <span style="color:#e74c3c">●</span> Gateway<br>
  <span style="color:#f39c12">●</span> Tier 1<br>
  <span style="color:#2ecc71">●</span> Tier 2 / Emerging<br>
  <span style="color:#8e44ad">⭐</span> Triangle NC
</div>"""
    m.get_root().html.add_child(folium.Element(legend_html))

    with col_map:
        st_folium(m, width=900, height=550)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: MARKET COMPARISONS
# ═══════════════════════════════════════════════════════════════════════════════
def page_comparisons():
    st.markdown('<div class="section-header"><h1>⚖️ Market Comparisons</h1></div>', unsafe_allow_html=True)
    st.markdown("Side-by-side comparison of any markets across unemployment, labor force, and economic trends.")

    # Collect all markets
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
                   "Charlotte, NC", "Nashville, TN", "National"]
    # Add national as an option
    all_names = df_all["name"].tolist() + ["National (U.S.)"]

    selected = st.multiselect(
        "Select markets to compare (2–8 recommended)",
        options=all_names,
        default=[m for m in default_sel if m in all_names or m == "National (U.S.)"],
    )

    if not selected:
        st.info("Select at least 2 markets above.")
        return

    if not FRED_KEY:
        api_key_warning("FRED API Key")
        return

    # Build series dict
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
        return

    df_comp = df_comp.reset_index()

    # Line chart comparison
    st.subheader("Unemployment Rate Comparison (%)")
    cols = [c for c in df_comp.columns if c != "date"]
    fig = line_chart(df_comp, "date", cols, "Unemployment Rate — Selected Markets (%)", "Rate (%)")
    st.plotly_chart(fig, use_container_width=True)
    fig_download_btn(fig, "market_comparison_unemp.png")

    st.divider()

    # Latest snapshot table
    st.subheader("Current Snapshot — Latest Available Values")
    snap_rows = []
    for col in cols:
        series = df_comp[col].dropna()
        if len(series) >= 13:
            yoy = ((series.iloc[-1] - series.iloc[-13]) / series.iloc[-13] * 100)
        else:
            yoy = None
        snap_rows.append({
            "Market":             col,
            "Latest Value (%)":   round(series.iloc[-1], 2) if not series.empty else None,
            "YoY Change (pp)":    round(yoy, 2) if yoy is not None else None,
            "Min (period)":       round(series.min(), 2) if not series.empty else None,
            "Max (period)":       round(series.max(), 2) if not series.empty else None,
        })
    df_snap = pd.DataFrame(snap_rows)
    st.dataframe(df_snap, use_container_width=True, hide_index=True)
    df_download_btn(df_snap, "comparison_snapshot.csv")

    st.divider()

    # Box plot of distribution
    st.subheader("Unemployment Distribution (Box Plot)")
    df_long = df_comp.melt(id_vars="date", var_name="Market", value_name="Unemployment (%)")
    df_long = df_long.dropna(subset=["Unemployment (%)"])
    from charts import box_chart
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


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: CAPITAL MARKETS
# ═══════════════════════════════════════════════════════════════════════════════
def page_capital_markets():
    st.markdown('<div class="section-header"><h1>💰 Capital Markets</h1></div>', unsafe_allow_html=True)
    st.markdown("CRE lending conditions, credit stress indicators, and capital flows that drive deal activity.")

    render_glossary_expander(["Cap Rate", "LTV", "DSCR", "NOI"], GLOSSARY)

    if not FRED_KEY:
        api_key_warning("FRED API Key")
        return

    # ── FRED series for capital markets ────────────────────────────────────
    CAPITAL_SERIES = {
        "fed_funds":        "FEDFUNDS",
        "treasury_10yr":    "DGS10",
        "treasury_2yr":     "DGS2",
        "yield_spread":     "T10Y2Y",         # 10Y-2Y spread (recession signal)
        "mortgage_30yr":    "MORTGAGE30US",
        "cre_loans":        "RHEACBW027SBOG",  # RE loans at commercial banks
        "delinquency":      "DRCLACBS",        # CRE loan delinquency rate
        "tightening":       "DRTSCLCC",        # Net % of banks tightening CRE standards
        "cmbs_spread":      "BAMLC0A4CBBB",    # BBB Corporate spread (CMBS proxy)
        "construction":     "TLNRESCONS",      # Non-res construction spending
    }

    start_year = st.slider("Start Year", 2005, 2023, 2015, key="cap_start")
    start_date = f"{start_year}-01-01"

    # ── Row 1: KPI gauges ──────────────────────────────────────────────────
    col1, col2, col3, col4 = st.columns(4)
    fed = fetch_fred_latest("FEDFUNDS")
    t10 = fetch_fred_latest("DGS10")
    spread = fetch_fred_latest("T10Y2Y")
    delin = fetch_fred_latest("DRCLACBS")

    with col1:
        metric_card("Fed Funds Rate", f"{fed:.2f}%" if fed else "N/A",
                    "FOMC target rate", "🏦")
    with col2:
        metric_card("10-Yr Treasury", f"{t10:.2f}%" if t10 else "N/A",
                    "CRE cap rate benchmark", "📊")
    with col3:
        spread_color = "🟢" if spread and spread > 0 else "🔴"
        metric_card("Yield Curve Spread", f"{spread:.2f}%" if spread else "N/A",
                    f"{spread_color} {'Normal' if spread and spread > 0 else 'Inverted — recession signal'}", "📉")
    with col4:
        metric_card("CRE Delinquency Rate", f"{delin:.2f}%" if delin else "N/A",
                    "All commercial banks", "⚠️")

    st.divider()

    # ── Row 2: Yield Curve + Lending Standards ─────────────────────────────
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

    # ── Row 3: CRE Lending Volume + Interest Rates ────────────────────────
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
            "Fed Funds":    "FEDFUNDS",
            "10-Yr Treasury": "DGS10",
            "30-Yr Mortgage": "MORTGAGE30US",
        }, start=start_date)
        if not df_rates.empty:
            df_rates = df_rates.reset_index()
            cols = [c for c in df_rates.columns if c != "date"]
            fig = line_chart(df_rates, "date", cols,
                             "Key Interest Rates (%)", "Rate (%)",
                             color_map={
                                 "Fed Funds":      "#f87171",
                                 "10-Yr Treasury":  "#60a5fa",
                                 "30-Yr Mortgage":  "#fbbf24",
                             })
            st.plotly_chart(fig, use_container_width=True)

    st.divider()

    # ── Row 4: Corporate Spreads + Construction ───────────────────────────
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
            fig = area_chart(df, "date", ["value"],
                             "Construction Spending ($M)", "$Millions")
            st.plotly_chart(fig, use_container_width=True)
            source_badge("FRED TLNRESCONS", "https://fred.stlouisfed.org/series/TLNRESCONS")

    st.divider()

    # ── REIT sentiment ─────────────────────────────────────────────────────
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


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: BROKERAGE RESEARCH AGGREGATOR
# ═══════════════════════════════════════════════════════════════════════════════
def page_brokerage_research():
    st.markdown('<div class="section-header"><h1>🏢 Brokerage Research</h1></div>', unsafe_allow_html=True)
    st.markdown("Aggregated research and market commentary from top CRE brokerage firms — auto-sourced from news feeds.")

    if not NEWS_KEY:
        api_key_warning("NewsAPI Key")
        return

    # ── Firm-specific research feeds ───────────────────────────────────────
    FIRMS = {
        "JLL": {
            "query": '"JLL" commercial real estate research OR market OR outlook OR report',
            "color": "#dc2626",
            "description": "Jones Lang LaSalle — global CRE services and research",
        },
        "CBRE": {
            "query": '"CBRE" commercial real estate research OR market OR report OR outlook',
            "color": "#2563eb",
            "description": "CBRE Group — world's largest commercial real estate firm",
        },
        "Cushman & Wakefield": {
            "query": '"Cushman Wakefield" OR "Cushman & Wakefield" commercial real estate research OR market',
            "color": "#059669",
            "description": "Cushman & Wakefield — global CRE advisory",
        },
        "Newmark": {
            "query": '"Newmark" commercial real estate research OR market OR report',
            "color": "#7c3aed",
            "description": "Newmark — CRE advisory, capital markets, research",
        },
        "Marcus & Millichap": {
            "query": '"Marcus Millichap" OR "Marcus & Millichap" real estate research OR multifamily OR investment',
            "color": "#d97706",
            "description": "Marcus & Millichap — investment brokerage, multifamily/NNN",
        },
        "Colliers": {
            "query": '"Colliers" commercial real estate research OR market OR report',
            "color": "#0891b2",
            "description": "Colliers International — CRE services and market intelligence",
        },
    }

    # Tabs per firm
    firm_names = list(FIRMS.keys())
    tabs = st.tabs(["📰 All Firms"] + firm_names)

    # All Firms tab
    with tabs[0]:
        all_query = " OR ".join([f'"{firm}"' for firm in firm_names])
        all_query += " commercial real estate"
        st.caption(f"Combined search across all tracked firms")
        articles = fetch_news(all_query, page_size=15)
        if articles:
            # Table summary
            df_all = pd.DataFrame([{
                "Date":   a.get("publishedAt", "")[:10],
                "Firm":   next((f for f in firm_names if f.lower() in (a.get("title","") + a.get("description","")).lower()), "General"),
                "Title":  a.get("title", ""),
                "Source": a.get("source", {}).get("name", ""),
            } for a in articles])
            st.dataframe(df_all[["Date","Firm","Title","Source"]], use_container_width=True, hide_index=True)
            df_download_btn(df_all, "brokerage_research_all.csv")
            st.divider()
            for a in articles:
                news_card(a)
        else:
            st.info("No brokerage research articles found. NewsAPI free tier covers the last 30 days.")

    # Per-firm tabs
    for i, (firm, config) in enumerate(FIRMS.items()):
        with tabs[i + 1]:
            st.markdown(f"""
<div style="border-left:3px solid {config['color']};padding-left:12px;margin-bottom:16px">
  <b style="color:#f1f5f9;font-size:1.05em">{firm}</b><br>
  <span style="color:#64748b;font-size:0.85em">{config['description']}</span>
</div>""", unsafe_allow_html=True)

            articles = fetch_news(config["query"], page_size=8)
            if articles:
                for a in articles:
                    news_card(a)
            else:
                st.info(f"No recent articles found for {firm}. Try the 'All Firms' tab.")

    st.divider()

    # ── Market Reports Quick Links ─────────────────────────────────────────
    st.subheader("📎 Direct Research Portals")
    st.markdown("""
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px">
  <a href="https://www.us.jll.com/en/trends-and-insights/research" target="_blank" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#dc2626">JLL Research</b><br><span class="desc">Market reports, outlook, city-level research</span>
  </a>
  <a href="https://www.cbre.com/insights" target="_blank" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#2563eb">CBRE Insights</b><br><span class="desc">Quarterly outlooks, cap rate surveys</span>
  </a>
  <a href="https://www.cushmanwakefield.com/en/insights" target="_blank" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#059669">C&W Insights</b><br><span class="desc">Market briefs, sector reports, forecasts</span>
  </a>
  <a href="https://www.nmrk.com/insights" target="_blank" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#7c3aed">Newmark Research</b><br><span class="desc">Capital markets, office/industrial reports</span>
  </a>
  <a href="https://www.marcusmillichap.com/research" target="_blank" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#d97706">Marcus & Millichap</b><br><span class="desc">Investment reports, multifamily data</span>
  </a>
  <a href="https://www.colliers.com/en-us/research" target="_blank" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#0891b2">Colliers Research</b><br><span class="desc">U.S. market snapshots, specialty sectors</span>
  </a>
</div>""", unsafe_allow_html=True)

    st.divider()
    insight_card([
        "Major brokerage firms publish free quarterly market snapshots — use their research portals above for PDF reports.",
        "JLL and CBRE publish cap rate surveys twice yearly — the gold standard for valuation benchmarks.",
        "Cushman & Wakefield's MarketBeat reports cover every major MSA including Raleigh-Durham.",
        "Marcus & Millichap specializes in middle-market investment sales — their research is especially useful for Tier 2 market analysis.",
        "Cross-reference multiple firms' outlooks to identify consensus views vs. contrarian bets.",
    ])


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: DEMAND SIGNALS (Google Trends)
# ═══════════════════════════════════════════════════════════════════════════════
def page_demand_signals():
    st.markdown('<div class="section-header"><h1>🔍 Demand Signals — Google Trends</h1></div>',
                unsafe_allow_html=True)
    st.markdown("Real-time search-volume data as an alternative demand proxy for CRE asset types and markets. "
                "Higher search interest = rising tenant / investor demand.")

    try:
        from pytrends.request import TrendReq
        _HAS_PYTRENDS = True
    except ImportError:
        _HAS_PYTRENDS = False

    if not _HAS_PYTRENDS:
        st.warning("Install `pytrends` for Google Trends data: `pip install pytrends`")
        st.info("Google Trends provides free, real-time search interest data — no API key needed.")
        return

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
        # Google Trends limits to 5 keywords at a time
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


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: HOUSING & RENTS (Zillow + BEA)
# ═══════════════════════════════════════════════════════════════════════════════
def page_housing_rents():
    st.markdown('<div class="section-header"><h1>🏘️ Housing & Rent Trends</h1></div>',
                unsafe_allow_html=True)
    st.markdown("Zillow research data on home values and observed rents by metro — "
                "key context for multifamily CRE and residential-adjacent investment.")

    # ── Metro selector ─────────────────────────────────────────────────────
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
        return

    # ── Section 1: Home Values (ZHVI) ──────────────────────────────────────
    st.subheader("Zillow Home Value Index (ZHVI) — Typical Home Value")
    st.caption("Smoothed, seasonally adjusted measure of the typical home value for single-family residences and condos.")

    col_h1, col_h2 = st.columns([2, 1])

    with col_h1:
        # Time series comparison
        fig_data = {}
        for metro in selected_metros[:6]:
            df_ts = get_zillow_metro_ts("zhvi_metro", metro)
            if not df_ts.empty:
                fig_data[metro] = df_ts.set_index("date")["value"]

        if fig_data:
            df_combined = pd.DataFrame(fig_data)
            df_combined = df_combined.reset_index()
            df_combined = df_combined.rename(columns={"index": "date"})
            cols = [c for c in df_combined.columns if c != "date"]
            fig = line_chart(df_combined, "date", cols,
                             "Typical Home Value by Metro ($)", "Home Value ($)")
            st.plotly_chart(fig, use_container_width=True)
            fig_download_btn(fig, "zillow_zhvi_comparison.png")
        else:
            st.info("Zillow data loading... If this persists, check internet connectivity.")

    with col_h2:
        # Latest snapshot table
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
            df_rent = pd.DataFrame(fig_data_rent)
            df_rent = df_rent.reset_index().rename(columns={"index": "date"})
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
            df_rsnap["Latest"] = df_rsnap["Latest"].apply(lambda x: f"${x:,.0f}/mo" if pd.notna(x) else "N/A")
            df_rsnap["YoY %"] = df_rsnap["YoY %"].apply(lambda x: f"{x:+.1f}%" if pd.notna(x) else "N/A")
            st.dataframe(df_rsnap[["Metro", "Latest", "YoY %"]], use_container_width=True, hide_index=True)
            df_download_btn(df_rsnap, "zillow_zori_snapshot.csv")

    source_badge("Zillow Research", "https://www.zillow.com/research/data/")

    st.divider()

    # ── Section 3: BEA GDP by Metro (if key provided) ─────────────────────
    st.subheader("GDP by Metro Area (BEA)")
    if BEA_KEY:
        df_gdp = fetch_bea_gdp_metro()
        if not df_gdp.empty:
            # Filter to our tracked metros (partial match)
            pattern = "|".join(selected_metros)
            df_gdp_filt = df_gdp[df_gdp["Metro"].str.contains(pattern, case=False, na=False)]
            if not df_gdp_filt.empty:
                df_gdp_filt["GDP_billions"] = df_gdp_filt["GDP_thousands"] / 1e6
                fig = bar_chart(
                    df_gdp_filt[df_gdp_filt["Year"] == df_gdp_filt["Year"].max()].sort_values("GDP_billions", ascending=True),
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
    <li>Free key: <a href="https://apps.bea.gov/api/signup/" target="_blank" style="color:#60a5fa">apps.bea.gov/api/signup</a></li>
    <li>Enables GDP, personal income, and economic growth comparisons by MSA</li>
  </ul>
</div>""", unsafe_allow_html=True)

    st.divider()

    # ── Affordability context ──────────────────────────────────────────────
    st.subheader("Home Value vs. Rent — Affordability Context")
    # Rent-to-value ratio for selected metros
    df_hv = get_zillow_latest_multi("zhvi_metro", selected_metros)
    df_rv = get_zillow_latest_multi("zori_metro", selected_metros)
    if not df_hv.empty and not df_rv.empty:
        # Merge on metro (partial match)
        df_hv_num = get_zillow_latest_multi("zhvi_metro", selected_metros)
        df_rv_num = get_zillow_latest_multi("zori_metro", selected_metros)
        merged = df_hv_num.merge(df_rv_num, on="Metro", suffixes=("_home", "_rent"))
        if not merged.empty and "Latest_home" in merged.columns and "Latest_rent" in merged.columns:
            merged["Gross Yield %"] = (merged["Latest_rent"] * 12 / merged["Latest_home"] * 100).round(2)
            merged["Price/Rent Ratio"] = (merged["Latest_home"] / (merged["Latest_rent"] * 12)).round(1)
            merged["Home Value"] = merged["Latest_home"].apply(lambda x: f"${x:,.0f}" if pd.notna(x) else "N/A")
            merged["Monthly Rent"] = merged["Latest_rent"].apply(lambda x: f"${x:,.0f}" if pd.notna(x) else "N/A")

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
                df_download_btn(merged[["Metro","Home Value","Monthly Rent","Gross Yield %","Price/Rent Ratio"]],
                                "affordability_comparison.csv")

            st.caption("Gross yield = (Annual Rent / Home Value) × 100. Higher yield = more favorable for rental investors. "
                       "Price/Rent ratio above 20 generally indicates a 'rent-favored' market.")

    st.divider()
    insight_card([
        "Zillow ZHVI and ZORI are the most widely used free residential price/rent indices — updated monthly.",
        "Raleigh-Durham's home values grew faster than national average 2020–2024, but rent growth has moderated.",
        "Gross rental yields above 6% signal markets where buy-and-rent strategies pencil more easily.",
        "Markets with high price/rent ratios (>25) often see more renter demand — good for multifamily CRE.",
        "Rising rents + stable home prices = expanding multifamily cap rate compression opportunity.",
    ])


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTER
# ═══════════════════════════════════════════════════════════════════════════════
def main():
    if   page == "🏠 Overview":               page_overview()
    elif page == "🗂️ Market Tiers":           page_market_tiers()
    elif page == "📈 Macro Trends":           page_macro_trends()
    elif page == "🔺 Triangle NC Deep Dive":  page_triangle()
    elif page == "💰 Capital Markets":        page_capital_markets()
    elif page == "🔍 Demand Signals":         page_demand_signals()
    elif page == "🏘️ Housing & Rents":        page_housing_rents()
    elif page == "📰 Deal Flow & News":       page_deal_flow()
    elif page == "🏢 Brokerage Research":     page_brokerage_research()
    elif page == "⚖️ Business & Legislation": page_legislation()
    elif page == "🗺️ Interactive Map":        page_map()
    elif page == "📊 Market Comparisons":     page_comparisons()

    # Footer
    st.divider()
    st.markdown("""
<div style="text-align:center;padding:8px 0;color:#475569;font-size:0.78em">
  CRE Intelligence Dashboard &nbsp;·&nbsp; Data: FRED, U.S. Census, NewsAPI &nbsp;·&nbsp;
  Built with Streamlit + Plotly &nbsp;·&nbsp; Alexander Vaslef
</div>""", unsafe_allow_html=True)


if __name__ == "__main__" or True:
    main()
