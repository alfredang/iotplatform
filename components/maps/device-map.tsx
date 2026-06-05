"use client";

import dynamic from "next/dynamic";
import type { MapDevice } from "./device-map-inner";
import { Spinner } from "@/components/ui/misc";

// Leaflet touches `window`, so load the map only on the client.
const DeviceMapInner = dynamic(() => import("./device-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-card border border-border bg-surface-2 text-muted">
      <Spinner /> <span className="ml-2">Loading map…</span>
    </div>
  ),
});

export function DeviceMap(props: { devices: MapDevice[]; height?: number }) {
  return <DeviceMapInner {...props} />;
}

export type { MapDevice };
