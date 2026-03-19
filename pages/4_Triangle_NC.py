from __future__ import annotations

import streamlit as st

from config import TRIANGLE_SERIES, NATIONAL_SERIES, COLORS, GLOSSARY, NAICS_REAL_ESTATE
from helpers import (
    fetch_fred_latest, fetch_fred_multi,
    fetch_census_population, fetch_census_median_income, fetch_census_cbp,
    fetch_news,
    api_key_warning, source_badge, render_glossary_expander,
    metric_card, insight_card, df_download_btn, fig_download_btn,
    load_css, render_sidebar, render_footer,
    FRED_KEY, CENSUS_KEY, NEWS_KEY,
)
from charts import line_chart, bar_chart

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>🔺 Triangle NC Deep Dive</h1></div>', unsafe_allow_html=True)
st.markdown("**Research Triangle** — Raleigh, Durham & Chapel Hill. One of the fastest-growing metros in the U.S.")

render_glossary_expander(["RTP", "Cap Rate", "Absorption", "Vacancy Rate", "MSA"], GLOSSARY)

# ── Hero KPIs ─────────────────────────────────────────────────────────────
col1, col2, col3, col4 = st.columns(4)

rale_unemp = fetch_fred_latest(TRIANGLE_SERIES["raleigh_unemp"]) if FRED_KEY else None
durh_unemp = fetch_fred_latest(TRIANGLE_SERIES["durham_unemp"])  if FRED_KEY else None
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
            "Raleigh-Cary": TRIANGLE_SERIES["raleigh_unemp"],
            "Durham":       TRIANGLE_SERIES["durham_unemp"],
            "NC Statewide": TRIANGLE_SERIES["nc_unemp"],
            "National":     NATIONAL_SERIES["national_unemp"],
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
    df_pop = fetch_census_population("37")
    if not df_pop.empty:
        triangle_names = ["Wake", "Durham", "Orange", "Chatham", "Johnston"]
        df_pop["is_triangle"] = df_pop["NAME"].apply(
            lambda x: any(n in x for n in triangle_names)
        )
        df_tri_pop = df_pop[df_pop["is_triangle"]].copy()

        if not df_tri_pop.empty:
            df_tri_pop["County"] = df_tri_pop["NAME"].str.replace(
                r" County, North Carolina", "", regex=True)
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
        df_download_btn(df_nc_top[["County", "EMP", "PAYANN", "ESTAB"]], "re_employment_nc.csv")
        source_badge("Census County Business Patterns 2021",
                     "https://www.census.gov/programs-surveys/cbp.html")

st.divider()

# ── RTP & Key Employers ────────────────────────────────────────────────────
st.subheader("Research Triangle Park — Key Facts")
col_rtp1, col_rtp2, col_rtp3 = st.columns(3)
rtp_facts = [
    ("Acreage",            "7,000 acres", "7,000-acre dedicated R&D campus"),
    ("Companies",          "300+",         "Global tech, pharma & life-sci tenants"),
    ("Workers (on-site)",  "~65,000",      "Direct employees in RTP campus"),
    ("Est. Economic Impact","$2.7B+",      "Annual contribution to NC economy"),
    ("Major Tenants",      "IBM, Cisco, GSK, Biogen, EPA, RTI International", ""),
    ("CRE Demand",         "Industrial, Lab/R&D, Data Centers", "Hot CRE property types in Triangle"),
]
for i, (k, v, note) in enumerate(rtp_facts):
    with [col_rtp1, col_rtp2, col_rtp3][i % 3]:
        metric_card(k, v, note, "🔬" if i < 3 else "🏭")

st.divider()

# ── News Feed ──────────────────────────────────────────────────────────────
from helpers import news_card  # noqa: E402

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

render_footer()
