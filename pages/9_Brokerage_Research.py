from __future__ import annotations

import pandas as pd
import streamlit as st

from helpers import (
    fetch_news,
    api_key_warning, source_badge, news_card,
    insight_card, df_download_btn,
    load_css, render_sidebar,
    NEWS_KEY,
)

st.set_page_config(
    page_title="Brokerage Research — CRE Intelligence",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded",
)

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>🏢 Brokerage Research</h1></div>', unsafe_allow_html=True)
st.markdown("Aggregated research and market commentary from top CRE brokerage firms — auto-sourced from news feeds.")

if not NEWS_KEY:
    api_key_warning("NewsAPI Key")
    st.stop()

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

firm_names = list(FIRMS.keys())
tabs = st.tabs(["📰 All Firms"] + firm_names)

with tabs[0]:
    all_query = " OR ".join([f'"{firm}"' for firm in firm_names]) + " commercial real estate"
    st.caption("Combined search across all tracked firms")
    articles = fetch_news(all_query, page_size=15)
    if articles:
        df_all = pd.DataFrame([{
            "Date":   a.get("publishedAt", "")[:10],
            "Firm":   next((f for f in firm_names
                            if f.lower() in (a.get("title", "") + a.get("description", "")).lower()),
                           "General"),
            "Title":  a.get("title", ""),
            "Source": a.get("source", {}).get("name", ""),
        } for a in articles])
        st.dataframe(df_all[["Date", "Firm", "Title", "Source"]], use_container_width=True, hide_index=True)
        df_download_btn(df_all, "brokerage_research_all.csv")
        st.divider()
        for a in articles:
            news_card(a)
    else:
        st.info("No brokerage research articles found. NewsAPI free tier covers the last 30 days.")

for i, (firm, cfg) in enumerate(FIRMS.items()):
    with tabs[i + 1]:
        st.markdown(f"""
<div style="border-left:3px solid {cfg['color']};padding-left:12px;margin-bottom:16px">
  <b style="color:#f1f5f9;font-size:1.05em">{firm}</b><br>
  <span style="color:#64748b;font-size:0.85em">{cfg['description']}</span>
</div>""", unsafe_allow_html=True)
        articles = fetch_news(cfg["query"], page_size=8)
        if articles:
            for a in articles:
                news_card(a)
        else:
            st.info(f"No recent articles found for {firm}. Try the 'All Firms' tab.")

st.divider()

st.subheader("📎 Direct Research Portals")
st.markdown("""
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px">
  <a href="https://www.us.jll.com/en/trends-and-insights/research" target="_blank" rel="noopener noreferrer" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#dc2626">JLL Research</b><br><span class="desc">Market reports, outlook, city-level research</span>
  </a>
  <a href="https://www.cbre.com/insights" target="_blank" rel="noopener noreferrer" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#2563eb">CBRE Insights</b><br><span class="desc">Quarterly outlooks, cap rate surveys</span>
  </a>
  <a href="https://www.cushmanwakefield.com/en/insights" target="_blank" rel="noopener noreferrer" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#059669">C&amp;W Insights</b><br><span class="desc">Market briefs, sector reports, forecasts</span>
  </a>
  <a href="https://www.nmrk.com/insights" target="_blank" rel="noopener noreferrer" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#7c3aed">Newmark Research</b><br><span class="desc">Capital markets, office/industrial reports</span>
  </a>
  <a href="https://www.marcusmillichap.com/research" target="_blank" rel="noopener noreferrer" class="news-card" style="text-decoration:none;display:block">
    <b style="color:#d97706">Marcus &amp; Millichap</b><br><span class="desc">Investment reports, multifamily data</span>
  </a>
  <a href="https://www.colliers.com/en-us/research" target="_blank" rel="noopener noreferrer" class="news-card" style="text-decoration:none;display:block">
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

st.divider()
st.markdown("""
<div style="text-align:center;padding:8px 0;color:#475569;font-size:0.78em">
  CRE Intelligence Dashboard &nbsp;·&nbsp; Data: FRED, U.S. Census, NewsAPI &nbsp;·&nbsp;
  Built with Streamlit + Plotly &nbsp;·&nbsp; Alexander Vaslef
</div>""", unsafe_allow_html=True)
