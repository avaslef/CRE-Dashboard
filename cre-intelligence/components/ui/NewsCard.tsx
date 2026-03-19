"use client";

import { motion } from "framer-motion";
import { ExternalLink, Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { NewsArticle } from "@/types";

interface NewsCardProps {
  article: NewsArticle;
  index?: number;
}

export function NewsCard({ article, index = 0 }: NewsCardProps) {
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="news-card"
      style={{ display: "block", textDecoration: "none", cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Source + date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              fontSize: "0.68rem",
              color: "var(--color-text-dim)",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                background: "rgba(0,245,255,0.1)",
                border: "1px solid rgba(0,245,255,0.2)",
                borderRadius: 4,
                padding: "1px 6px",
                color: "#00f5ff",
              }}
            >
              {article.source?.name ?? "News"}
            </span>
            <Clock size={10} />
            {timeAgo(article.publishedAt)}
          </div>

          {/* Title */}
          <p
            style={{
              fontSize: "0.87rem",
              fontWeight: 600,
              color: "var(--color-text)",
              lineHeight: 1.45,
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.title}
          </p>

          {/* Description */}
          {article.description && (
            <p
              style={{
                fontSize: "0.77rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {article.description}
            </p>
          )}
        </div>

        {/* Arrow icon */}
        <ExternalLink
          size={14}
          style={{ flexShrink: 0, marginTop: 2, color: "var(--color-text-dim)" }}
        />
      </div>
    </motion.a>
  );
}
