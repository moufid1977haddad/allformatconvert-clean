import type { NextConfig } from "next";
import { legacyRedirects } from "./lib/legacyRedirects";

const nextConfig: NextConfig = {
  async redirects() {
    return legacyRedirects;
  },
};

export default nextConfig;
