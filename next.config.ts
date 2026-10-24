import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${process.env.SHIFTR_API_URL ?? "http://127.0.0.1:8000"}/api/:path*/`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
