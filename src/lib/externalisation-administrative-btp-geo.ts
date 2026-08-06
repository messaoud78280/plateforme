/** Cluster SEO : 4 pages pays (même famille sémantique, contenus uniques). */
export const EXTERNALISATION_ADMIN_BT_PATHS = {
  france: "/externalisation-administrative-btp-france",
  belgique: "/externalisation-administrative-btp-belgique",
  suisse: "/externalisation-administrative-btp-suisse",
  luxembourg: "/externalisation-administrative-btp-luxembourg",
} as const;

export type ExternalisationAdminBtGeoKey = keyof typeof EXTERNALISATION_ADMIN_BT_PATHS;

export { hreflangExternalisationAdministrativeBtpCluster } from "@/lib/seo-francophonie";

/** Liens pour maillage (header, home, pied de page des landings). */
export const EXTERNALISATION_ADMIN_BT_NAV = [
  {
    key: "france",
    href: EXTERNALISATION_ADMIN_BT_PATHS.france,
    title: "France",
    line: "Artisans, CT, PME bâtiment",
  },
  {
    key: "belgique",
    href: EXTERNALISATION_ADMIN_BT_PATHS.belgique,
    title: "Belgique",
    line: "Construction & plateforme métier",
  },
  {
    key: "suisse",
    href: EXTERNALISATION_ADMIN_BT_PATHS.suisse,
    title: "Suisse",
    line: "Romandie & PME bâtiment",
  },
  {
    key: "luxembourg",
    href: EXTERNALISATION_ADMIN_BT_PATHS.luxembourg,
    title: "Luxembourg",
    line: "Plateforme PME BTP",
  },
] as const;
