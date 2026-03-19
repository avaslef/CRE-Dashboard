import { NextRequest, NextResponse } from "next/server";

const NEWS_BASE = "https://newsapi.org/v2/everything";

// Max query length to prevent abuse
const MAX_QUERY_LEN = 200;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawQuery = searchParams.get("q") ?? "commercial real estate";
  const query    = rawQuery.slice(0, MAX_QUERY_LEN);
  const pageSize = Math.min(Math.max(1, parseInt(searchParams.get("pageSize") ?? "10") || 10), 30);

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ articles: [], error: "NEWS_API_KEY not set" }, { status: 200 });
  }

  try {
    const url = new URL(NEWS_BASE);
    url.searchParams.set("q",        query);
    url.searchParams.set("apiKey",   apiKey);
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy",   "publishedAt");

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },  // cache 30 min
    });

    if (!res.ok) {
      console.error(`NewsAPI error: HTTP ${res.status}`);
      return NextResponse.json({ articles: [] }, { status: 200 });
    }

    const data = await res.json();
    const articles = (data.articles ?? []).map(
      (a: Record<string, unknown>) => ({
        title:       a.title,
        description: a.description,
        url:         a.url,
        publishedAt: a.publishedAt,
        source:      a.source,
        urlToImage:  a.urlToImage,
        author:      a.author,
      })
    );

    return NextResponse.json({ articles }, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("News fetch error:", err);
    return NextResponse.json({ articles: [] }, { status: 200 });
  }
}
