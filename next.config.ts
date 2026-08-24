import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Important: évite que Next.js "inférence" un mauvais workspace root
  // (multiple lockfiles) et charge des envs inattendues.
  outputFileTracingRoot: __dirname,
  // pdf-parse v2 + canvas natif : ne pas bundler (worker / binaires cassés sinon).
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  // Railway Metal : webpack Next 16 peut OOM à 4 Go — réduire la pression mémoire.
  experimental: {
    webpackMemoryOptimizations: true,
    cpus: 1,
  },
  productionBrowserSourceMaps: false,
  images: {
    qualities: [100, 75, 70],
  },
  async headers() {
    return [
      {
        // En-têtes de sécurité de base (absents en amont, non ajoutés par Cloudflare/Railway).
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
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
      { source: "/tutoriels", destination: "/ressources/tutos", permanent: true },
      { source: "/guides", destination: "/ressources/guides", permanent: true },
      {
        source: "/marches-publics-accords-cadres",
        destination: "/assistants-administratifs-taches#marches-publics-accords-cadres",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
