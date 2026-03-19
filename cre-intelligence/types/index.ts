// ─── Core data types for CRE Intelligence Dashboard ─────────────────────────

export interface MarketCity {
  name: string;
  msa: string;
  fredUnemp: string;
  lat: number;
  lon: number;
  state: string;
  highlight?: boolean;
}

export interface MarketTier {
  color: string;
  neonColor: string;
  badgeClass: string;
  markets: MarketCity[];
}

export interface MarketTiers {
  Gateway: MarketTier;
  "Tier 1": MarketTier;
  "Tier 2 / Emerging": MarketTier;
}

export interface FredObservation {
  date: string;
  value: number;
}

export interface FredSeries {
  id: string;
  label: string;
  data: FredObservation[];
  latestValue?: number;
}

export interface CensusCounty {
  name: string;
  stateFips: string;
  countyFips: string;
  population?: number;
  medianIncome?: number;
}

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: { name: string; id?: string | null };
  urlToImage?: string | null;
  author?: string | null;
}

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  source?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "cyan" | "green" | "amber" | "red" | "purple";
  isLoading?: boolean;
  className?: string;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export type TabId =
  | "overview"
  | "market-tiers"
  | "macro-trends"
  | "triangle-nc"
  | "capital-markets"
  | "housing"
  | "deal-flow"
  | "research"
  | "legislation"
  | "demand-signals"
  | "map"
  | "comparisons";
