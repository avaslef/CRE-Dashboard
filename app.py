# app.py — CRE Dashboard entry point
# ====================================
# Run:  streamlit run app.py
# Requires:  .env file with FRED_API_KEY, CENSUS_API_KEY, NEWS_API_KEY
# ====================================
from __future__ import annotations

import streamlit as st

from helpers import load_css

st.set_page_config(
    page_title="CRE Intelligence Dashboard",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded",
)

load_css()

pg = st.navigation(
    {
        "Market Analysis": [
            st.Page("pages/1_Overview.py",       title="Overview",       icon="🏠"),
            st.Page("pages/2_Market_Tiers.py",   title="Market Tiers",   icon="🗂️"),
            st.Page("pages/3_Macro_Trends.py",   title="Macro Trends",   icon="📈"),
            st.Page("pages/4_Triangle_NC.py",    title="Triangle NC",    icon="🔺"),
        ],
        "Capital & Housing": [
            st.Page("pages/5_Capital_Markets.py",    title="Capital Markets",  icon="💰"),
            st.Page("pages/7_Housing_And_Rents.py",  title="Housing & Rents",  icon="🏘️"),
        ],
        "Research & News": [
            st.Page("pages/8_Deal_Flow.py",             title="Deal Flow & News",       icon="📰"),
            st.Page("pages/9_Brokerage_Research.py",    title="Brokerage Research",     icon="🏢"),
            st.Page("pages/10_Business_Legislation.py", title="Business & Legislation", icon="⚖️"),
        ],
        "Tools": [
            st.Page("pages/6_Demand_Signals.py",      title="Demand Signals",    icon="🔍"),
            st.Page("pages/11_Interactive_Map.py",    title="Interactive Map",   icon="🗺️"),
            st.Page("pages/12_Market_Comparisons.py", title="Market Comparisons",icon="📊"),
        ],
    }
)

pg.run()
