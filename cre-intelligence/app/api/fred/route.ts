import { NextRequest, NextResponse } from "next/server";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

// Allow only known safe FRED series ID characters: uppercase letters, digits, underscores
const SERIES_RE = /^[A-Z0-9_]{1,30}$/;
// Allow only ISO date format
const DATE_RE   = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const series = searchParams.get("series");
  const start  = searchParams.get("start") ?? "2010-01-01";

  if (!series) {
    return NextResponse.json({ error: "Missing series parameter" }, { status: 400 });
  }
  if (!SERIES_RE.test(series)) {
    return NextResponse.json({ error: "Invalid series ID" }, { status: 400 });
  }
  if (!DATE_RE.test(start)) {
    return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ observations: [], error: "FRED_API_KEY not set" }, { status: 200 });
  }

  try {
    const url = new URL(FRED_BASE);
    url.searchParams.set("series_id", series);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("observation_start", start);
    url.searchParams.set("sort_order", "asc");

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },  // cache 1 hour
    });

    if (!res.ok) {
      console.error(`FRED API error for series ${series}: HTTP ${res.status}`);
      return NextResponse.json({ observations: [] }, { status: 200 });
    }

    const data = await res.json();
    const observations = (data.observations ?? [])
      .map((o: { date: string; value: string }) => ({
        date:  o.date,
        value: parseFloat(o.value),
      }))
      .filter((o: { date: string; value: number }) => !isNaN(o.value));

    return NextResponse.json({ observations }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (err) {
    console.error("FRED fetch error:", err);
    return NextResponse.json({ observations: [] }, { status: 200 });
  }
}
