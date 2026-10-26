import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A single Docker image serves both the web app (`next start`) and the MQTT
  // worker (`tsx`), so we keep the full build output rather than `standalone`.
  outputFileTracingRoot: __dirname,
  async redirects() {
    // Googlebot pulls "/&" and "/$" out of inlined JS and reports them as
    // 404s on the tertiaryinfotech.com domain property.
    return [
      { source: "/&", destination: "/", permanent: true },
      { source: "/\\$", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
