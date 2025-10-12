/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { appDir: true },
  // Static export for Firebase Hosting
  output: 'export'
};

module.exports = nextConfig;


