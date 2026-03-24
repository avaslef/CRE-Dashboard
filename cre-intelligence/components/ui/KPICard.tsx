"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { KPICardProps } from "@/types";

const COLOR_MAP = {
  cyan:   { glow: "rgba(0,245,255,0.25)",  border: "rgba(0,245,255,0.3)",  text: "#00f5ff"  },
  green:  { glow: "rgba(0,255,157,0.25)",  border: "rgba(0,255,157,0.3)",  text: "#00ff9d"  },
  amber:  { glow: "rgba(245,158,11,0.25)", border: "rgba(245,158,11,0.3)", text: "#fcd34d"  },
  red:    { glow: "rgba(239,68,68,0.25)",  border: "rgba(239,68,68,0.3)",  text: "#fca5a5"  },
  purple: { glow: "rgba(168,85,247,0.25)", border: "rgba(168,85,247,0.3)", text: "#d8b4fe"  },
};

interface NumericKPIProps extends Omit<KPICardProps, "value"> {
  value: number | null;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  abbrev?: boolean;
}

/** KPI card with animated count-up for numeric values */
export function NumericKPICard({
  title,
  value,
  subtitle,
  source,
  icon,
  trend,
  trendValue,
  color = "cyan",
  isLoading = false,
  className,
  prefix = "",
  suffix = "",
  decimals = 2,
  abbrev = false,
}: NumericKPIProps) {
  const displayValue = useCountUp(value, { prefix, suffix, decimals, abbrev });

  return (
    <KPICard
      title={title}
      value={value == null ? "N/A" : displayValue}
      subtitle={subtitle}
      source={source}
      icon={icon}
      trend={trend}
      trendValue={trendValue}
      color={color}
      isLoading={isLoading}
      className={className}
    />
  );
}

/** Generic KPI card (string or pre-formatted value) */
export function KPICard({
  title,
  value,
  subtitle,
  source,
  icon,
  trend,
  trendValue,
  color = "cyan",
  isLoading = false,
  className = "",
}: KPICardProps) {
  const palette = COLOR_MAP[color];

  const TrendIcon = trend === "up"
    ? TrendingUp
    : trend === "down"
    ? TrendingDown
    : Minus;

  const trendColor =
    trend === "up"   ? "#00ff9d" :
    trend === "down" ? "#ef4444" :
    "var(--color-text-muted)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.015 }}
      className={`glass glass-hover ${className}`}
      style={{
        padding: "20px",
        borderColor: palette.border,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Inner glow corner */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: `radial-gradient(circle at top right, ${palette.glow}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <p
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          {title}
        </p>
        {icon && (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `rgba(${palette.glow.slice(5, -1)}, 0.3)`,
              border: `1px solid ${palette.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.text,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      {isLoading ? (
        <div className="skeleton" style={{ height: 40, width: "70%", marginBottom: 8 }} />
      ) : (
        <div
          className="stat-value"
          style={{ color: palette.text, marginBottom: 6 }}
        >
          {value}
        </div>
      )}

      {/* Subtitle / trend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {isLoading ? (
          <div className="skeleton" style={{ height: 14, width: "50%" }} />
        ) : (
          <>
            {subtitle && (
              <p style={{ fontSize: "0.73rem", color: "var(--color-text-muted)" }}>
                {subtitle}
              </p>
            )}
            {trendValue && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: trendColor,
                  marginLeft: subtitle ? "auto" : 0,
                }}
              >
                <TrendIcon size={12} />
                {trendValue}
              </span>
            )}
          </>
        )}
      </div>

      {/* Data source footnote */}
      {source && !isLoading && (
        <p style={{ fontSize: "0.62rem", color: "var(--color-text-dim)", marginTop: 8, opacity: 0.65 }}>
          Source: {source}
        </p>
      )}

      {/* Bottom border glow line */}
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${palette.text}, transparent)`,
          opacity: 0,
        }}
        whileHover={{ opacity: 0.6 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
}
