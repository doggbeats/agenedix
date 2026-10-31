import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Permite enviar logo, capa e galeria já otimizadas nos formulários.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
