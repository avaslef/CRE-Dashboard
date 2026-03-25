"use client";

import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import type { FredObservation } from "@/types";
import { exportCsv } from "@/lib/utils";
import { Download } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

interface LineChartSeries {
  key: string;
  label: string;
  color: string;
}

interface LineChartProps {
  data: Record<string, string | number>[];
  series: LineChartSeries[];
  title?: string;
  yAxisLabel?: string;
  height?: number;
  referenceLines?: { x?: string; y?: number; label: string; color: string }[];
  showExport?: boolean;
  exportFilename?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "rgba(8,12,24,0.97)",
        border: "1px solid rgba(0,245,255,0.25)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.6), 0 0 20px rgba(0,245,255,0.05)",
        fontFamily: "var(--font-body)",
        minWidth: 160,
      }}
    >
      <p style={{ fontSize: "0.73rem", color: "var(--color-text-dim)", marginBottom: 8, fontWeight: 600 }}>
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ fontSize: "0.78rem", color: p.color, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 2, background: p.color, display: "inline-block", borderRadius: 1 }} />
            {p.name}
          </span>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text)", fontWeight: 600 }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function LineChart(props: LineChartProps) {
  return (
    <ErrorBoundary fallbackTitle="Chart failed to render">
      <LineChartInner {...props} />
    </ErrorBoundary>
  );
}

function LineChartInner({
  data,
  series,
  title,
  yAxisLabel,
  height = 280,
  referenceLines,
  showExport = true,
  exportFilename = "chart_data.csv",
}: LineChartProps) {
  // Thin out data to max 120 points for performance
  const thinned = data.length > 120
    ? data.filter((_, i) => i % Math.ceil(data.length / 120) === 0)
    : data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass"
      style={{ padding: "20px 16px 12px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        {title && (
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            {title}
          </h3>
        )}
        {showExport && (
          <button
            onClick={() => exportCsv(thinned, exportFilename)}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "var(--color-text-muted)",
              fontSize: "0.7rem",
            }}
          >
            <Download size={12} />
            CSV
          </button>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height} minHeight={height}>
        <RechartsLine
          data={thinned}
          margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4a6380", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
            tickFormatter={(v) => String(v).slice(0, 7)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#4a6380", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    fill: "#4a6380",
                    fontSize: 10,
                    dx: 8,
                  }
                : undefined
            }
          />
          <Tooltip content={<CustomTooltip />} />
          {series.length > 1 && (
            <Legend
              wrapperStyle={{ paddingTop: 12, fontSize: "0.75rem" }}
              iconType="plainline"
            />
          )}

          {/* Reference lines for events */}
          {referenceLines?.map((rl, idx) => (
            <ReferenceLine
              key={rl.x ?? `y-${rl.y}-${idx}`}
              {...(rl.x != null ? { x: rl.x } : {})}
              {...(rl.y != null ? { y: rl.y } : {})}
              stroke={rl.color}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: rl.label, fill: rl.color, fontSize: 9, position: rl.y != null ? "right" : "top" }}
            />
          ))}

          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 4, fill: s.color, stroke: "rgba(5,5,10,0.8)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </RechartsLine>
      </ResponsiveContainer>
    </motion.div>
  );
}

/** Convert FredObservation[] to chart data format */
export function fredToChartData(
  seriesMap: Record<string, FredObservation[]>
): Record<string, string | number>[] {
  // Build date-indexed Maps for O(1) lookup instead of O(n) find()
  const dateSet = new Set<string>();
  const dateMaps: Record<string, Map<string, number>> = {};
  for (const [key, obs] of Object.entries(seriesMap)) {
    const map = new Map<string, number>();
    for (const o of obs) {
      dateSet.add(o.date);
      map.set(o.date, o.value);
    }
    dateMaps[key] = map;
  }

  return Array.from(dateSet)
    .sort()
    .map((date) => {
      const row: Record<string, string | number> = { date };
      for (const [key, map] of Object.entries(dateMaps)) {
        const val = map.get(date);
        if (val !== undefined) row[key] = val;
      }
      return row;
    });
}
