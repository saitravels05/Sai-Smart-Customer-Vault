/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable standalone in Linux Docker environments to avoid Windows EPERM symlink restrictions
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
