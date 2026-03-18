# helpers.py — Data fetching, caching, and utility functions
# ----------------------------------------------------------
from __future__ import annotations

import os
import requests
import pandas as pd
import streamlit as st
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

FRED_KEY   = os.getenv("FRED_API_KEY", "")
CENSUS_KEY = os.getenv("CENSUS_API_KEY", "")
NEWS_KEY   = os.getenv("NEWS_API_KEY", "")

# ── FRED ─────────────────────────────────────────────────────────────────────

@st.cache_data(ttl=3600)
def fetch_fred_series(series_id: str, start: str = "2010-01-01") -> pd.DataFrame:
    """Fetch a single FRED time series. Returns DataFrame with date & value columns."""
    if not FRED_KEY:
        return pd.DataFrame(columns=["date", "value"])
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id":       series_id,
        "api_key":         FRED_KEY,
        "file_type":       "json",
        "observation_start": start,
        "sort_order":      "asc",
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json().get("observations", [])
        df = pd.DataFrame(data)[["date", "value"]]
        df["date"] = pd.to_datetime(df["date"])
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
        return df.dropna(subset=["value"])
    except Exception:
        # Silently return empty — bad series IDs are common for metro-level data
        return pd.DataFrame(columns=["date", "value"])


@st.cache_data(ttl=3600)
def fetch_fred_latest(series_id: str) -> float | None:
    """Return the most recent value for a FRED series."""
    df = fetch_fred_series(series_id)
    if df.empty:
        return None
    return float(df["value"].iloc[-1])


@st.cache_data(ttl=3600)
def fetch_fred_multi(series_dict: dict, start: str = "2010-01-01") -> pd.DataFrame:
    """
    Fetch multiple FRED series and merge into a single wide DataFrame.
    series_dict = {"Label": "FRED_ID", ...}
    """
    frames = {}
    for label, sid in series_dict.items():
        df = fetch_fred_series(sid, start)
        if not df.empty:
            frames[label] = df.set_index("date")["value"]
    if not frames:
        return pd.DataFrame()
    return pd.DataFrame(frames)


# ── CENSUS ───────────────────────────────────────────────────────────────────

@st.cache_data(ttl=86400)
def fetch_census_population(state_fips: str = "37") -> pd.DataFrame:
    """
    Fetch county-level population estimates for a state via Census PEP API.
    Default: North Carolina (37).
    """
    if not CENSUS_KEY:
        return pd.DataFrame()
    url = f"https://api.census.gov/data/2022/acs/acs5"
    params = {
        "get":    "NAME,B01003_001E",  # Total population
        "for":    "county:*",
        "in":     f"state:{state_fips}",
        "key":    CENSUS_KEY,
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        df = pd.DataFrame(data[1:], columns=data[0])
        df["population"] = pd.to_numeric(df["B01003_001E"], errors="coerce")
        return df[["NAME", "population", "state", "county"]]
    except Exception as e:
        st.warning(f"Census population fetch failed: {e}")
        return pd.DataFrame()


@st.cache_data(ttl=86400)
def fetch_census_cbp(state_fips: str = "37", naics: str = "531") -> pd.DataFrame:
    """
    County Business Patterns — employment & payroll for a NAICS sector.
    Default: NC real estate sector (531).
    """
    if not CENSUS_KEY:
        return pd.DataFrame()
    url = "https://api.census.gov/data/2021/cbp"
    params = {
        "get":   "NAME,NAICS2017,EMP,PAYANN,ESTAB",
        "for":   "county:*",
        "in":    f"state:{state_fips}",
        "NAICS2017": naics,
        "key":   CENSUS_KEY,
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        df = pd.DataFrame(data[1:], columns=data[0])
        for col in ["EMP", "PAYANN", "ESTAB"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        return df
    except Exception as e:
        st.warning(f"Census CBP fetch failed: {e}")
        return pd.DataFrame()


@st.cache_data(ttl=86400)
def fetch_census_building_permits(state_fips: str = "37") -> pd.DataFrame:
    """Fetch building permit data from ACS for a state."""
    if not CENSUS_KEY:
        return pd.DataFrame()
    url = "https://api.census.gov/data/2022/acs/acs5"
    params = {
        "get":   "NAME,B25004_001E",   # Vacant housing units (permit proxy)
        "for":   "county:*",
        "in":    f"state:{state_fips}",
        "key":   CENSUS_KEY,
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        df = pd.DataFrame(data[1:], columns=data[0])
        df["vacant_units"] = pd.to_numeric(df["B25004_001E"], errors="coerce")
        return df[["NAME", "vacant_units", "state", "county"]]
    except Exception as e:
        st.warning(f"Census building permits fetch failed: {e}")
        return pd.DataFrame()


@st.cache_data(ttl=86400)
def fetch_census_median_income(state_fips: str = "37") -> pd.DataFrame:
    """ACS median household income by county."""
    if not CENSUS_KEY:
        return pd.DataFrame()
    url = "https://api.census.gov/data/2022/acs/acs5"
    params = {
        "get":  "NAME,B19013_001E",
        "for":  "county:*",
        "in":   f"state:{state_fips}",
        "key":  CENSUS_KEY,
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        df = pd.DataFrame(data[1:], columns=data[0])
        df["median_income"] = pd.to_numeric(df["B19013_001E"], errors="coerce")
        return df[["NAME", "median_income", "state", "county"]]
    except Exception as e:
        st.warning(f"Census median income fetch failed: {e}")
        return pd.DataFrame()


# ── NEWS API ─────────────────────────────────────────────────────────────────

@st.cache_data(ttl=1800)
def fetch_news(query: str, page_size: int = 10, language: str = "en") -> list[dict]:
    """
    Fetch news articles from NewsAPI.org.
    Returns list of article dicts with title, description, url, publishedAt, source.
    """
    if not NEWS_KEY:
        return []
    url = "https://newsapi.org/v2/everything"
    params = {
        "q":          query,
        "apiKey":     NEWS_KEY,
        "pageSize":   page_size,
        "language":   language,
        "sortBy":     "publishedAt",
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        articles = r.json().get("articles", [])
        return articles
    except Exception as e:
        st.warning(f"NewsAPI fetch failed: {e}")
        return []


# ── YFINANCE (optional REIT proxy) ───────────────────────────────────────────

@st.cache_data(ttl=3600)
def fetch_reit_etf(ticker: str = "VNQ", period: str = "2y") -> pd.DataFrame:
    """Fetch REIT ETF price history as market sentiment proxy."""
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        df = t.history(period=period)
        df.index = pd.to_datetime(df.index)
        df = df[["Close"]].rename(columns={"Close": ticker})
        df.index.name = "date"
        return df.reset_index()
    except Exception as e:
        st.warning(f"yfinance fetch failed for {ticker}: {e}")
        return pd.DataFrame(columns=["date", ticker])


# ── GOOGLE TRENDS (pytrends — no API key needed) ─────────────────────────────

@st.cache_data(ttl=7200)
def fetch_google_trends(keywords: list, timeframe: str = "today 5-y",
                        geo: str = "US") -> pd.DataFrame:
    """
    Fetch Google Trends interest-over-time for a list of keywords.
    Returns DataFrame with date index and one column per keyword (0-100 scale).
    """
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
        pytrends.build_payload(keywords, cat=0, timeframe=timeframe, geo=geo)
        df = pytrends.interest_over_time()
        if df.empty:
            return pd.DataFrame()
        df = df.drop(columns=["isPartial"], errors="ignore")
        df.index.name = "date"
        return df.reset_index()
    except Exception:
        return pd.DataFrame()


@st.cache_data(ttl=7200)
def fetch_google_trends_by_region(keyword: str, timeframe: str = "today 5-y",
                                   geo: str = "US") -> pd.DataFrame:
    """Fetch Google Trends interest by U.S. state for a single keyword."""
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
        pytrends.build_payload([keyword], cat=0, timeframe=timeframe, geo=geo)
        df = pytrends.interest_by_region(resolution="REGION", inc_low_vol=True, inc_geo_code=True)
        df = df.reset_index()
        return df
    except Exception:
        return pd.DataFrame()


# ── ZILLOW RESEARCH DATA (free CSV downloads — no key) ───────────────────────

ZILLOW_URLS = {
    "zhvi_metro": "https://files.zillowstatic.com/research/public_csvs/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv",
    "zori_metro": "https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomfr_sm_sa_month.csv",
}


@st.cache_data(ttl=86400)
def fetch_zillow_data(dataset: str = "zhvi_metro") -> pd.DataFrame:
    """
    Download Zillow research CSV. Returns wide DataFrame with metro rows and monthly columns.
    dataset: 'zhvi_metro' (home values) or 'zori_metro' (observed rents).
    """
    url = ZILLOW_URLS.get(dataset)
    if not url:
        return pd.DataFrame()
    try:
        df = pd.read_csv(url, low_memory=False)
        return df
    except Exception:
        return pd.DataFrame()


@st.cache_data(ttl=86400)
def get_zillow_metro_ts(dataset: str, metro_name: str) -> pd.DataFrame:
    """
    Extract a single metro's time series from Zillow wide data.
    Returns DataFrame with columns: date, value.
    """
    df = fetch_zillow_data(dataset)
    if df.empty:
        return pd.DataFrame(columns=["date", "value"])
    # Find the metro row
    name_col = "RegionName"
    if name_col not in df.columns:
        return pd.DataFrame(columns=["date", "value"])
    row = df[df[name_col].str.contains(metro_name, case=False, na=False)]
    if row.empty:
        return pd.DataFrame(columns=["date", "value"])
    # Date columns are the ones that look like YYYY-MM-DD
    date_cols = [c for c in df.columns if len(c) == 10 and c[4] == "-"]
    if not date_cols:
        return pd.DataFrame(columns=["date", "value"])
    row = row.iloc[0]
    vals = row[date_cols].values
    result = pd.DataFrame({"date": pd.to_datetime(date_cols), "value": pd.to_numeric(vals, errors="coerce")})
    return result.dropna(subset=["value"])


@st.cache_data(ttl=86400)
def get_zillow_latest_multi(dataset: str, metro_names: list) -> pd.DataFrame:
    """Get the latest value for multiple metros. Returns DataFrame with Metro, Latest, YoY columns."""
    df = fetch_zillow_data(dataset)
    if df.empty:
        return pd.DataFrame()
    name_col = "RegionName"
    if name_col not in df.columns:
        return pd.DataFrame()
    date_cols = sorted([c for c in df.columns if len(c) == 10 and c[4] == "-"])
    if len(date_cols) < 13:
        return pd.DataFrame()
    latest_col = date_cols[-1]
    yoy_col = date_cols[-13] if len(date_cols) >= 13 else date_cols[0]
    rows = []
    for metro in metro_names:
        match = df[df[name_col].str.contains(metro, case=False, na=False)]
        if not match.empty:
            r = match.iloc[0]
            latest = pd.to_numeric(r.get(latest_col), errors="coerce")
            prev = pd.to_numeric(r.get(yoy_col), errors="coerce")
            yoy = ((latest - prev) / prev * 100) if (pd.notna(latest) and pd.notna(prev) and prev != 0) else None
            rows.append({
                "Metro": r[name_col],
                "Latest": latest,
                "YoY %": round(yoy, 1) if yoy is not None else None,
                "As Of": latest_col,
            })
    return pd.DataFrame(rows)


# ── BEA (Bureau of Economic Analysis — free API key) ─────────────────────────

BEA_KEY = os.getenv("BEA_API_KEY", "")


@st.cache_data(ttl=86400)
def fetch_bea_gdp_metro() -> pd.DataFrame:
    """
    Fetch GDP by metropolitan area from BEA Regional API.
    Returns DataFrame with metro, year, gdp columns.
    """
    if not BEA_KEY:
        return pd.DataFrame()
    url = "https://apps.bea.gov/api/data/"
    params = {
        "UserID":      BEA_KEY,
        "method":      "GetData",
        "datasetname": "Regional",
        "TableName":   "CAGDP1",    # GDP summary
        "LineCode":    "1",          # All industry total
        "GeoFips":     "MSA",
        "Year":        "LAST5",
        "ResultFormat": "JSON",
    }
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json().get("BEAAPI", {}).get("Results", {}).get("Data", [])
        if not data:
            return pd.DataFrame()
        df = pd.DataFrame(data)
        df["DataValue"] = pd.to_numeric(df["DataValue"].str.replace(",", ""), errors="coerce")
        df = df.rename(columns={"GeoName": "Metro", "TimePeriod": "Year", "DataValue": "GDP_thousands"})
        return df[["Metro", "Year", "GDP_thousands"]].dropna()
    except Exception:
        return pd.DataFrame()


@st.cache_data(ttl=86400)
def fetch_bea_personal_income_metro() -> pd.DataFrame:
    """Fetch per-capita personal income by metro from BEA."""
    if not BEA_KEY:
        return pd.DataFrame()
    url = "https://apps.bea.gov/api/data/"
    params = {
        "UserID":      BEA_KEY,
        "method":      "GetData",
        "datasetname": "Regional",
        "TableName":   "CAINC1",    # Personal income summary
        "LineCode":    "3",          # Per capita personal income
        "GeoFips":     "MSA",
        "Year":        "LAST5",
        "ResultFormat": "JSON",
    }
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json().get("BEAAPI", {}).get("Results", {}).get("Data", [])
        if not data:
            return pd.DataFrame()
        df = pd.DataFrame(data)
        df["DataValue"] = pd.to_numeric(df["DataValue"].str.replace(",", ""), errors="coerce")
        df = df.rename(columns={"GeoName": "Metro", "TimePeriod": "Year", "DataValue": "PerCapitaIncome"})
        return df[["Metro", "Year", "PerCapitaIncome"]].dropna()
    except Exception:
        return pd.DataFrame()


# ── UTILITIES ─────────────────────────────────────────────────────────────────

def format_number(val, prefix="", suffix="", decimals=1) -> str:
    """Format large numbers with K/M/B suffixes."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return "N/A"
    try:
        val = float(val)
        if abs(val) >= 1e9:
            return f"{prefix}{val/1e9:.{decimals}f}B{suffix}"
        elif abs(val) >= 1e6:
            return f"{prefix}{val/1e6:.{decimals}f}M{suffix}"
        elif abs(val) >= 1e3:
            return f"{prefix}{val/1e3:.{decimals}f}K{suffix}"
        else:
            return f"{prefix}{val:.{decimals}f}{suffix}"
    except Exception:
        return str(val)


def pct_change_label(series: pd.Series, periods: int = 1) -> str:
    """Compute % change over N periods and return colored label."""
    if len(series) < periods + 1:
        return ""
    pct = (series.iloc[-1] - series.iloc[-1 - periods]) / abs(series.iloc[-1 - periods]) * 100
    arrow = "▲" if pct >= 0 else "▼"
    color = "green" if pct >= 0 else "red"
    return f'<span style="color:{color}">{arrow} {abs(pct):.1f}%</span>'


def last_updated_badge() -> str:
    return f"*Data refreshed: {datetime.now().strftime('%b %d, %Y %H:%M')}*"


def api_key_warning(key_name: str):
    """Show a warning card if an API key is missing."""
    st.warning(
        f"**{key_name} not configured.** Add it to your `.env` file to load live data. "
        f"See the README for instructions.",
        icon="⚠️",
    )


def render_glossary_expander(terms: list[str], glossary: dict):
    """Render a collapsible glossary for selected terms."""
    with st.expander("📖 Glossary — hover for definitions"):
        for term in terms:
            if term in glossary:
                st.markdown(f"**{term}:** {glossary[term]}")


def source_badge(label: str, url: str):
    st.markdown(f'<p class="source-link">Source: <a href="{url}" target="_blank">{label}</a></p>',
                unsafe_allow_html=True)


def news_card(article: dict):
    """Render a single news article as a styled card."""
    title  = article.get("title", "No title")
    desc   = article.get("description", "")
    link   = article.get("url", "#")
    source = article.get("source", {}).get("name", "Unknown")
    pub    = article.get("publishedAt", "")[:10]
    st.markdown(f"""
<div class="news-card">
  <a href="{link}" target="_blank">{title}</a>
  <div class="meta">{source} &nbsp;·&nbsp; {pub}</div>
  <div class="desc">{desc or ''}</div>
</div>""", unsafe_allow_html=True)
