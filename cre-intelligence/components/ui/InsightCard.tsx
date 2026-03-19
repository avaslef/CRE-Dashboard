"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface InsightCardProps {
  bullets: string[];
  title?: string;
}

export function InsightCard({ bullets, title = "Key Insights" }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="insight-card"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Lightbulb size={16} color="#00f5ff" />
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#00f5ff",
          }}
        >
          {title}
        </span>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {bullets.map((bullet, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.08 }}
            style={{
              display: "flex",
              gap: 10,
              fontSize: "0.83rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "rgba(0,245,255,0.12)",
                border: "1px solid rgba(0,245,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                color: "#00f5ff",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {i + 1}
            </span>
            {bullet}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
