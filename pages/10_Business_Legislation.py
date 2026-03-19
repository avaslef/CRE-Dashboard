from __future__ import annotations

import streamlit as st

from helpers import (
    fetch_news,
    api_key_warning, source_badge, news_card,
    insight_card,
    load_css, render_sidebar, render_footer,
    NEWS_KEY,
)

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>⚖️ Business Climate & Legislation</h1></div>',
            unsafe_allow_html=True)
st.markdown("Key policy environment, state incentives, and legislative trends affecting CRE in the Triangle and NC.")

st.subheader("North Carolina Business Climate — Key Facts")
facts = {
    "Corporate Tax Rate":         "2.5% (flat) — decreasing to 0% by 2030 per HB 334",
    "Individual Income Tax":      "Flat 4.5% (2024), trending toward 3.99%",
    "Property Tax (Wake County)": "~$0.60 per $100 assessed value (Raleigh city + county)",
    "Right-to-Work State":        "Yes — reduces labor friction for employers",
    "Opportunity Zones":          "252 designated OZs in NC, including parts of Durham and Raleigh",
    "JDIG Incentive Program":     "Job Development Investment Grant — cash grants for new jobs created in NC",
    "Site Readiness Program":     "NC DEQ/Commerce pre-permitted industrial sites program",
    "UNC System R&D Spending":    "$1.4B+ annually — major demand driver for lab/office CRE",
}
for k, v in facts.items():
    st.markdown(f"**{k}:** {v}")

st.divider()

st.subheader("Live Policy & Legislation News")
if NEWS_KEY:
    queries = {
        "NC CRE Legislation":     "North Carolina commercial real estate legislation OR zoning OR incentives",
        "Triangle Development":   "Raleigh Durham development permit zoning OR rezoning",
        "NC Business Incentives": "North Carolina business incentive JDIG OR opportunity zone OR tax",
        "CRE Policy National":    "commercial real estate policy legislation federal 2024 2025",
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

render_footer()
