import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default Server Action body limit is 1MB — too small for a document
  // photo. Client-side compression (see ReservationSection) keeps uploads
  // well under this, this just gives headroom.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ztlkvomgcisqlmzycfut.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "tkevjdipmoberbxjggcv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;