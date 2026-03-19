"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gavel, Search, Loader2 } from "lucide-react";
import { NewsCard } from "@/components/ui/NewsCard";
import { NewsCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { InsightCard } from "@/components/ui/InsightCard";
import { fetchNews } from "@/lib/api";
import type { NewsArticle } from "@/types";

const PRESET_QUERIES = [
  { label: "NC Business",   query: "North Carolina business legislation economy 2024" },
  { label: "CRE Zoning",    query: "commercial real estate zoning regulation 2024" },
  { label: "1031 Exchange", query: "1031 exchange like-kind real estate tax 2024" },
  { label: "Opportunity Zones", query: "opportunity zone real estate investment tax" },
  { label: "Tax Policy",    query: "real estate tax reform policy 2024" },
  { label: "REIT Regulation",query: "REIT regulation SEC disclosure 2024" },
];

const NC_HIGHLIGHTS = [
  { title: "NC Corporate Tax Rate", value: "2.5%", note: "Flat rate by 2025 — nation's lowest", color: "#00ff9d" },
  { title: "Business Climate Rank", value: "Top 5",note: "CNBC 'America's Top States for Business'", color: "#00f5ff" },
  { title: "Right-to-Work State",   value: "Yes",  note: "Pro-business labor environment", color: "#f59e0b" },
  { title: "Property Tax Rate",     value: "~0.7%",note: "Effective rate — below national avg", color: "#a855f7" },
];

const insights = [
  "NC's declining corporate tax rate continues to drive corporate HQ relocations and CRE demand.",
  "Opportunity Zones in Durham and East Raleigh offer federal capital gains incentives for CRE investors.",
  "1031 exchange flexibility allows CRE investors to defer taxes on appreciation — watch for potential reforms.",
  "Statewide zoning reform efforts aim to increase housing density — positive signal for multifamily CRE.",
  "NC's preemption laws limit local rent control ordinances, supporting long-term landlord economics.",
];

export default function LegislationPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [query, setQuery] = useState("North Carolina business legislation economy 2024");
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const results = await fetchNews(query, 8);
    setArticles(results);
    setLoading(false);
  }

  useEffect(() => { search(); }, []); // eslint-disable-line

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            Business &amp; Legislation
          </h1>
          <GlowBadge label="NC Focus" variant="triangle" />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Policy developments, tax environment, and regulatory landscape for CRE investors.
        </p>
      </div>

      {/* NC Highlight cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {NC_HIGHLIGHTS.map((h, i) => (
          <motion.div
            key={h.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3 }}
            className="glass"
            style={{ padding: "16px 18px", borderColor: `${h.color}25` }}
          >
            <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 6 }}>
              {h.title}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, color: h.color, marginBottom: 4 }}>
              {h.value}
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{h.note}</p>
          </motion.div>
        ))}
      </div>

      <div className="neon-divider" />

      {/* Presets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {PRESET_QUERIES.map((p) => (
          <button key={p.label} onClick={() => { setQuery(p.query); }} className="btn-neon" style={{ fontSize: "0.74rem", padding: "5px 12px", opacity: query === p.query ? 1 : 0.55 }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Search */}
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
          placeholder="Search legislation news…"
        />
        <button onClick={search} disabled={loading} className="btn-neon">
          {loading ? <Loader2 size={14} className="spin-ring" /> : <Search size={14} />}
          Search
        </button>
      </div>

      {/* News */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <NewsCardSkeleton key={i} />)
          : articles.length > 0
          ? articles.map((a, i) => <NewsCard key={a.url} article={a} index={i} />)
          : (
            <div className="glass" style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
              <Gavel size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>No articles found. Add your NewsAPI key or adjust the search.</p>
            </div>
          )
        }
      </div>

      <InsightCard bullets={insights} />
    </motion.div>
  );
}
