import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/articles/women-agriculture-empowerment",
        destination: "/articles/women-active-promotion-agriculture",
        permanent: true,
      },
      {
        source: "/articles/trial-on-farm-employment-promotion",
        destination: "/articles/trial-farming-employment-promotion",
        permanent: true,
      },
      {
        source: "/articles/farmland-efficiency-loan-support-type",
        destination: "/articles/farm-land-efficiency-loan-support-r8",
        permanent: true,
      },
      {
        source: "/articles/seibi-55",
        destination: "/articles/rural-resource-facility-infrastructure",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
