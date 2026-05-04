/** Cluster SEO « douleur business » BTP — pages dédiées, contenus distincts. */
export const BTP_PAIN_PAGE_PATHS = {
  artisanDeborde: "/artisan-deborde-administratif",
  devisRetard: "/devis-retard-btp",
  chantierMalSuivi: "/chantier-mal-suivi",
  factureImpayee: "/facture-impayee-btp",
} as const;

export const BTP_PAIN_PAGE_CLUSTER = [
  {
    href: BTP_PAIN_PAGE_PATHS.artisanDeborde,
    title: "Artisan débordé",
    line: "Devis, factures, relances : la pile qui mange vos soirées",
  },
  {
    href: BTP_PAIN_PAGE_PATHS.devisRetard,
    title: "Devis en retard",
    line: "Réactivité commerciale et taux de signature",
  },
  {
    href: BTP_PAIN_PAGE_PATHS.chantierMalSuivi,
    title: "Chantier mal suivi",
    line: "Dossier, fournisseur, client — quand ça dérape",
  },
  {
    href: BTP_PAIN_PAGE_PATHS.factureImpayee,
    title: "Factures impayées",
    line: "Relances et trésorerie chantier",
  },
] as const;

/** Page « Notre façon de travailler » (demande projet : alias logique « comment ça marche »). */
export const BEWORK_COMMENT_CA_MARCHE_PATH = "/notre-facon-de-travailler" as const;
