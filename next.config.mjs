/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['84.247.180.142', '526f-41-139-244-209.ngrok-free.app'],
}

export default nextConfig
