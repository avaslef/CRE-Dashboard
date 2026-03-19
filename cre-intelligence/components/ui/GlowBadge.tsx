"use client";

import { motion } from "framer-motion";
import { Star, TrendingUp } from "lucide-react";

type BadgeVariant = "gateway" | "tier1" | "tier2" | "triangle" | "growth" | "hot" | "star";

interface GlowBadgeProps {
  label: string;
  variant?: BadgeVariant;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  gateway:  { background: "rgba(239,68,68,0.12)",  border: "1px solid rgba(239,68,68,0.35)",  color: "#fca5a5" },
  tier1:    { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "#fcd34d" },
  tier2:    { background: "rgba(0,255,157,0.08)",  border: "1px solid rgba(0,255,157,0.35)",  color: "#00ff9d" },
  triangle: { background: "rgba(0,245,255,0.08)",  border: "1px solid rgba(0,245,255,0.35)",  color: "#00f5ff" },
  growth:   { background: "rgba(0,255,157,0.1)",   border: "1px solid rgba(0,255,157,0.4)",   color: "#00ff9d" },
  hot:      { background: "rgba(239,68,68,0.1)",   border: "1px solid rgba(239,68,68,0.35)",  color: "#fca5a5" },
  star:     { background: "rgba(0,245,255,0.1)",   border: "1px solid rgba(0,245,255,0.35)",  color: "#00f5ff" },
};

export function GlowBadge({ label, variant = "tier2", pulse = false, icon }: GlowBadgeProps) {
  const style = VARIANT_STYLES[variant];

  return (
    <motion.span
      animate={
        pulse
          ? {
              boxShadow: [
                "0 0 0 rgba(0,255,157,0)",
                "0 0 10px rgba(0,255,157,0.3)",
                "0 0 0 rgba(0,255,157,0)",
              ],
            }
          : {}
      }
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="badge"
      style={style}
    >
      {icon ?? (variant === "growth" ? <TrendingUp size={9} /> : variant === "star" ? <Star size={9} /> : null)}
      {label}
    </motion.span>
  );
}
