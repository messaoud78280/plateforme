/** Maillage interne SEO — liens contextuels par page publique. */

export type SeoInternalLink = { href: string; label: string };

export const SEO_INTERNAL_LINKS: Record<string, SeoInternalLink[]> = {
  "/": [
    { href: "/tarifs", label: "Tarifs assistant travaux BTP" },
    { href: "/services/assistant-travaux", label: "Assistant travaux augmenté par l’IA" },
    { href: "/ressources", label: "Guides et tutoriels BTP" },
    { href: "/assistants-administratifs-taches", label: "Missions déléguables" },
    { href: "/contact", label: "Qualifier votre besoin BTP" },
    { href: "/notre-facon-de-travailler", label: "Notre méthode BeWork" },
  ],
  "/tarifs": [
    { href: "/services", label: "Tous les services BeWork" },
    { href: "/assistants-administratifs-taches", label: "Catalogue des missions déléguables" },
    { href: "/notre-facon-de-travailler", label: "Méthode et validation" },
    { href: "/faq", label: "FAQ BeWork" },
    { href: "/contact", label: "Démarrer un échange" },
  ],
  "/contact": [
    { href: "/tarifs", label: "Tarifs forfaits HT" },
    { href: "/notre-facon-de-travailler", label: "Notre méthode" },
    { href: "/services", label: "Services BeWork" },
    { href: "/faq", label: "FAQ" },
  ],
  "/faq": [
    { href: "/notre-facon-de-travailler", label: "Méthode et validation" },
    { href: "/tarifs", label: "Tarifs" },
    { href: "/contact", label: "Contacter BeWork" },
    { href: "/services/assistant-travaux", label: "Assistant travaux" },
  ],
  "/services": [
    { href: "/services/assistant-travaux", label: "Assistant travaux BTP" },
    { href: "/services/compte-rendu-chantier", label: "Comptes rendus chantier" },
    { href: "/services/analyse-dce-btp", label: "Analyse DCE" },
    { href: "/services/doe-btp", label: "DOE BTP" },
    { href: "/ressources", label: "Ressources et guides" },
  ],
  "/notre-facon-de-travailler": [
    { href: "/tarifs", label: "Tarifs forfaits HT" },
    { href: "/services", label: "Tous les services" },
    { href: "/contact", label: "Démarrer un échange" },
    { href: "/faq", label: "FAQ" },
  ],
  "/cas-clients": [
    { href: "/cas-clients/ccmi-martin-audit-devis", label: "Audit devis CCMI Martin" },
    { href: "/services/assistant-travaux", label: "Assistant travaux" },
    { href: "/tarifs", label: "Tarifs" },
    { href: "/contact", label: "Démarrer un échange" },
  ],
  "/assistants-administratifs-taches": [
    { href: "/services/assistant-travaux", label: "Assistant travaux IA" },
    { href: "/tarifs", label: "Tarifs" },
    { href: "/ressources", label: "Ressources BTP" },
    { href: "/contact", label: "Démarrer un échange" },
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
    { href: "/ressources/analyse-dce-chiffrage-btp", label: "Analyse DCE & appui chiffrage" },
    { href: "/ressources/memoire-technique-btp", label: "Mémoire technique" },
    { href: "/services/analyse-dce-btp", label: "Analyse DCE avec BeWork" },
    { href: "/services/assistant-conducteur-de-travaux", label: "Assistant chargé d’affaires" },
    { href: "/relance-devis-btp", label: "Relance devis" },
  ],
  "/ressources/analyse-dce-chiffrage-btp": [
    { href: "/ressources/analyse-dce-btp", label: "Guide analyse DCE" },
    { href: "/ressources/chiffrage-devis-btp", label: "Méthode chiffrage devis" },
    { href: "/devis-retard-btp", label: "Devis en retard" },
    { href: "/services/chiffrage-devis-btp", label: "Appui chiffrage BeWork" },
    { href: "/services/analyse-dce-btp", label: "Service analyse DCE" },
    { href: "/ressources", label: "Hub ressources" },
    { href: "/contact", label: "Contact" },
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
    { href: "/externalisation-administrative-btp-luxembourg", label: "Luxembourg" },
    { href: "/services/externalisation-administrative-btp", label: "Externalisation BTP" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  "/externalisation-administrative-btp-belgique": [
    { href: "/externalisation-administrative-btp-france", label: "France" },
    { href: "/externalisation-administrative-btp-suisse", label: "Suisse" },
    { href: "/externalisation-administrative-btp-luxembourg", label: "Luxembourg" },
    { href: "/services/externalisation-administrative-btp", label: "Externalisation BTP" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  "/externalisation-administrative-btp-suisse": [
    { href: "/externalisation-administrative-btp-france", label: "France" },
    { href: "/externalisation-administrative-btp-belgique", label: "Belgique" },
    { href: "/externalisation-administrative-btp-luxembourg", label: "Luxembourg" },
    { href: "/services/externalisation-administrative-btp", label: "Externalisation BTP" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  "/externalisation-administrative-btp-luxembourg": [
    { href: "/externalisation-administrative-btp-france", label: "France" },
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
    { href: "/ressources/analyse-dce-chiffrage-btp", label: "Analyse DCE & appui chiffrage" },
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
  "/ressources/tuto-skill-doe-bework": [
    { href: "/ressources/doe-btp", label: "Guide DOE BTP" },
    { href: "/services/doe-btp", label: "Service DOE BeWork" },
    { href: "/ressources/pv-levee-reserves-btp", label: "PV levée de réserves" },
  ],
  "/ressources/tuto-skill-memoire-technique-bework": [
    { href: "/ressources/memoire-technique-btp", label: "Guide mémoire technique" },
    { href: "/ressources/analyse-dce-btp", label: "Analyse DCE" },
    { href: "/services/memoire-technique-btp", label: "Mémoire technique BeWork" },
  ],
  "/ressources/tuto-skill-chiffrage-devis-bework": [
    { href: "/ressources/chiffrage-devis-btp", label: "Chiffrage devis BTP" },
    { href: "/relance-devis-btp", label: "Relance devis BTP" },
    { href: "/services/chiffrage-devis-btp", label: "Chiffrage devis BeWork" },
  ],
  "/ressources/tuto-skill-pv-levee-reserves-bework": [
    { href: "/ressources/pv-levee-reserves-btp", label: "Guide PV levée de réserves" },
    { href: "/ressources/doe-btp", label: "DOE BTP" },
    { href: "/ressources/compte-rendu-chantier", label: "Compte rendu chantier" },
  ],
  "/ressources/tuto-skill-constat-retard-bework": [
    { href: "/devis-retard-btp", label: "Devis en retard" },
    { href: "/ressources/planning-chantier-btp", label: "Planning chantier" },
    { href: "/chantier-mal-suivi", label: "Chantier mal suivi" },
  ],
  "/ressources/guide-cdt-bework": [
    { href: "/ressources/guide-conducteur-de-travaux-ia-bework", label: "Guide conducteur de travaux IA" },
    { href: "/ressources/compte-rendu-chantier-guide-btp", label: "Guide CR chantier" },
    { href: "/services/assistant-conducteur-de-travaux", label: "Assistant conducteur de travaux" },
  ],
  "/ressources/guide-conducteur-de-travaux-ia-bework": [
    { href: "/ressources/guide-cdt-bework", label: "Guide CDT — version condensée" },
    { href: "/services/assistant-conducteur-de-travaux", label: "Assistant conducteur de travaux" },
    { href: "/ressources/tutos", label: "Tous les tutos skills" },
  ],
  "/ressources/compte-rendu-chantier-guide-btp": [
    { href: "/ressources/compte-rendu-chantier", label: "Méthode CR chantier" },
    { href: "/ressources/tuto-skill-pv-levee-reserves-bework", label: "PV levée de réserves" },
    { href: "/services/compte-rendu-chantier", label: "CR chantier BeWork" },
  ],
  "/impayes-btp-relances": [
    { href: "/facture-impayee-btp", label: "Facture impayée BTP" },
    { href: "/situation-travaux-btp", label: "Situations de travaux" },
    { href: "/tarifs", label: "Tarifs" },
    { href: "/contact", label: "Démarrer un échange" },
  ],
  "/situation-travaux-btp": [
    { href: "/impayes-btp-relances", label: "Impayés et relances" },
    { href: "/facture-impayee-btp", label: "Facture impayée BTP" },
    { href: "/services/assistant-travaux", label: "Assistant travaux" },
  ],
  "/dict-dt-travaux": [
    { href: "/services/assistant-travaux", label: "Assistant travaux IA" },
    { href: "/ressources/ppsps-btp", label: "PPSPS BTP" },
    { href: "/admin-btp-sans-recruter", label: "Admin BTP sans recruter" },
  ],
  "/artisan-deborde-administratif": [
    { href: "/admin-btp-sans-recruter", label: "Admin BTP sans recruter" },
    { href: "/relance-devis-btp", label: "Relance devis" },
    { href: "/tarifs", label: "Tarifs" },
    { href: "/contact", label: "Démarrer un échange" },
  ],
  "/ressources/bework-maitrise-doeuvre": [
    { href: "/ressources/analyse-dce-btp", label: "Analyse DCE" },
    { href: "/ressources/memoire-technique-btp", label: "Mémoire technique" },
    { href: "/ressources/compte-rendu-chantier", label: "Compte rendu chantier" },
    { href: "/ressources/doe-btp", label: "DOE BTP" },
    { href: "/tarifs", label: "Tarifs BeWork" },
  ],
  "/ressources/tuto-skill-planning-chantier-bework": [
    { href: "/ressources/planning-chantier-btp", label: "Guide planning chantier BTP" },
    { href: "/ressources/tuto-skill-constat-retard-bework", label: "Skill constat de retard" },
    { href: "/ressources/compte-rendu-chantier", label: "Compte rendu chantier" },
    { href: "/services/assistant-conducteur-de-travaux", label: "Assistant conducteur de travaux" },
    { href: "/chantier-mal-suivi", label: "Chantier mal suivi" },
  ],
};

export function getSeoInternalLinks(path: string): SeoInternalLink[] {
  return SEO_INTERNAL_LINKS[path] ?? [];
}
