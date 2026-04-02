import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/assistant-administratif-immobilier",
        destination: "/assistant-administratif-btp",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
