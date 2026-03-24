# CRE Intelligence Dashboard

A fully interactive Commercial Real Estate (CRE) web dashboard built with **Next.js 15, React 19, and TypeScript** using **100% free APIs**. Designed for market analysis with a focus on the Triangle region of NC (Raleigh-Durham-Chapel Hill) — developed for UNC Chapel Hill's Kenan-Flagler Business School MBA program.

---

## Pages

| Page | Description |
|------|-------------|
| **Overview** | National macro KPIs, market tier summary cards, live FRED data |
| **Market Tiers** | All 30+ MSAs with unemployment comparisons and tier classification |
| **Macro Trends** | CRE price index, rates, GDP, construction spending (FRED) |
| **Triangle NC Deep Dive** | Local macros, RTP facts, Census population & income data, live news |
| **Demand Signals** | Retail sales, unemployment, GDP, Google Trends CRE search interest |
| **Capital Markets** | Treasury yields, cap rate model, CSHI index, Fed Funds |
| **Market Comparisons** | Multi-market side-by-side unemployment comparison |
| **Interactive Map** | Leaflet map of all tracked MSAs with tier color-coding |
| **Deal Flow & News** | Live news feed via NewsAPI, filterable by query |
| **Business & Legislation** | NC tax environment, policy news, business incentives |
| **Forecasting** | Yield curve monitor, cap rate model (Gordon Growth), DSCR stress test, financial conditions heatmap |

---

## Quickstart

### 1. Clone the repo

```bash
git clone https://github.com/alexvaslef/cre-dashboard.git
cd "cre-dashboard/cre-intelligence"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Get your free API keys

#### FRED API (Federal Reserve Economic Data)
- Sign up at https://fred.stlouisfed.org/docs/api/api_key.html
- Go to **My Account → API Keys** and generate a key

#### U.S. Census Bureau API
- Register at https://api.census.gov/data/key_signup.html
- Key is emailed instantly; free with no rate limit for personal/research use

#### NewsAPI.org
- Register at https://newsapi.org/register
- Free developer plan: 100 requests/day

### 4. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

```
FRED_API_KEY=your_fred_key
CENSUS_API_KEY=your_census_key
NEWS_API_KEY=your_newsapi_key
```

### 5. Run the dev server

```bash
npm run dev
```

Open **http://localhost:3000**

---

## Deployment (Vercel — free)

1. Push repo to GitHub
2. Import at https://vercel.com/new
3. Set **Root Directory** to `cre-intelligence`
4. Add environment variables (`FRED_API_KEY`, `CENSUS_API_KEY`, `NEWS_API_KEY`) under **Settings → Environment Variables**
5. Deploy — you'll get a public URL automatically

---

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript |
| Charts | Recharts |
| Map | Leaflet / react-leaflet |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | CSS custom properties (dark neon theme) |

---

## Data Sources

| Source | Data | Free Tier |
|--------|------|-----------|
| [FRED (St. Louis Fed)](https://fred.stlouisfed.org) | CRE price index, unemployment, rates, GDP, yield curve | ✅ Unlimited |
| [U.S. Census Bureau](https://api.census.gov) | Population, income, business patterns | ✅ Unlimited |
| [NewsAPI.org](https://newsapi.org) | CRE news, deals, legislation | ✅ 100 req/day |
| [Google Trends](https://trends.google.com) | CRE search interest (embedded iframes) | ✅ Free |

---

## Key FRED Series

| Series ID | Description |
|-----------|-------------|
| `COMREPUSQ159N` | National CRE Price Index |
| `FEDFUNDS` | Federal Funds Rate |
| `UNRATE` | National Unemployment Rate |
| `DGS10` | 10-Year Treasury Yield |
| `DGS2` | 2-Year Treasury Yield |
| `MORTGAGE30US` | 30-Year Mortgage Rate |
| `BAMLH0A0HYM2` | High Yield OAS Spread |
| `RALE537URN` | Raleigh-Cary Unemployment |
| `DURH063URN` | Durham Unemployment |
| `NCURN` | North Carolina Unemployment |
| `TLNRESCONS` | Non-Residential Construction Spending |

---

## Project Structure

```
cre-intelligence/
├── app/
│   ├── (dashboard)/         # All page routes
│   │   ├── overview/
│   │   ├── market-tiers/
│   │   ├── macro-trends/
│   │   ├── triangle-nc/
│   │   ├── demand-signals/
│   │   ├── capital-markets/
│   │   ├── comparisons/
│   │   ├── map/
│   │   ├── deal-flow/
│   │   ├── housing/
│   │   ├── legislation/
│   │   ├── research/
│   │   └── forecasting/
│   └── api/                 # Proxied API routes (FRED, Census, News)
├── components/
│   ├── charts/              # LineChart, BarChart (Recharts)
│   ├── layout/              # Sidebar, Navbar, ParticleBackground
│   ├── map/                 # InteractiveMap (Leaflet)
│   └── ui/                  # KPICard, LoadingSkeleton, ErrorBoundary, etc.
├── lib/
│   ├── api.ts               # Data fetching helpers + client-side cache
│   ├── constants.ts         # Market tiers, FRED series IDs, color maps
│   └── utils.ts             # Formatting, CSV export, chart PNG export
└── types/                   # Shared TypeScript interfaces
```

---

## Academic Models (Forecasting Tab)

The Forecasting page implements academically published CRE models:

- **Yield Curve Monitor** — Harvey (1988) recession predictor via 10Y-2Y spread
- **Cap Rate Model** — Gordon Growth variant: `Cap Rate = Risk-Free Rate + Risk Premium − Growth`
- **DSCR Stress Test** — Debt Service Coverage Ratio with interest rate shock scenarios
- **Financial Conditions Heatmap** — Multi-indicator CRE stress dashboard

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Charts show no data | Verify `FRED_API_KEY` is set in `.env.local` |
| Map doesn't render | SSR conflict — map uses `"use client"` and mounts only after hydration |
| News feed empty | NewsAPI free tier: 100 req/day limit; key may need reset |
| Build errors | Run `npm install` then `npm run build` |

---

*Built with Next.js 15, React 19, Recharts, Leaflet | Data from FRED, Census, NewsAPI | Free & open source*
