/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { appDir: true },
  // Static export for Firebase Hosting
  output: 'export',
  // Allow importing from outside app dir (monorepo types)
  transpilePackages: [],
  eslint: { ignoreDuringBuilds: true }
};

module.exports = nextConfig;


