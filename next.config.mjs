/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse imports a local test PDF at module load; opting it out of
  // webpack bundling prevents the "ENOENT test/data/…" crash in API routes.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
