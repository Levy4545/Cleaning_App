import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

if (!process.env.VERCEL) {
  nextConfig.output = "standalone";
}

export default nextConfig;
