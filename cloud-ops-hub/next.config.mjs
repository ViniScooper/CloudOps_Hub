/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://peers-discussed-gadgets-metres.trycloudflare.com'
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
