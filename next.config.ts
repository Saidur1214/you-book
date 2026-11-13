import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: [
        "192.168.110.8",
        "contests-textiles-operators-loc.trycloudflare.com"
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

