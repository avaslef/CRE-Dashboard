import type { MarketTiers } from "@/types";

// ─── MARKET TIER DATA (ported from config.py) ────────────────────────────────
export const MARKET_TIERS: MarketTiers = {
  Gateway: {
    color: "#ef4444",
    neonColor: "#ff6b6b",
    badgeClass: "badge-gateway",
    markets: [
      { name: "New York, NY",     msa: "New York-Newark-Jersey City",    fredUnemp: "NEWY636URN",  lat: 40.7128,  lon: -74.0060,  state: "NY" },
      { name: "Los Angeles, CA",  msa: "Los Angeles-Long Beach-Anaheim", fredUnemp: "LOSA106URN",  lat: 34.0522,  lon: -118.2437, state: "CA" },
      { name: "Chicago, IL",      msa: "Chicago-Naperville-Elgin",       fredUnemp: "CHIC917URN",  lat: 41.8781,  lon: -87.6298,  state: "IL" },
      { name: "San Francisco, CA",msa: "San Francisco-Oakland-Berkeley", fredUnemp: "SANF806URN",  lat: 37.7749,  lon: -122.4194, state: "CA" },
      { name: "Boston, MA",       msa: "Boston-Cambridge-Newton",        fredUnemp: "BOST625URN",  lat: 42.3601,  lon: -71.0589,  state: "MA" },
      { name: "Washington, DC",   msa: "Washington-Arlington-Alexandria",fredUnemp: "WASH911URN",  lat: 38.9072,  lon: -77.0369,  state: "DC" },
      { name: "Seattle, WA",      msa: "Seattle-Tacoma-Bellevue",        fredUnemp: "SEAT653URN",  lat: 47.6062,  lon: -122.3321, state: "WA" },
    ],
  },
  "Tier 1": {
    color: "#f59e0b",
    neonColor: "#fcd34d",
    badgeClass: "badge-tier1",
    markets: [
      { name: "Atlanta, GA",      msa: "Atlanta-Sandy Springs-Roswell",  fredUnemp: "ATLA013URN",  lat: 33.7490,  lon: -84.3880,  state: "GA" },
      { name: "Dallas, TX",       msa: "Dallas-Fort Worth-Arlington",    fredUnemp: "DALL148URN",  lat: 32.7767,  lon: -96.7970,  state: "TX" },
      { name: "Houston, TX",      msa: "Houston-The Woodlands-Sugar Land",fredUnemp: "HOUS448URN", lat: 29.7604,  lon: -95.3698,  state: "TX" },
      { name: "Miami, FL",        msa: "Miami-Fort Lauderdale-West Palm",fredUnemp: "MIAM112URN",  lat: 25.7617,  lon: -80.1918,  state: "FL" },
      { name: "Phoenix, AZ",      msa: "Phoenix-Mesa-Scottsdale",        fredUnemp: "PHOE004URN",  lat: 33.4484,  lon: -112.0740, state: "AZ" },
      { name: "Denver, CO",       msa: "Denver-Aurora-Lakewood",         fredUnemp: "DENV708URN",  lat: 39.7392,  lon: -104.9903, state: "CO" },
      { name: "Austin, TX",       msa: "Austin-Round Rock",              fredUnemp: "AUST448URN",  lat: 30.2672,  lon: -97.7431,  state: "TX" },
      { name: "San Diego, CA",    msa: "San Diego-Carlsbad",             fredUnemp: "SAND706URN",  lat: 32.7157,  lon: -117.1611, state: "CA" },
      { name: "Portland, OR",     msa: "Portland-Vancouver-Hillsboro",   fredUnemp: "PORT941URN",  lat: 45.5051,  lon: -122.6750, state: "OR" },
      { name: "Minneapolis, MN",  msa: "Minneapolis-St. Paul-Bloomington",fredUnemp: "MINN427URN", lat: 44.9778,  lon: -93.2650,  state: "MN" },
    ],
  },
  "Tier 2 / Emerging": {
    color: "#00ff9d",
    neonColor: "#00ff9d",
    badgeClass: "badge-tier2",
    markets: [
      { name: "Raleigh-Durham, NC",  msa: "Raleigh-Cary",                  fredUnemp: "RALE537URN",  lat: 35.7796,  lon: -78.6382,  state: "NC", highlight: true },
      { name: "Charlotte, NC",       msa: "Charlotte-Concord-Gastonia",     fredUnemp: "CHAR737URN",  lat: 35.2271,  lon: -80.8431,  state: "NC" },
      { name: "Nashville, TN",       msa: "Nashville-Davidson-Murfreesboro",fredUnemp: "NASH947URN",  lat: 36.1627,  lon: -86.7816,  state: "TN" },
      { name: "Orlando, FL",         msa: "Orlando-Kissimmee-Sanford",      fredUnemp: "ORLA712URN",  lat: 28.5383,  lon: -81.3792,  state: "FL" },
      { name: "Las Vegas, NV",       msa: "Las Vegas-Henderson-Paradise",   fredUnemp: "LASV832URN",  lat: 36.1699,  lon: -115.1398, state: "NV" },
      { name: "Tampa, FL",           msa: "Tampa-St. Petersburg-Clearwater",fredUnemp: "TAMP312URN",  lat: 27.9506,  lon: -82.4572,  state: "FL" },
      { name: "Indianapolis, IN",    msa: "Indianapolis-Carmel-Anderson",   fredUnemp: "INDI918URN",  lat: 39.7684,  lon: -86.1581,  state: "IN" },
      { name: "Columbus, OH",        msa: "Columbus, OH",                   fredUnemp: "COLU139URN",  lat: 39.9612,  lon: -82.9988,  state: "OH" },
      { name: "Kansas City, MO",     msa: "Kansas City, MO-KS",             fredUnemp: "KANS129URN",  lat: 39.0997,  lon: -94.5786,  state: "MO" },
      { name: "Salt Lake City, UT",  msa: "Salt Lake City, UT",             fredUnemp: "SALT649URN",  lat: 40.7608,  lon: -111.8910, state: "UT" },
      { name: "Richmond, VA",        msa: "Richmond, VA",                   fredUnemp: "RICH051URN",  lat: 37.5407,  lon: -77.4360,  state: "VA" },
      { name: "Jacksonville, FL",    msa: "Jacksonville, FL",               fredUnemp: "JACK212URN",  lat: 30.3322,  lon: -81.6557,  state: "FL" },
      { name: "Memphis, TN",         msa: "Memphis, TN-MS-AR",              fredUnemp: "MPHURN",      lat: 35.1495,  lon: -90.0490,  state: "TN" },
      { name: "Birmingham, AL",      msa: "Birmingham-Hoover, AL",          fredUnemp: "BIRM801URN",  lat: 33.5186,  lon: -86.8104,  state: "AL" },
    ],
  },
};

// ─── FRED SERIES IDs ─────────────────────────────────────────────────────────
export const NATIONAL_SERIES = {
  crePrice:           "COMREPUSQ159N",
  fedFundsRate:       "FEDFUNDS",
  nationalUnemp:      "UNRATE",
  treasury10yr:       "DGS10",
  cpi:                "CPIAUCSL",
  gdpGrowth:          "A191RL1Q225SBEA",
  mortgage30yr:       "MORTGAGE30US",
  constructionSpend:  "TLNRESCONS",
  permitIndex:        "PERMIT",
  housingStarts:      "HOUST",
  monthlySupply:      "MSACSR",
  retailSales:        "RSAFS",
  corporateBonds:     "BAMLC0A0CM",
} as const;

export const TRIANGLE_SERIES = {
  raleighUnemp:      "RALE537URN",
  durhamUnemp:       "DURH537URN",
  raleighLaborForce: "RALEURNLF",
  durhamLaborForce:  "DURHURNLF",
  ncUnemp:           "NCURN",
} as const;

export const CAPITAL_SERIES = {
  tenYrTreasury:  "DGS10",
  twoYrTreasury:  "DGS2",
  fedFunds:       "FEDFUNDS",
  mortgage30yr:   "MORTGAGE30US",
  highYieldSpread:"BAMLH0A0HYM2",
  vix:            "VIXCLS",
  spCase:         "CSUSHPINSA",
} as const;

// ─── TRIANGLE NC COUNTY FIPS ─────────────────────────────────────────────────
export const TRIANGLE_COUNTIES = {
  "Wake County (Raleigh)":    { state: "37", county: "183" },
  "Durham County":            { state: "37", county: "063" },
  "Orange County (Chapel Hill)": { state: "37", county: "135" },
  "Chatham County":           { state: "37", county: "037" },
  "Johnston County":          { state: "37", county: "101" },
} as const;

// ─── RTP KEY FACTS ────────────────────────────────────────────────────────────
export const RTP_FACTS = [
  { label: "Acreage",          value: "7,000 acres", note: "Dedicated R&D campus" },
  { label: "Companies",        value: "300+",         note: "Global tech, pharma & life-sci" },
  { label: "Workers (on-site)",value: "~65,000",      note: "Direct on-campus employees" },
  { label: "Economic Impact",  value: "$2.7B+",       note: "Annual NC contribution" },
  { label: "Major Tenants",    value: "IBM, Cisco, GSK, Biogen, EPA, RTI", note: "" },
  { label: "Hot CRE Types",    value: "Industrial, Lab/R&D, Data Centers", note: "Premium Triangle CRE niches" },
] as const;

// ─── GLOSSARY ─────────────────────────────────────────────────────────────────
export const GLOSSARY: Record<string, string> = {
  "Cap Rate":        "Capitalization Rate — Net Operating Income / Property Value. Higher = higher yield but more risk.",
  "NOI":             "Net Operating Income — Revenue minus operating expenses (excluding debt service).",
  "Vacancy Rate":    "% of rentable space currently unoccupied. Lower is better for landlords.",
  "Absorption":      "Net change in occupied space. Positive = demand > supply.",
  "LTV":             "Loan-to-Value ratio — loan amount / property value. Lenders typically require <75% for CRE.",
  "DSCR":            "Debt Service Coverage Ratio — NOI / annual debt payments. Banks want >1.25x.",
  "Gateway Market":  "Top 6–7 major U.S. cities with deep liquidity and global capital.",
  "Tier 1 Market":   "Large, diversified metros with strong growth, below-gateway cap rates.",
  "Tier 2 / Emerging":"Mid-size cities with rapid population/job growth, often higher yields.",
  "MSA":             "Metropolitan Statistical Area — geographic region with core urban area and surroundings.",
  "FRED":            "Federal Reserve Economic Data — free database from St. Louis Fed with 800K+ series.",
  "RTP":             "Research Triangle Park — 7,000-acre R&D campus near Raleigh, Durham & Chapel Hill.",
  "IRR":             "Internal Rate of Return — annualized return on a real estate investment over the hold.",
};

// ─── COLORS ───────────────────────────────────────────────────────────────────
export const TIER_COLORS = {
  Gateway:           { stroke: "#ef4444", fill: "rgba(239,68,68,0.15)" },
  "Tier 1":          { stroke: "#f59e0b", fill: "rgba(245,158,11,0.15)" },
  "Tier 2 / Emerging": { stroke: "#00ff9d", fill: "rgba(0,255,157,0.15)" },
  Triangle:          { stroke: "#00f5ff", fill: "rgba(0,245,255,0.15)" },
  National:          { stroke: "#a855f7", fill: "rgba(168,85,247,0.15)" },
} as const;

/** Simple tier → hex color map for chart colorKey props */
export const TIER_COLOR_MAP: Record<string, string> = {
  "Gateway": "#ef4444",
  "Tier 1": "#f59e0b",
  "Tier 2 / Emerging": "#00ff9d",
} as const;

// ─── KEY INSIGHT BULLETS (per page) ──────────────────────────────────────────
export const OVERVIEW_INSIGHTS = [
  "Rising interest rates since 2022 have compressed CRE valuations across all property types.",
  "Gateway markets face steeper office vacancy headwinds; Tier 2/Emerging show more resilience.",
  "The Triangle NC (Raleigh-Durham) stands out with below-average unemployment and sustained population inflows.",
  "Cap rate expansion has been uneven — industrial and multifamily remain most attractive vs. office.",
];

export const TRIANGLE_INSIGHTS = [
  "Raleigh-Durham consistently outperforms national unemployment by 0.5–1.5 pp — signaling labor market strength.",
  "Wake County's population growth ranks top-5 nationally, driving multifamily and industrial CRE demand.",
  "RTP's life sciences cluster (Biogen, GSK, Pfizer) anchors lab/R&D real estate as a premium CRE niche.",
  "NC's business-friendly tax environment (flat 2.5% corporate tax) continues to attract HQ relocations.",
  "Risks: office oversupply in downtown Raleigh, rising construction costs, I-40 corridor congestion.",
];

export const MACRO_INSIGHTS = [
  "The Fed's rate hiking cycle (2022–2023) pushed CRE cap rates higher, depressing asset valuations.",
  "10-Year Treasury is the CRE industry's primary cap rate benchmark — watch the spread vs. cap rates.",
  "GDP growth above 2% generally supports positive rent absorption across industrial and office sectors.",
  "CPI stickiness above 3% complicates Fed pivot timing, keeping financing costs elevated.",
];
