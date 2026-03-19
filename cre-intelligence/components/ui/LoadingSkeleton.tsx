"use client";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 20, className = "", style = {} }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

export function KPICardSkeleton() {
  return (
    <div className="glass" style={{ padding: 20 }}>
      <Skeleton height={12} width="60%" style={{ marginBottom: 16 }} />
      <Skeleton height={36} width="70%" style={{ marginBottom: 10 }} />
      <Skeleton height={12} width="45%" />
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="glass" style={{ padding: 20 }}>
      <Skeleton height={14} width="40%" style={{ marginBottom: 20 }} />
      <Skeleton height={height} width="100%" />
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="news-card">
      <Skeleton height={10} width="30%" style={{ marginBottom: 10 }} />
      <Skeleton height={16} width="90%" style={{ marginBottom: 6 }} />
      <Skeleton height={16} width="75%" style={{ marginBottom: 10 }} />
      <Skeleton height={12} width="60%" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === 0 ? "80%" : "60%"} />
      ))}
    </div>
  );
}
