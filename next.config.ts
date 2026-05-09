import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Important: évite que Next.js "inférence" un mauvais workspace root
  // (multiple lockfiles) et charge des envs inattendues.
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      {
        source: "/assistant-administratif-immobilier",
        destination: "/assistant-administratif-btp",
        permanent: true,
      },
      {
        source: "/externalisation-administrative-btp-europe",
        destination: "/externalisation-administrative-btp-france",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
