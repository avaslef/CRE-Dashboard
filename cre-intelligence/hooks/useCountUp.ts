"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up hook.
 * Returns a formatted string that counts from 0 to `end`.
 *
 * @param abbrev - When true, abbreviates large numbers (K/M/B/T) so raw
 *   values like 1_245_274 render as "$1.25M" instead of "$1245274".
 *   The abbreviation tier is locked to the final value to keep the unit
 *   stable throughout the animation.
 */
export function useCountUp(
  end: number | null,
  options: {
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    startOnMount?: boolean;
    abbrev?: boolean;
  } = {}
): string {
  const {
    duration = 1400,
    decimals = 2,
    prefix = "",
    suffix = "",
    startOnMount = true,
    abbrev = false,
  } = options;

  const [display, setDisplay] = useState<string>("—");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (end == null || !startOnMount) {
      setDisplay("—");
      return;
    }

    // Lock abbreviation tier to final value so unit stays stable
    const abs = Math.abs(end);
    const div  = abbrev ? (abs >= 1e12 ? 1e12 : abs >= 1e9 ? 1e9 : abs >= 1e6 ? 1e6 : abs >= 1e3 ? 1e3 : 1) : 1;
    const unit = abbrev ? (abs >= 1e12 ? "T" : abs >= 1e9 ? "B" : abs >= 1e6 ? "M" : abs >= 1e3 ? "K" : "") : "";

    const fmt = (val: number): string =>
      `${prefix}${(val / div).toFixed(decimals)}${unit}${suffix}`;

    const target = end;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setDisplay(fmt(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, decimals, prefix, suffix, startOnMount, abbrev]);

  return display;
}
