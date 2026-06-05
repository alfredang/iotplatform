"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { timeAgo } from "@/lib/utils";

export type MapDevice = {
  id: string;
  name: string;
  deviceId: string;
  status: string;
  latitude: number;
  longitude: number;
  lastSeen?: string | null;
};

function FitBounds({ devices }: { devices: MapDevice[] }) {
  const map = useMap();
  useEffect(() => {
    if (devices.length === 0) return;
    if (devices.length === 1) {
      map.setView([devices[0].latitude, devices[0].longitude], 13);
      return;
    }
    const bounds = devices.map((d) => [d.latitude, d.longitude]) as [number, number][];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [devices, map]);
  return null;
}

export default function DeviceMapInner({
  devices,
  height = 480,
}: {
  devices: MapDevice[];
  height?: number;
}) {
  const center: [number, number] = devices[0]
    ? [devices[0].latitude, devices[0].longitude]
    : [1.3521, 103.8198];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ height, width: "100%", borderRadius: "var(--radius)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds devices={devices} />
      {devices.map((d) => {
        const online = d.status === "ONLINE";
        const color = online ? "#22c55e" : "#8a96a6";
        return (
          <CircleMarker
            key={d.id}
            center={[d.latitude, d.longitude]}
            radius={9}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>{d.name}</strong>
                <div style={{ fontSize: 12, color: "#666" }}>{d.deviceId}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Status: <b style={{ color }}>{d.status}</b>
                </div>
                <div style={{ fontSize: 12 }}>
                  {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Updated {timeAgo(d.lastSeen)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
