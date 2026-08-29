/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.indianexpress.com' },
      { protocol: 'https', hostname: '**.thehindu.com' },
      { protocol: 'https', hostname: '**.thgim.com' },
      { protocol: 'https', hostname: '**.ndtv.com' },
      { protocol: 'https', hostname: '**.gadgets360.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.google.com' },
      { protocol: 'https', hostname: '**.feedburner.com' },
    ],
  },
};

export default nextConfig;
