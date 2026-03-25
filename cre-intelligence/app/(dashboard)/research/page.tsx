"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Search, Loader2, ExternalLink } from "lucide-react";
import { NewsCard } from "@/components/ui/NewsCard";
import { NewsCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { GlowBadge } from "@/components/ui/GlowBadge";
import { InsightCard } from "@/components/ui/InsightCard";
import { fetchNews } from "@/lib/api";
import type { NewsArticle } from "@/types";

const BROKERAGE_LINKS = [
  { name: "CBRE Research",        url: "https://www.cbre.com/insights/reports",          note: "Market outlooks, cap rate surveys, sector reports" },
  { name: "JLL Research",          url: "https://www.jll.com/en/trends-and-insights",     note: "Global real estate perspectives & data" },
  { name: "Cushman & Wakefield",   url: "https://www.cushmanwakefield.com/en/insights",   note: "Capital markets & occupier strategy reports" },
  { name: "Colliers Research",     url: "https://www.colliers.com/en/research",           note: "Industrial, office, retail, multifamily reports" },
  { name: "Marcus & Millichap",    url: "https://www.marcusmillichap.com/research",       note: "Small/mid-market CRE transaction research" },
  { name: "CoStar Analytics",      url: "https://www.costar.com/products/costar-suite",   note: "Industry-leading CRE data platform (paid)" },
];

const PRESET_QUERIES = [
  { label: "Brokerage Reports",  query: "CBRE JLL Cushman commercial real estate market outlook" },
  { label: "Office Research",    query: "office market vacancy leasing trends brokerage research" },
  { label: "Industrial Report",  query: "industrial warehouse logistics real estate market report" },
  { label: "NC CRE Research",    query: "North Carolina commercial real estate Raleigh Durham market" },
];

const insights = [
  "CBRE and JLL publish free quarterly market reports — subscribe for cap rate surveys and market outlooks.",
  "CoStar is the gold standard for CRE data but expensive; free alternatives include LoopNet listings.",
  "Marcus & Millichap specializes in smaller CRE transactions — valuable for mid-market Triangle deals.",
  "Brokerage research often lags live FRED data by 1–2 quarters but offers sector-specific nuance.",
];

export default function ResearchPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [query, setQuery] = useState("CBRE JLL Cushman commercial real estate market outlook");
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
            Brokerage Research
          </h1>
          <GlowBadge label="Free Sources" variant="growth" />
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Links to free brokerage research reports and live CRE research news.
        </p>
      </div>

      {/* Brokerage resource cards */}
      <div className="kpi-grid-3">
        {BROKERAGE_LINKS.map((b, i) => (
          <motion.a
            key={b.name}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3, borderColor: "rgba(0,245,255,0.3)" }}
            className="glass"
            style={{
              padding: "16px 18px",
              display: "block",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <p style={{ fontSize: "0.87rem", fontWeight: 600, color: "var(--color-text)" }}>{b.name}</p>
              <ExternalLink size={13} color="var(--color-text-dim)" />
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{b.note}</p>
          </motion.a>
        ))}
      </div>

      <div className="neon-divider" />

      {/* Presets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {PRESET_QUERIES.map((p) => (
          <button key={p.label} onClick={() => setQuery(p.query)} className="btn-neon" style={{ fontSize: "0.74rem", padding: "5px 12px", opacity: query === p.query ? 1 : 0.55 }}>
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
          placeholder="Search research news…"
        />
        <button onClick={search} disabled={loading} className="btn-neon">
          {loading ? <Loader2 size={14} className="spin-ring" /> : <Search size={14} />}
          Search
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <NewsCardSkeleton key={i} />)
          : articles.length > 0
          ? articles.map((a, i) => <NewsCard key={a.url} article={a} index={i} />)
          : (
            <div className="glass" style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
              <Briefcase size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>No articles found. Add your NewsAPI key or adjust the search.</p>
            </div>
          )
        }
      </div>

      <InsightCard bullets={insights} />
    </motion.div>
  );
}
