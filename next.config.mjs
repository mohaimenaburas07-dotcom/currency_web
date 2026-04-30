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
        source: '/api/:path((?!fx|customers|upload|purchase-requests|execution-sessions|received-customers|v1/fx-houses|media|uploads).*)',
        destination: 'http://127.0.0.1:8080/api/:path',
      },
    ]
  },
}

export default nextConfig
