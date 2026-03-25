"use client";

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { motion } from "framer-motion";
import { exportCsv } from "@/lib/utils";
import { Download } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

interface BarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  title?: string;
  height?: number;
  yAxisWidth?: number;
  colorKey?: string;                          // column name used to color bars
  colorMap?: Record<string, string>;
  defaultColor?: string;
  orientation?: "vertical" | "horizontal";
  showLabels?: boolean;
  showExport?: boolean;
  exportFilename?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  xKey,
  yKey,
  isHorizontal,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: Record<string, unknown> }[];
  label?: string;
  xKey?: string;
  yKey?: string;
  isHorizontal?: boolean;
}) => {
  if (!active || !payload?.length) return null;

  // For vertical charts, label = xKey (Market). For horizontal, label = yKey (Market).
  // Pull the category name from the data row to ensure it always shows.
  const row = payload[0].payload;
  const categoryKey = isHorizontal ? yKey : xKey;
  const valueKey = isHorizontal ? xKey : yKey;
  const categoryName = categoryKey ? String(row[categoryKey] ?? label) : label;
  const value = valueKey ? row[valueKey] : payload[0].value;

  return (
    <div
      style={{
        background: "rgba(8,12,24,0.97)",
        border: "1px solid rgba(0,245,255,0.25)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "var(--font-body)",
        maxWidth: 240,
      }}
    >
      <p style={{ fontSize: "0.78rem", color: "var(--color-text)", fontWeight: 600, marginBottom: 4 }}>
        {categoryName}
      </p>
      <p style={{ fontSize: "0.82rem", color: "#00f5ff", fontWeight: 700 }}>
        {typeof value === "number" ? `${value.toFixed(1)}%` : String(value ?? "")}
      </p>
    </div>
  );
};

export function BarChart(props: BarChartProps) {
  return (
    <ErrorBoundary fallbackTitle="Chart failed to render">
      <BarChartInner {...props} />
    </ErrorBoundary>
  );
}

function BarChartInner({
  data,
  xKey,
  yKey,
  title,
  height = 280,
  yAxisWidth = 120,
  colorKey,
  colorMap,
  defaultColor = "#00f5ff",
  orientation = "vertical",
  showLabels = false,
  showExport = true,
  exportFilename = "chart_data.csv",
}: BarChartProps) {
  const isHorizontal = orientation === "horizontal";

  const getColor = (entry: Record<string, unknown>, index: number): string => {
    if (colorKey && colorMap && entry[colorKey]) {
      return colorMap[String(entry[colorKey])] ?? defaultColor;
    }
    // Gradient through neon palette by index
    const palette = ["#00f5ff", "#00ff9d", "#a855f7", "#f59e0b", "#ef4444", "#3b82f6"];
    return palette[index % palette.length];
  };

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
            onClick={() => exportCsv(data, exportFilename)}
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
        <RechartsBar
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 4, right: isHorizontal ? 48 : 8, left: isHorizontal ? 4 : -8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={!isHorizontal} vertical={isHorizontal} />

          {isHorizontal ? (
            <>
              <XAxis type="number" tick={{ fill: "#4a6380", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey={yKey}
                tick={{ fill: "#8fa3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={yAxisWidth}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fill: "#8fa3b8", fontSize: 9 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                angle={-40}
                textAnchor="end"
                interval={0}
                height={90}
              />
              <YAxis tick={{ fill: "#4a6380", fontSize: 10 }} axisLine={false} tickLine={false} />
            </>
          )}

          <Tooltip content={<CustomTooltip xKey={xKey} yKey={yKey} isHorizontal={isHorizontal} />} />

          <Bar
            dataKey={isHorizontal ? xKey : yKey}
            radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry, index)} fillOpacity={0.85} />
            ))}
            {showLabels && (
              <LabelList
                dataKey={isHorizontal ? xKey : yKey}
                position={isHorizontal ? "right" : "top"}
                style={{ fill: "var(--color-text-muted)", fontSize: "0.68rem" }}
                formatter={(v: number) => v?.toLocaleString?.() ?? v}
              />
            )}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </motion.div>
  );
}
