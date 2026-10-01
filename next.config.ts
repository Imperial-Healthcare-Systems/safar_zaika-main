import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next 16 writes AGENTS.md/CLAUDE.md into the repo on `next dev`; keep the tree clean.
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // The spec lists both /menu/[id] and /restaurant/[id]; one canonical page.
    return [{ source: "/menu/:id", destination: "/restaurant/:id", permanent: false }];
  },
};

export default nextConfig;
