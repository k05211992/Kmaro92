/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any domain for plant photos (MVP: using external URLs)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
