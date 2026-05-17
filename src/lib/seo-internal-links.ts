/** Maillage interne SEO — liens contextuels par page publique. */

export type SeoInternalLink = { href: string; label: string };

export const SEO_INTERNAL_LINKS: Record<string, SeoInternalLink[]> = {
  "/": [
    { href: "/tarifs", label: "Tarifs assistant travaux BTP" },
    { href: "/services/assistant-travaux", label: "Assistant travaux augmenté par l’IA" },
    { href: "/ressources", label: "Guides et tutoriels BTP" },
    { href: "/assistants-administratifs-taches", label: "Missions déléguables" },
  ],
  "/relance-devis-btp": [
    { href: "/ressources/chiffrage-devis-btp", label: "Chiffrage devis BTP" },
    { href: "/devis-retard-btp", label: "Devis en retard" },
    { href: "/tarifs", label: "Tarifs BeWork" },
    { href: "/services/assistant-travaux", label: "Assistant travaux" },
  ],
  "/devis-retard-btp": [
    { href: "/relance-devis-btp", label: "Relance devis BTP" },
    { href: "/ressources/chiffrage-devis-btp", label: "Méthode chiffrage devis" },
    { href: "/avenant-chantier", label: "Avenants chantier" },
    { href: "/tarifs", label: "Voir les tarifs" },
  ],
  "/chantier-mal-suivi": [
    { href: "/ressources/compte-rendu-chantier", label: "Compte rendu de chantier" },
    { href: "/ressources/doe-btp", label: "DOE BTP" },
    { href: "/admin-btp-sans-recruter", label: "Admin BTP sans recruter" },
    { href: "/services/assistant-conducteur-de-travaux", label: "Assistant conducteur de travaux" },
  ],
  "/facture-impayee-btp": [
    { href: "/impayes-btp-relances", label: "Impayés et relances" },
    { href: "/situation-travaux-btp", label: "Situations de travaux" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  "/ressources/ppsps-btp": [
    { href: "/ressources/doe-btp", label: "DOE BTP" },
    { href: "/services/ppsps", label: "Service PPSPS BeWork" },
    { href: "/ressources/analyse-dce-btp", label: "Analyse DCE" },
    { href: "/assistants-administratifs-taches", label: "Documents chantier délégués" },
  ],
  "/ressources/doe-btp": [
    { href: "/ressources/ppsps-btp", label: "PPSPS BTP" },
    { href: "/ressources/pv-levee-reserves-btp", label: "Levée de réserves" },
    { href: "/services/doe-btp", label: "Accompagnement DOE" },
    { href: "/externaliser-administratif", label: "Externaliser l’administratif" },
  ],
  "/ressources/analyse-dce-btp": [
    { href: "/ressources/memoire-technique-btp", label: "Mémoire technique" },
    { href: "/services/analyse-dce-btp", label: "Analyse DCE avec BeWork" },
    { href: "/services/assistant-conducteur-de-travaux", label: "Assistant chargé d’affaires" },
    { href: "/relance-devis-btp", label: "Relance devis" },
  ],
  "/ressources/compte-rendu-chantier": [
    { href: "/services/compte-rendu-chantier", label: "Comptes rendus avec BeWork" },
    { href: "/ressources/planning-chantier-btp", label: "Planning chantier" },
    { href: "/chantier-mal-suivi", label: "Chantier mal suivi" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  "/ressources/memoire-technique-btp": [
    { href: "/ressources/analyse-dce-btp", label: "Analyse DCE" },
    { href: "/services/memoire-technique-btp", label: "Mémoire technique BeWork" },
    { href: "/ressources/chiffrage-devis-btp", label: "Chiffrage devis" },
  ],
  "/externalisation-administrative-btp-france": [
    { href: "/externalisation-administrative-btp-belgique", label: "Belgique" },
    { href: "/externalisation-administrative-btp-suisse", label: "Suisse" },
    { href: "/services/externalisation-administrative-btp", label: "Externalisation BTP" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  "/assistant-administratif-btp": [
    { href: "/services/assistant-travaux", label: "Assistant travaux IA" },
    { href: "/assistants-administratifs-taches", label: "Catalogue missions" },
    { href: "/ressources/compte-rendu-chantier", label: "Compte rendu chantier" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  "/services/assistant-travaux": [
    { href: "/services/assistant-conducteur-de-travaux", label: "Assistant conducteur de travaux" },
    { href: "/ressources", label: "Ressources BTP" },
    { href: "/tarifs", label: "Tarifs" },
    { href: "/faq", label: "FAQ BeWork" },
  ],
  "/ressources/chiffrage-devis-btp": [
    { href: "/relance-devis-btp", label: "Relance devis BTP" },
    { href: "/devis-retard-btp", label: "Devis en retard" },
    { href: "/services/chiffrage-devis-btp", label: "Chiffrage devis avec BeWork" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  "/ressources/planning-chantier-btp": [
    { href: "/ressources/compte-rendu-chantier", label: "Compte rendu de chantier" },
    { href: "/services/assistant-conducteur-de-travaux", label: "Assistant conducteur de travaux" },
    { href: "/chantier-mal-suivi", label: "Chantier mal suivi" },
  ],
  "/ressources/pv-levee-reserves-btp": [
    { href: "/ressources/doe-btp", label: "DOE BTP" },
    { href: "/ressources/compte-rendu-chantier", label: "Compte rendu chantier" },
    { href: "/services/assistant-travaux", label: "Assistant travaux" },
  ],
  "/ressources/tuto-skill-ppsps-bework": [
    { href: "/ressources/ppsps-btp", label: "Guide PPSPS BTP" },
    { href: "/services/ppsps", label: "Service PPSPS BeWork" },
    { href: "/ressources/guide-cdt-bework", label: "Guide conducteur de travaux" },
  ],
  "/ressources/tuto-skill-analyse-dce-bework": [
    { href: "/ressources/analyse-dce-btp", label: "Guide analyse DCE" },
    { href: "/ressources/memoire-technique-btp", label: "Mémoire technique" },
    { href: "/services/analyse-dce-btp", label: "Analyse DCE BeWork" },
  ],
};

export function getSeoInternalLinks(path: string): SeoInternalLink[] {
  return SEO_INTERNAL_LINKS[path] ?? [];
}
