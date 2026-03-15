import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@farmer-platform/types'],
  // serverExternalPackages and transpilePackages conflict for the same package.
  // We use transpilePackages to allow Turbopack to see the TS source.
};

export default nextConfig;
