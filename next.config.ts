import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Ensure environment variables are available at build time
  env: {
    DATABASE_PATH: process.env.DATABASE_PATH || "./data/app.db",
  },
};

export default nextConfig;
