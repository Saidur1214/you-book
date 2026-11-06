import type { NextConfig } from "next";

const devAppUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_APP_URL
    ?.replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.110.8",
    "beats-diverse-hormone-pope.trycloudflare.com",
    ...(devAppUrl ? [devAppUrl] : []),
  ],
  experimental: {
    agentFeedback: true,
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

