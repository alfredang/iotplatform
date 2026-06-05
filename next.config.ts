import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A single Docker image serves both the web app (`next start`) and the MQTT
  // worker (`tsx`), so we keep the full build output rather than `standalone`.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
