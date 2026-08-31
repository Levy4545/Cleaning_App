import type { NextConfig } from "next";

import "./src/env";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

if (!process.env.VERCEL) {
  nextConfig.output = "standalone";
}

export default nextConfig;
