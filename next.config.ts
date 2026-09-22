import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photo uploads via server actions (max 12 MB per file in uploadCataloguePhoto).
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/render/image/**",
      },
    ],
  },
};

export default nextConfig;
