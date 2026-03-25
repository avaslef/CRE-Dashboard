// ─── Client-side API helpers (call our own API routes) ───────────────────────

import type { FredObservation, NewsArticle } from "@/types";

const BASE = "";  // same-origin
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache to avoid redundant API calls across page navigations
const apiCache = new Map<string, { data: unknown; ts: number }>();

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown) {
  apiCache.set(key, { data, ts: Date.now() });
}

/** Fetch a single FRED time series */
export async function fetchFredSeries(
  seriesId: string,
  start = "2010-01-01"
): Promise<FredObservation[]> {
  const cacheKey = `fred:${seriesId}:${start}`;
  const cached = getCached<FredObservation[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${BASE}/api/fred?series=${seriesId}&start=${start}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const obs = (data.observations ?? []) as FredObservation[];
  setCache(cacheKey, obs);
  return obs;
}

/** Fetch multiple FRED series in one call (parallel) */
export async function fetchFredMulti(
  seriesMap: Record<string, string>,
  start = "2010-01-01"
): Promise<Record<string, FredObservation[]>> {
  const entries = Object.entries(seriesMap);
  const results = await Promise.all(
    entries.map(([label, id]) =>
      fetchFredSeries(id, start).then((data) => [label, data] as const)
    )
  );
  return Object.fromEntries(results);
}

/** Fetch latest values for many markets, batched in groups to avoid FRED rate limits */
export async function fetchFredLatestBatched(
  items: { key: string; seriesId: string }[],
  batchSize = 6,
  delayMs = 250
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const values = await Promise.all(
      batch.map((item) =>
        fetchFredLatest(item.seriesId).then((v) => ({ key: item.key, value: v }))
      )
    );
    for (const { key, value } of values) {
      result[key] = value;
    }
    if (i + batchSize < items.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return result;
}

/** Get all markets flattened from MARKET_TIERS with tier metadata */
export function getAllMarkets(tiers: Record<string, { color: string; markets: { name: string; fredUnemp: string; highlight?: boolean; [k: string]: unknown }[] }>) {
  return Object.entries(tiers).flatMap(([tier, data]) =>
    data.markets.map((m) => ({ ...m, tier, color: data.color }))
  );
}

/** Get the latest value for a FRED series */
export async function fetchFredLatest(seriesId: string): Promise<number | null> {
  const obs = await fetchFredSeries(seriesId);
  if (!obs.length) return null;
  const last = obs[obs.length - 1];
  return typeof last.value === "number" ? last.value : null;
}

/** Fetch Census ACS population data for NC counties */
export async function fetchCensusPopulation(stateFips = "37") {
  const res = await fetch(`${BASE}/api/census?type=population&state=${stateFips}`);
  if (!res.ok) return [];
  return (await res.json()).data ?? [];
}

/** Fetch Census ACS median income data */
export async function fetchCensusMedianIncome(stateFips = "37") {
  const res = await fetch(`${BASE}/api/census?type=income&state=${stateFips}`);
  if (!res.ok) return [];
  return (await res.json()).data ?? [];
}

/** Fetch Census ACS median gross rent data (B25064) */
export async function fetchCensusGrossRent(stateFips = "37") {
  const res = await fetch(`${BASE}/api/census?type=rent&state=${stateFips}`);
  if (!res.ok) return [];
  return (await res.json()).data ?? [];
}

/** Fetch Census County Business Patterns (CBP) */
export async function fetchCensusCBP(stateFips = "37", naics = "531") {
  const res = await fetch(`${BASE}/api/census?type=cbp&state=${stateFips}&naics=${naics}`);
  if (!res.ok) return [];
  return (await res.json()).data ?? [];
}

/** Fetch news articles from NewsAPI via our proxy route */
export async function fetchNews(query: string, pageSize = 10): Promise<NewsArticle[]> {
  const params = new URLSearchParams({ q: query, pageSize: String(pageSize) });
  const res = await fetch(`${BASE}/api/news?${params}`);
  if (!res.ok) return [];
  return (await res.json()).articles ?? [];
}
