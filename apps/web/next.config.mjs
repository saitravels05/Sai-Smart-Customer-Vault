/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable standalone in Linux Docker environments to avoid Windows EPERM symlink restrictions
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['argon2', '@prisma/client'],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl && backendUrl.startsWith('http')) {
      const base = backendUrl.replace(/\/api\/v1\/?$/, '');
      return [
        {
          source: '/api/v1/:path*',
          destination: `${base}/api/v1/:path*`,
        },
        {
          source: '/api/docs/:path*',
          destination: `${base}/api/docs/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
