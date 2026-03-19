from __future__ import annotations

import pandas as pd
import streamlit as st

from helpers import (
    fetch_news,
    api_key_warning, source_badge, news_card,
    df_download_btn,
    load_css, render_sidebar,
    NEWS_KEY,
)

st.set_page_config(
    page_title="Deal Flow & News — CRE Intelligence",
    page_icon="📰",
    layout="wide",
    initial_sidebar_state="expanded",
)

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
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
    st.stop()

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

        with st.expander("📋 Table View"):
            df_news = pd.DataFrame([{
                "Date":   a.get("publishedAt", "")[:10],
                "Title":  a.get("title", ""),
                "Source": a.get("source", {}).get("name", ""),
                "URL":    a.get("url", ""),
            } for a in articles])
            st.dataframe(df_news[["Date", "Title", "Source"]], use_container_width=True, hide_index=True)
            df_download_btn(df_news, "deal_flow_news.csv")

        st.subheader("Article Cards")
        for a in articles:
            news_card(a)
    else:
        st.info("No results. NewsAPI free tier limits: 100 req/day, past 30 days only.")

    source_badge("NewsAPI.org", "https://newsapi.org")

st.divider()
st.markdown("""
<div style="text-align:center;padding:8px 0;color:#475569;font-size:0.78em">
  CRE Intelligence Dashboard &nbsp;·&nbsp; Data: FRED, U.S. Census, NewsAPI &nbsp;·&nbsp;
  Built with Streamlit + Plotly &nbsp;·&nbsp; Alexander Vaslef
</div>""", unsafe_allow_html=True)
