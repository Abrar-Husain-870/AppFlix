import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the workspace root so Next.js doesn't confuse
    // the AppGram lockfile with any parent directory lockfile.
    root: __dirname,
  },
};

export default nextConfig;
