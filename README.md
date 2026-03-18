# CRE Intelligence Dashboard

A fully interactive Commercial Real Estate (CRE) web dashboard built with **100% free APIs** and open-source libraries. Designed for market analysis with a focus on the Triangle region of NC (Raleigh-Durham-Chapel Hill).

---

## Screenshots

The dashboard includes 8 navigation pages:
- **Overview** — National macro KPIs and tier summary cards
- **Market Tiers** — All 30+ MSAs with unemployment comparisons
- **Macro Trends** — CRE price index, rates, GDP, construction spending
- **Triangle NC Deep Dive** — The star section: local macros, RTP facts, Census data, live news
- **Deal Flow & News** — Live news feed (NewsAPI), filterable by query
- **Business & Legislation** — NC tax environment, policy news, incentives
- **Interactive Map** — Folium choropleth/marker map by tier (or Plotly fallback)
- **Market Comparisons** — Multi-select side-by-side analysis

---

## Quickstart

### 1. Clone / download

```bash
cd "CRE Dashboard"
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> **Optional:** For PNG export from charts, also install `kaleido`:
> ```bash
> pip install kaleido
> ```

### 3. Get your free API keys

#### FRED API (Federal Reserve Economic Data)
- URL: https://fred.stlouisfed.org/docs/api/api_key.html
- Sign up for a free account at stlouisfed.org
- Go to **My Account → API Keys** and generate a key
- Takes ~1 minute; key is active immediately

#### U.S. Census Bureau API
- URL: https://api.census.gov/data/key_signup.html
- Fill in name and email — key is emailed instantly
- Free, no rate limit for personal/research use

#### NewsAPI.org
- URL: https://newsapi.org/register
- Free developer plan: **100 requests/day**, articles from past 30 days
- Sign up and copy your API key from the dashboard

### 4. Configure environment

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder values:
```
FRED_API_KEY=your_actual_fred_key
CENSUS_API_KEY=your_actual_census_key
NEWS_API_KEY=your_actual_newsapi_key
```

### 5. Run the dashboard

```bash
streamlit run app.py
```

The app opens at **http://localhost:8501**

---

## Free Deployment (Share with Professor)

### Streamlit Community Cloud (100% free)

1. Push this repo to GitHub (public or private)
2. Visit https://share.streamlit.io
3. Click **New app** → connect your GitHub repo
4. Set **Main file**: `app.py`
5. Under **Advanced settings → Secrets**, add your API keys in TOML format:
   ```toml
   FRED_API_KEY = "your_key"
   CENSUS_API_KEY = "your_key"
   NEWS_API_KEY = "your_key"
   ```
6. Deploy — you'll get a public URL like `https://yourname-cre-dashboard.streamlit.app`

> Note: On Streamlit Cloud, use `st.secrets["FRED_API_KEY"]` instead of `.env`. The app is pre-configured to read from environment variables, which Streamlit Cloud populates from secrets automatically.

---

## Data Sources

| Source | Data | API | Free Tier |
|--------|------|-----|-----------|
| [FRED (St. Louis Fed)](https://fred.stlouisfed.org) | CRE price index, unemployment, rates, GDP | `fredapi` + REST | ✅ Unlimited |
| [U.S. Census Bureau](https://api.census.gov) | Population, income, business patterns | REST | ✅ Unlimited |
| [NewsAPI.org](https://newsapi.org) | CRE news, deals, legislation | REST | ✅ 100 req/day |
| [yfinance](https://pypi.org/project/yfinance/) | VNQ REIT ETF (sentiment proxy) | Python lib | ✅ Free |

---

## Key FRED Series Used

| Series ID | Description |
|-----------|-------------|
| `COMREPUSQ159N` | National CRE Price Index |
| `FEDFUNDS` | Federal Funds Rate |
| `UNRATE` | National Unemployment Rate |
| `DGS10` | 10-Year Treasury Yield |
| `CPIAUCSL` | Consumer Price Index |
| `MORTGAGE30US` | 30-Year Mortgage Rate |
| `RALE537URN` | Raleigh-Cary Unemployment |
| `DURH063URN` | Durham Unemployment |
| `NCURN` | North Carolina Unemployment |
| `TLNRESCONS` | Non-Residential Construction Spending |

Full list of metro unemployment series: `{MSA_ID}URN` (e.g., `ATLA013URN` for Atlanta)

---

## Project Structure

```
CRE Dashboard/
├── app.py           # Main Streamlit application (all 8 pages)
├── config.py        # Market tiers, FRED series IDs, colors, glossary
├── helpers.py       # Data fetching functions (FRED, Census, News, yfinance)
├── charts.py        # Reusable Plotly chart builders
├── requirements.txt # Python dependencies
├── .env.example     # Template for API keys
├── .env             # Your actual keys (DO NOT commit to git)
└── README.md        # This file
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| Charts show "Add FRED API key" | Add `FRED_API_KEY` to `.env` |
| Map doesn't render | Run `pip install folium streamlit-folium` |
| PNG export fails | Run `pip install kaleido` |
| NewsAPI returns nothing | Free tier only has past 30 days; key may need reset |
| FRED series returns empty | Some metro series IDs may vary; check FRED website |

---

## For the MBA Classroom

Key CRE concepts covered:
- **Market tiering** — Gateway, Tier 1, Tier 2/Emerging classification
- **Cap rate dynamics** — relationship to 10-yr Treasury and NOI
- **Market cycle** — using unemployment and construction spending as cycle indicators
- **Supply/demand** — building permits vs. absorption
- **Research Triangle thesis** — why the Triangle is a compelling Tier 2 investment story
- **Risk factors** — rate sensitivity, office vacancy, supply pipeline

---

*Built with Streamlit, Plotly, Folium | Data from FRED, Census, NewsAPI | Free & open source*
