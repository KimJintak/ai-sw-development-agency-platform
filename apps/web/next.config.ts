import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['shared-types'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/socket.io/:path*`,
      },
    ]
  },
}

export default nextConfig
