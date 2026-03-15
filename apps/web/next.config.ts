import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@farmer-platform/types'],
};

export default nextConfig;
