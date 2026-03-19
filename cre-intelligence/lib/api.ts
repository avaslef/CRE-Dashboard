// ─── Client-side API helpers (call our own API routes) ───────────────────────

import type { FredObservation, NewsArticle } from "@/types";

const BASE = "";  // same-origin

/** Fetch a single FRED time series */
export async function fetchFredSeries(
  seriesId: string,
  start = "2010-01-01"
): Promise<FredObservation[]> {
  const res = await fetch(
    `${BASE}/api/fred?series=${seriesId}&start=${start}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.observations ?? []) as FredObservation[];
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
