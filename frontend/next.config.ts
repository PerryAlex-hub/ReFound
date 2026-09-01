import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Item and claim-evidence photos are served from Cloudinary — see
    // ItemPhotoResponse in API.md ("Cloudinary HTTPS URL").
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
