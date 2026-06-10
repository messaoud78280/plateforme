import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Important: évite que Next.js "inférence" un mauvais workspace root
  // (multiple lockfiles) et charge des envs inattendues.
  outputFileTracingRoot: __dirname,
  images: {
    qualities: [100, 75, 70],
  },
  async redirects() {
    return [
      {
        source: "/assistant-travaux-ia",
        destination: "/services/assistant-travaux",
        permanent: true,
      },
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
      { source: "/assistant-travaux", destination: "/services/assistant-travaux", permanent: true },
      {
        source: "/externalisation-administrative-btp",
        destination: "/services/externalisation-administrative-btp",
        permanent: true,
      },
      { source: "/analyse-dce-btp", destination: "/services/analyse-dce-btp", permanent: true },
      { source: "/memoire-technique-btp", destination: "/services/memoire-technique-btp", permanent: true },
      { source: "/doe-btp", destination: "/services/doe-btp", permanent: true },
      { source: "/ppsps-btp", destination: "/services/ppsps", permanent: true },
      { source: "/compte-rendu-chantier", destination: "/services/compte-rendu-chantier", permanent: true },
      { source: "/situations-travaux-btp", destination: "/situation-travaux-btp", permanent: true },
    ];
  },
};

export default nextConfig;
