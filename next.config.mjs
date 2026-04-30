/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
      {
        source: '/api/:path((?!customers|upload|purchase-requests|execution-sessions|received-customers|v1/fx-houses/purchase-requests|media|uploads).*)',
        destination: 'http://localhost:8080/api/:path', // Proxy everything ELSE to Backend
      },
    ]
  },
}

export default nextConfig
