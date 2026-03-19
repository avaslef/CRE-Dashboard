"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled — Leaflet requires browser APIs
const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div
      className="skeleton"
      style={{ height: 520, borderRadius: 16, width: "100%" }}
    />
  ),
});

export { InteractiveMap };
export default InteractiveMap;
