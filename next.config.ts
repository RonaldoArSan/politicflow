import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: "./",
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
