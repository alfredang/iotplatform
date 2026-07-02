import type { MetadataRoute } from "next";

/**
 * PWA manifest — makes the dashboard installable as a mobile app
 * ("Add to Home Screen" on iOS/Android). Served at /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IoTFlow — Low-code IoT Platform",
    short_name: "IoTFlow",
    description:
      "Connect Arduino, ESP32 & Raspberry Pi over MQTT/HTTP, control them from anywhere, and automate with n8n.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0f17",
    theme_color: "#0b0f17",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    categories: ["productivity", "utilities"],
  };
}
