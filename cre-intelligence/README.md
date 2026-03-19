# CRE Intelligence Dashboard — Next.js Edition

A jaw-dropping, production-ready **Commercial Real Estate Analytics dashboard** built with Next.js 15, Tailwind CSS v4, Framer Motion, Recharts, and React Leaflet.

---

## ✨ Features

- **Dark cosmic UI** with glassmorphism cards, neon cyan/green glow system
- **Animated count-up KPI cards** with hover lift + border pulse effects
- **Interactive U.S. market map** (React Leaflet) with tier-colored pins, Triangle NC spotlight
- **Animated charts** (Recharts) with neon tooltips, animated path draws on load
- **Particle canvas background** that reacts to mouse movement
- **Collapsible sidebar** with smooth Framer Motion animation
- **Live data** from FRED, U.S. Census, and NewsAPI (all free!)
- **Confetti burst** on data refresh (canvas-confetti)
- **CSV export** on every chart and data table
- **12 full pages**: Overview, Market Tiers, Macro Trends, Triangle NC Deep Dive, Capital Markets, Housing & Rents, Deal Flow, Brokerage Research, Business & Legislation, Demand Signals, Interactive Map, Market Comparisons
- **Fully mobile-responsive** + Vercel one-click deploy

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd cre-dashboard-next
npm install
```

### 2. Set up API keys

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your free API keys:

| Key | Free Sign-Up URL | Required? |
|-----|-----------------|-----------|
| `FRED_API_KEY` | [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) | **Yes** (most charts) |
| `CENSUS_API_KEY` | [api.census.gov](https://api.census.gov/data/key_signup.html) | Yes (Triangle NC tab) |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org/register) | Yes (news feeds) |
| `BEA_API_KEY` | [apps.bea.gov](https://apps.bea.gov/API/signup/) | Optional |

> All keys are **completely free**. FRED and Census have no rate limits for typical usage. NewsAPI free tier is 100 req/day.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the Overview tab.

---

## 🏗️ Project Structure

```
cre-dashboard-next/
├── app/
│   ├── layout.tsx              ← Root layout (fonts, metadata)
│   ├── page.tsx                ← Redirects to /overview
│   ├── globals.css             ← Dark theme, glassmorphism, neon system
│   ├── api/
│   │   ├── fred/route.ts       ← FRED API proxy (server-side key)
│   │   ├── census/route.ts     ← Census API proxy
│   │   └── news/route.ts       ← NewsAPI proxy
│   └── (dashboard)/
│       ├── layout.tsx          ← Sidebar + Navbar shell
│       ├── overview/page.tsx
│       ├── market-tiers/page.tsx
│       ├── macro-trends/page.tsx
│       ├── triangle-nc/page.tsx
│       ├── capital-markets/page.tsx
│       ├── housing/page.tsx
│       ├── deal-flow/page.tsx
│       ├── research/page.tsx
│       ├── legislation/page.tsx
│       ├── demand-signals/page.tsx
│       ├── map/page.tsx
│       └── comparisons/page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         ← Collapsible animated sidebar
│   │   ├── Navbar.tsx          ← Top bar with refresh + confetti
│   │   └── ParticleBackground.tsx ← Hand-rolled canvas particles
│   ├── ui/
│   │   ├── KPICard.tsx         ← Glass KPI card with count-up
│   │   ├── InsightCard.tsx     ← Insight bullet list
│   │   ├── GlowBadge.tsx       ← Neon tier/growth badges
│   │   ├── NewsCard.tsx        ← News article card
│   │   └── LoadingSkeleton.tsx ← Shimmer skeletons
│   ├── charts/
│   │   ├── LineChart.tsx       ← Animated Recharts line chart
│   │   └── BarChart.tsx        ← Animated Recharts bar chart
│   └── map/
│       ├── InteractiveMap.tsx  ← React Leaflet map
│       └── MapWrapper.tsx      ← Dynamic SSR-disabled wrapper
├── lib/
│   ├── constants.ts            ← Market tiers, FRED IDs, glossary
│   ├── api.ts                  ← Client-side fetch helpers
│   └── utils.ts                ← formatNumber, exportCsv, etc.
├── hooks/
│   ├── useCountUp.ts           ← Animated number count-up
│   └── useDataRefresh.ts       ← Generic async data hook
├── types/index.ts              ← TypeScript interfaces
├── .env.example                ← API key template
└── README.md
```

---

## 🌐 Deploy to Vercel (Free)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Set **Root Directory** to `cre-dashboard-next`
4. Add your environment variables (FRED_API_KEY, CENSUS_API_KEY, NEWS_API_KEY)
5. Click **Deploy** — live in ~60 seconds! 🚀

---

## 📊 Data Sources

| Source | Data | Cost |
|--------|------|------|
| [FRED (St. Louis Fed)](https://fred.stlouisfed.org) | Fed Funds Rate, CRE Price Index, Treasury yields, GDP, unemployment | Free |
| [U.S. Census Bureau ACS](https://data.census.gov) | County population, median income | Free |
| [Census County Business Patterns](https://www.census.gov/programs-surveys/cbp.html) | Real estate sector employment | Free |
| [NewsAPI.org](https://newsapi.org) | CRE news, legislation news | Free (100 req/day) |
| [Zillow Research](https://www.zillow.com/research/data/) | ZHVI, ZORI metro time series | Free (CSV download) |
| [Google Trends](https://trends.google.com) | CRE search interest | Free |

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#050505` | Page background |
| Neon Cyan | `#00f5ff` | Primary accent, active states |
| Neon Green | `#00ff9d` | Growth indicators, Tier 2 |
| Gateway Red | `#ef4444` | Gateway market tier |
| Tier 1 Amber | `#f59e0b` | Tier 1 markets |
| Display Font | Orbitron | Logo, KPI numbers |
| Heading Font | Outfit | Section titles |
| Body Font | DM Sans | UI text, tooltips |

---

## 🔧 Tech Stack

- **Next.js 15** (App Router, Server Components, API Routes)
- **TypeScript** — fully typed
- **Tailwind CSS v4** — CSS-first config with `@theme` tokens
- **Framer Motion** — page transitions, hover effects, count-up
- **Recharts** — animated line & bar charts
- **React Leaflet** — interactive CRE market map
- **canvas-confetti** — refresh data celebration 🎉
- **Lucide React** — icon library
- **date-fns** — date formatting

---

## 📝 License

MIT — personal hobby project. Data sourced from free public APIs.

Built with ❤️ by Alexander Vaslef
