import { NextRequest, NextResponse } from "next/server";

const ACS_BASE = "https://api.census.gov/data/2022/acs/acs5";
const CBP_BASE = "https://api.census.gov/data/2021/cbp";

const VALID_TYPES = new Set(["population", "income", "cbp", "rent"]);
// State FIPS: 1–2 digits
const STATE_RE = /^\d{1,2}$/;
// NAICS codes: 2–6 digits
const NAICS_RE = /^\d{2,6}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type  = searchParams.get("type");
  const state = searchParams.get("state") ?? "37";
  const naics = searchParams.get("naics") ?? "531";

  if (!VALID_TYPES.has(type ?? "")) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!STATE_RE.test(state)) {
    return NextResponse.json({ error: "Invalid state FIPS" }, { status: 400 });
  }
  if (!NAICS_RE.test(naics)) {
    return NextResponse.json({ error: "Invalid NAICS code" }, { status: 400 });
  }

  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ data: [], error: "CENSUS_API_KEY not set" }, { status: 200 });
  }

  try {
    let url: URL;

    if (type === "population") {
      url = new URL(ACS_BASE);
      url.searchParams.set("get", "NAME,B01003_001E");
      url.searchParams.set("for", "county:*");
      url.searchParams.set("in", `state:${state}`);
      url.searchParams.set("key", apiKey);
    } else if (type === "income") {
      url = new URL(ACS_BASE);
      url.searchParams.set("get", "NAME,B19013_001E");
      url.searchParams.set("for", "county:*");
      url.searchParams.set("in", `state:${state}`);
      url.searchParams.set("key", apiKey);
    } else if (type === "rent") {
      url = new URL(ACS_BASE);
      url.searchParams.set("get", "NAME,B25064_001E");
      url.searchParams.set("for", "county:*");
      url.searchParams.set("in", `state:${state}`);
      url.searchParams.set("key", apiKey);
    } else if (type === "cbp") {
      url = new URL(CBP_BASE);
      url.searchParams.set("get", "NAME,NAICS2017,EMP,PAYANN,ESTAB");
      url.searchParams.set("for", "county:*");
      url.searchParams.set("in", `state:${state}`);
      url.searchParams.set("NAICS2017", naics);
      url.searchParams.set("key", apiKey);
    } else {
      // Unreachable — VALID_TYPES check above handles this
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },  // cache 24 hours
    });

    if (!res.ok) {
      console.error(`Census API error (${type}): HTTP ${res.status}`);
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const raw: string[][] = await res.json();
    const [headers, ...rows] = raw;
    const rawData = rows.map((row) =>
      Object.fromEntries(headers.map((h, i) => [h, row[i]])) as Record<string, string>
    );

    // Parse numeric fields into enriched objects
    type EnrichedRow = Record<string, string | number | null>;
    const data: EnrichedRow[] = rawData.map((d) => {
      const row: EnrichedRow = { ...d };
      if (type === "population") {
        row.population = d.B01003_001E != null ? parseInt(d.B01003_001E, 10) : null;
      } else if (type === "income") {
        row.median_income = d.B19013_001E != null ? parseInt(d.B19013_001E, 10) : null;
      } else if (type === "rent") {
        row.gross_rent = d.B25064_001E != null ? parseInt(d.B25064_001E, 10) : null;
      } else if (type === "cbp") {
        row.EMP    = d.EMP    != null ? parseInt(d.EMP, 10)    : null;
        row.PAYANN = d.PAYANN != null ? parseInt(d.PAYANN, 10) : null;
        row.ESTAB  = d.ESTAB  != null ? parseInt(d.ESTAB, 10)  : null;
      }
      return row;
    });

    return NextResponse.json({ data }, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
      },
    });
  } catch (err) {
    console.error("Census fetch error:", err);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
