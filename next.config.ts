import type { NextConfig } from "next";

import "./src/env";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
