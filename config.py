# config.py — Market tiers, FRED series IDs, MSA metadata
# -------------------------------------------------------

MARKET_TIERS = {
    "Gateway": {
        "color": "#C0392B",
        "markets": [
            {"name": "New York, NY",         "msa": "New York-Newark-Jersey City",   "fred_unemp": "NEWY636URN",  "lat": 40.7128,  "lon": -74.0060,  "state": "NY"},
            {"name": "Los Angeles, CA",       "msa": "Los Angeles-Long Beach-Anaheim","fred_unemp": "LOSA106URN",  "lat": 34.0522,  "lon": -118.2437, "state": "CA"},
            {"name": "Chicago, IL",           "msa": "Chicago-Naperville-Elgin",      "fred_unemp": "CHIC917URN",  "lat": 41.8781,  "lon": -87.6298,  "state": "IL"},
            {"name": "San Francisco, CA",     "msa": "San Francisco-Oakland-Berkeley","fred_unemp": "SANF806URN",  "lat": 37.7749,  "lon": -122.4194, "state": "CA"},
            {"name": "Boston, MA",            "msa": "Boston-Cambridge-Newton",       "fred_unemp": "BOST625URN",  "lat": 42.3601,  "lon": -71.0589,  "state": "MA"},
            {"name": "Washington, DC",        "msa": "Washington-Arlington-Alexandria","fred_unemp": "WASH911URN", "lat": 38.9072,  "lon": -77.0369,  "state": "DC"},
            {"name": "Seattle, WA",           "msa": "Seattle-Tacoma-Bellevue",       "fred_unemp": "SEAT653URN",  "lat": 47.6062,  "lon": -122.3321, "state": "WA"},
        ]
    },
    "Tier 1": {
        "color": "#E67E22",
        "markets": [
            {"name": "Atlanta, GA",           "msa": "Atlanta-Sandy Springs-Roswell", "fred_unemp": "ATLA013URN",  "lat": 33.7490,  "lon": -84.3880,  "state": "GA"},
            {"name": "Dallas, TX",            "msa": "Dallas-Fort Worth-Arlington",   "fred_unemp": "DALL148URN",  "lat": 32.7767,  "lon": -96.7970,  "state": "TX"},
            {"name": "Houston, TX",           "msa": "Houston-The Woodlands-Sugar Land","fred_unemp": "HOUS448URN","lat": 29.7604, "lon": -95.3698,  "state": "TX"},
            {"name": "Miami, FL",             "msa": "Miami-Fort Lauderdale-West Palm Beach","fred_unemp": "MIAM112URN","lat": 25.7617,"lon": -80.1918, "state": "FL"},
            {"name": "Phoenix, AZ",           "msa": "Phoenix-Mesa-Scottsdale",       "fred_unemp": "PHOE004URN",  "lat": 33.4484,  "lon": -112.0740, "state": "AZ"},
            {"name": "Denver, CO",            "msa": "Denver-Aurora-Lakewood",        "fred_unemp": "DENV708URN",  "lat": 39.7392,  "lon": -104.9903, "state": "CO"},
            {"name": "Austin, TX",            "msa": "Austin-Round Rock",             "fred_unemp": "AUST448URN",  "lat": 30.2672,  "lon": -97.7431,  "state": "TX"},
            {"name": "San Diego, CA",         "msa": "San Diego-Carlsbad",            "fred_unemp": "SAND706URN",  "lat": 32.7157,  "lon": -117.1611, "state": "CA"},
            {"name": "Portland, OR",          "msa": "Portland-Vancouver-Hillsboro",  "fred_unemp": "PORT941URN",  "lat": 45.5051,  "lon": -122.6750, "state": "OR"},
            {"name": "Minneapolis, MN",       "msa": "Minneapolis-St. Paul-Bloomington","fred_unemp": "MINN427URN","lat": 44.9778, "lon": -93.2650,  "state": "MN"},
        ]
    },
    "Tier 2 / Emerging": {
        "color": "#27AE60",
        "markets": [
            {"name": "Raleigh-Durham, NC",    "msa": "Raleigh-Cary",                 "fred_unemp": "RALE537URN",  "lat": 35.7796,  "lon": -78.6382,  "state": "NC", "highlight": True},
            {"name": "Charlotte, NC",         "msa": "Charlotte-Concord-Gastonia",    "fred_unemp": "CHAR737URN",  "lat": 35.2271,  "lon": -80.8431,  "state": "NC"},
            {"name": "Nashville, TN",         "msa": "Nashville-Davidson-Murfreesboro","fred_unemp": "NASH947URN", "lat": 36.1627,  "lon": -86.7816,  "state": "TN"},
            {"name": "Orlando, FL",           "msa": "Orlando-Kissimmee-Sanford",     "fred_unemp": "ORLA712URN",  "lat": 28.5383,  "lon": -81.3792,  "state": "FL"},
            {"name": "Las Vegas, NV",         "msa": "Las Vegas-Henderson-Paradise",  "fred_unemp": "LASV832URN",  "lat": 36.1699,  "lon": -115.1398, "state": "NV"},
            {"name": "Tampa, FL",             "msa": "Tampa-St. Petersburg-Clearwater","fred_unemp": "TAMP312URN", "lat": 27.9506,  "lon": -82.4572,  "state": "FL"},
            {"name": "Indianapolis, IN",      "msa": "Indianapolis-Carmel-Anderson",  "fred_unemp": "INDI918URN",  "lat": 39.7684,  "lon": -86.1581,  "state": "IN"},
            {"name": "Columbus, OH",          "msa": "Columbus, OH",                  "fred_unemp": "COLU139URN",  "lat": 39.9612,  "lon": -82.9988,  "state": "OH"},
            {"name": "Kansas City, MO",       "msa": "Kansas City, MO-KS",            "fred_unemp": "KANS129URN",  "lat": 39.0997,  "lon": -94.5786,  "state": "MO"},
            {"name": "Salt Lake City, UT",    "msa": "Salt Lake City, UT",             "fred_unemp": "SALT649URN",  "lat": 40.7608,  "lon": -111.8910, "state": "UT"},
            {"name": "Richmond, VA",          "msa": "Richmond, VA",                  "fred_unemp": "RICH051URN",  "lat": 37.5407,  "lon": -77.4360,  "state": "VA"},
            {"name": "Jacksonville, FL",      "msa": "Jacksonville, FL",              "fred_unemp": "JACK212URN",  "lat": 30.3322,  "lon": -81.6557,  "state": "FL"},
            {"name": "Memphis, TN",           "msa": "Memphis, TN-MS-AR",             "fred_unemp": "MPHURN",      "lat": 35.1495,  "lon": -90.0490,  "state": "TN"},
            {"name": "Birmingham, AL",        "msa": "Birmingham-Hoover, AL",         "fred_unemp": "BIRM801URN",  "lat": 33.5186,  "lon": -86.8104,  "state": "AL"},
        ]
    }
}

# National FRED series
NATIONAL_SERIES = {
    "cre_price_index":      "COMREPUSQ159N",    # Commercial Real Estate Price Index
    "fed_funds_rate":       "FEDFUNDS",          # Federal Funds Rate
    "national_unemp":       "UNRATE",            # National Unemployment Rate
    "treasury_10yr":        "DGS10",             # 10-Year Treasury
    "cpi":                  "CPIAUCSL",          # CPI
    "gdp_growth":           "A191RL1Q225SBEA",   # Real GDP Growth
    "mortgage_30yr":        "MORTGAGE30US",      # 30-Year Mortgage Rate
    "construction_spend":   "TLNRESCONS",        # Non-Residential Construction Spending
    "office_vacancy":       None,                # No free series — use proxy
    "permit_index":         "PERMIT",            # New Private Housing Permits (all)
}

# Triangle NC-specific FRED series
TRIANGLE_SERIES = {
    "raleigh_unemp":        "RALE537URN",
    "durham_unemp":         "DURH537URN",
    "raleigh_labor_force":  "RALEURNLF",         # Civilian Labor Force - Raleigh
    "durham_labor_force":   "DURHURNLF",
    "nc_unemp":             "NCURN",             # NC statewide unemployment
}

# Durham MSA fallback series (some might not exist — handled in data layer)
DURHAM_FRED_UNEMP = "DURH537URN"

# Census API endpoints
CENSUS_BASE = "https://api.census.gov/data"
ACS_YEAR = "2022"  # Most recent ACS 5-year

# FIPS codes for Triangle counties
TRIANGLE_COUNTIES = {
    "Wake County (Raleigh)":    {"state": "37", "county": "183"},
    "Durham County":            {"state": "37", "county": "063"},
    "Orange County (Chapel Hill)": {"state": "37", "county": "135"},
    "Chatham County":           {"state": "37", "county": "037"},
    "Johnston County":          {"state": "37", "county": "101"},
}

# Real estate NAICS code for Census County Business Patterns
NAICS_REAL_ESTATE = "531"  # Real Estate

# Glossary / tooltip definitions
GLOSSARY = {
    "Cap Rate": "Capitalization Rate — Net Operating Income / Property Value. Higher = higher yield but more risk.",
    "NOI": "Net Operating Income — Revenue minus operating expenses (excluding debt service).",
    "Vacancy Rate": "Percentage of rentable space currently unoccupied. Lower is better for landlords.",
    "Absorption": "Net change in occupied space over a period. Positive = demand > supply.",
    "LTV": "Loan-to-Value ratio — loan amount / property value. Lenders typically require <75% for CRE.",
    "DSCR": "Debt Service Coverage Ratio — NOI / annual debt payments. Banks want >1.25x.",
    "Gateway Market": "Top 6–7 major U.S. cities with deep liquidity, global capital, and institutional demand.",
    "Tier 1 Market": "Large, diversified metros with strong growth, below-gateway pricing and cap rates.",
    "Tier 2 / Emerging": "Mid-size cities with rapid population/job growth, often offering higher yields.",
    "MSA": "Metropolitan Statistical Area — a geographic region with a core urban area and surrounding communities.",
    "FRED": "Federal Reserve Economic Data — free database from the St. Louis Fed with 800,000+ economic series.",
    "RTP": "Research Triangle Park — 7,000-acre R&D campus between Raleigh, Durham, and Chapel Hill.",
    "IRR": "Internal Rate of Return — annualized return on a real estate investment over the hold period.",
}

# Chart color scheme — UNC Chapel Hill themed
COLORS = {
    "primary":    "#13294B",   # UNC Navy
    "secondary":  "#4B9CD3",   # Carolina Blue
    "accent":     "#34d399",   # Green accent
    "warning":    "#fbbf24",   # Amber
    "danger":     "#f87171",   # Red
    "light":      "#7BAFD4",   # Light Carolina Blue
    "gateway":    "#dc2626",
    "tier1":      "#d97706",
    "tier2":      "#059669",
    "triangle":   "#4B9CD3",   # Carolina Blue for Triangle
}

PLOTLY_TEMPLATE = "plotly_dark"
