/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Limit parallel static-generation workers to prevent OOM crash
    // with heavy dependencies like @react-pdf/renderer
    cpus: 2,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
      // Browser same-origin; Next proxies to local GFS agent (avoids CORS on :5088)
      {
        source: '/local-agent/:path*',
        destination: 'http://127.0.0.1:5088/:path*',
      },
      {
        source: '/api/:path((?!fx|customers|upload|purchase-requests|execution-sessions|received-customers|v1/fx-houses|media|uploads).*)',
        destination: 'http://127.0.0.1:8080/api/:path',
      },
    ]
  },
}

export default nextConfig
