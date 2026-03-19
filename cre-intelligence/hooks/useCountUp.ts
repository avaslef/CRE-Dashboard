"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up hook.
 * Returns a formatted string that counts from 0 to `end`.
 */
export function useCountUp(
  end: number | null,
  options: {
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    startOnMount?: boolean;
  } = {}
): string {
  const {
    duration = 1400,
    decimals = 1,
    prefix = "",
    suffix = "",
    startOnMount = true,
  } = options;

  const [display, setDisplay] = useState<string>(
    end != null ? `${prefix}${(0).toFixed(decimals)}${suffix}` : "—"
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (end == null || !startOnMount) return;

    const startTime = performance.now();
    const from = 0;
    const to = end;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, decimals, prefix, suffix, startOnMount]);

  return display;
}
