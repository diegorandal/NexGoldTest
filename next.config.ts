import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  eslint: {
    // ¡Atención! Esto permitirá que tu proyecto se compile incluso si tiene errores de ESLint.
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: ['*'], // Add your dev origin here
  reactStrictMode: false,
};

export default nextConfig;
