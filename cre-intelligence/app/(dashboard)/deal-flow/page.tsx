"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, Search, Loader2, Filter } from "lucide-react";
import { NewsCard } from "@/components/ui/NewsCard";
import { NewsCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { InsightCard } from "@/components/ui/InsightCard";
import { fetchNews } from "@/lib/api";
import type { NewsArticle } from "@/types";

const PRESET_QUERIES = [
  { label: "CRE Deals",     query: "commercial real estate deal acquisition 2024" },
  { label: "Office Market", query: "office real estate vacancy leasing 2024" },
  { label: "Industrial",    query: "industrial warehouse logistics real estate" },
  { label: "Multifamily",   query: "multifamily apartment real estate investment" },
  { label: "Cap Rates",     query: "cap rate capitalization commercial real estate" },
  { label: "REIT News",     query: "REIT real estate investment trust 2024" },
];

const insights = [
  "Industrial and logistics CRE remain most resilient — driven by e-commerce and supply chain reshoring.",
  "Office deal flow is heavily discounted in gateway markets; buyers demand 20–40% below peak pricing.",
  "Multifamily cap rates are compressing in high-growth Sun Belt and Triangle markets.",
  "Life sciences / lab space in Raleigh-Durham commands premium rents due to RTP proximity.",
];

export default function DealFlowPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [query, setQuery] = useState("commercial real estate deal acquisition investment 2024");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const results = await fetchNews(query, count);
    setArticles(results);
    setLoading(false);
  }

  useEffect(() => { search(); }, []); // eslint-disable-line

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Deal Flow &amp; News
          </h1>
          <GlowBadge label="Live Feed" variant="growth" pulse />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Latest CRE deal activity, market moves, and institutional research via NewsAPI.
        </p>
      </div>

      {/* Preset queries */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {PRESET_QUERIES.map((preset) => (
          <button
            key={preset.label}
            onClick={() => { setQuery(preset.query); }}
            className="btn-neon"
            style={{ fontSize: "0.74rem", padding: "5px 12px", opacity: query === preset.query ? 1 : 0.55 }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "9px 14px",
            color: "var(--color-text)",
            fontSize: "0.84rem",
            fontFamily: "var(--font-body)",
            outline: "none",
          }}
          placeholder="Search news…"
        />

        {/* Count selector */}
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "9px 12px",
            color: "var(--color-text-muted)",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          {[5, 10, 15, 20].map((n) => (
            <option key={n} value={n}>{n} articles</option>
          ))}
        </select>

        <button onClick={search} disabled={loading} className="btn-neon">
          {loading ? <Loader2 size={14} className="spin-ring" /> : <Search size={14} />}
          Search
        </button>
      </div>

      {/* Articles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {loading
          ? Array.from({ length: count }).map((_, i) => <NewsCardSkeleton key={i} />)
          : articles.length > 0
          ? articles.map((a, i) => <NewsCard key={a.url} article={a} index={i} />)
          : (
            <div className="glass" style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
              <Newspaper size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>No articles found. Add your NewsAPI key or try a different query.</p>
            </div>
          )
        }
      </div>

      <InsightCard bullets={insights} />
    </motion.div>
  );
}
