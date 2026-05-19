/**
 * Métadonnées SEO/GEO centralisées — pages vitrine, douleurs business, géo, assistants.
 * Titles ~45–60 car. · descriptions ~140–160 car.
 */

import { SEO_KEYWORDS_ASSISTANT_TRAVAUX, SEO_KEYWORDS_GEO_SCOPE, SEO_KEYWORDS_TECHNIQUE } from "@/lib/seo-keywords";

export type PublicPageSeo = {
  title: string;
  description: string;
  keywords?: string[];
  hreflangLanguages?: Record<string, string>;
};

export const PUBLIC_PAGE_SEO: Record<string, PublicPageSeo> = {
  "/relance-devis-btp": {
    title: "Relance devis BTP : ne laissez plus vos chantiers dormir",
    description:
      "Relancez vos devis BTP à temps, suivez les réponses et convertissez plus d’offres. Assistants travaux BeWork : on tient le bureau, vous le chantier.",
    keywords: ["relance devis BTP", "suivi devis travaux", "devis travaux", "assistant travaux BTP"],
  },
  "/devis-retard-btp": {
    title: "Devis BTP en retard : accélérer préparation et envois",
    description:
      "Devis en retard ? Structurez préparation, relances et envois sans perdre le contrôle prix. Assistant travaux augmenté par l’IA pour le BTP.",
    keywords: ["devis BTP en retard", "préparation devis BTP", "chiffrage devis BTP", "assistant travaux"],
  },
  "/chantier-mal-suivi": {
    title: "Chantier mal suivi : reprendre le fil administratif",
    description:
      "Chantier mal suivi côté bureau ? CR, réserves, fournisseurs et DOE structurés avec un relais travaux BTP. Vous validez, BeWork suit.",
    keywords: ["chantier mal suivi", "suivi administratif chantier", "dossiers chantier BTP"],
  },
  "/facture-impayee-btp": {
    title: "Facture impayée BTP : relances et trésorerie chantier",
    description:
      "Factures impayées sur chantier ? Relances cadrées, suivi encaissements et remontée des litiges. Sécurisez votre trésorerie sans y passer vos soirées.",
    keywords: ["facture impayée BTP", "relance facture BTP", "impayés chantier", "trésorerie BTP"],
  },
  "/artisan-deborde-administratif": {
    title: "Artisan débordé : déléguer le bureau-chantier BTP",
    description:
      "Artisan débordé par l’administratif ? Déléguez devis, relances et dossiers à un assistant travaux BTP, sans recruter en interne.",
    keywords: ["artisan débordé administratif", "artisan BTP administratif", "externalisation BTP"],
  },
  "/impayes-btp-relances": {
    title: "Impayés BTP : relances factures et situations",
    description:
      "Impayés BTP : suivez factures et situations, relancez à temps et limitez les retards de paiement. Relais administratif chantier encadré.",
    keywords: ["impayés BTP", "relance facture BTP", "situation travaux impayée"],
  },
  "/situation-travaux-btp": {
    title: "Situation de travaux BTP : structurer et facturer",
    description:
      "Situations de travaux BTP : pièces, modèles et envois au fil du chantier. Assistant travaux pour cadrer la facturation sans retard.",
    keywords: ["situation travaux BTP", "facturation chantier", "situation de travaux"],
  },
  "/dict-dt-travaux": {
    title: "DICT et DT travaux : suivi dossiers chantier BTP",
    description:
      "DICT et déclarations de travaux : suivi des pièces, relances et classement. Assistant travaux BTP pour tenir le bureau pendant que vous êtes sur site.",
    keywords: ["DICT travaux", "DT travaux BTP", "déclaration travaux", "dossier chantier"],
  },
  "/avenant-chantier": {
    title: "Avenant chantier BTP : cadrer et sécuriser le CA",
    description:
      "Avenants travaux : formalisez demandes, chiffrage et preuves pour protéger vos marges. Relais bureau-chantier BeWork, validation chez vous.",
    keywords: ["avenant chantier", "avenant travaux BTP", "modification marché travaux"],
  },
  "/suivi-fournisseurs-chantier": {
    title: "Suivi fournisseurs chantier : commandes et livraisons",
    description:
      "Suivi fournisseurs et achats chantier : commandes, livraisons, locations et relances pour éviter les blocages sur le terrain.",
    keywords: ["suivi fournisseurs chantier", "commandes chantier BTP", "logistique chantier"],
  },
  "/admin-btp-sans-recruter": {
    title: "Admin BTP sans recruter : relais travaux BeWork",
    description:
      "Tenez devis, relances et dossiers chantier sans embauche interne. Assistants travaux augmentés par l’IA, forfaits TTC, supervision France.",
    keywords: ["admin BTP sans recruter", "externalisation administrative BTP", "relais travaux"],
  },
  "/assistant-administratif-btp": {
    title: "Assistant travaux BTP : relais bureau-chantier | BeWork",
    description:
      "Assistant travaux pour le BTP : devis, relances, dossiers chantier et coordination documentaire. Spécialiste bâtiment, pas secrétariat généraliste.",
    keywords: [...SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 8)],
  },
  "/assistant-administratif-externalise": {
    title: "Assistant travaux externalisé pour PME et BTP",
    description:
      "Externalisez le bureau-chantier : devis, relances, dossiers et suivi administratif BTP. Forfaits TTC clairs, validation avant tout engagement.",
    keywords: SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 10),
  },
  "/assistant-administratif-pme": {
    title: "Assistant travaux PME : externaliser l’administratif",
    description:
      "PME du bâtiment : déléguez devis, relances et dossiers à un assistant travaux encadré. France, Belgique, Suisse, Luxembourg.",
    keywords: ["assistant travaux PME", "externalisation administrative PME", "assistant BTP"],
  },
  "/assistant-administratif-distance": {
    title: "Assistant travaux à distance | PME et BTP francophones",
    description:
      "Assistant travaux à distance : devis, relances et suivi dossiers pour entreprises du bâtiment. Plateforme supervisée, forfaits TTC publics.",
    keywords: ["assistant travaux distance", "assistant BTP distance", "relais administratif distance"],
  },
  "/externaliser-administratif": {
    title: "Externaliser l’administratif BTP | Assistant travaux",
    description:
      "Externalisez l’administratif chantier : devis, factures, relances et dossiers sans recruter. Relais bureau-chantier spécialisé BTP.",
    keywords: ["externaliser administratif", "externalisation administrative BTP", "assistant travaux"],
  },
  "/externalisation-administrative-btp-france": {
    title: "Externalisation administrative BTP France | BeWork",
    description:
      "Externalisation administrative BTP en France : devis, relances, situations, DOE. Assistants travaux augmentés par l’IA, sans recruter.",
    keywords: ["externalisation administrative BTP France", "assistant travaux France", ...SEO_KEYWORDS_GEO_SCOPE.slice(0, 4)],
  },
  "/externalisation-administrative-btp-belgique": {
    title: "Externalisation administrative BTP Belgique | BeWork",
    description:
      "Belgique : déléguez dossiers chantier, devis et relances à un assistant travaux francophone. Accompagnement à distance, forfaits TTC.",
    keywords: ["externalisation administrative BTP Belgique", "assistant travaux Belgique"],
  },
  "/externalisation-administrative-btp-suisse": {
    title: "Externalisation administrative BTP Suisse | BeWork",
    description:
      "Suisse romande et francophone : relais bureau-chantier pour dossiers, relances et suivi administratif BTP. Process cadré, validation chez vous.",
    keywords: ["externalisation administrative BTP Suisse", "assistant travaux Suisse"],
  },
  "/externalisation-administrative-btp-luxembourg": {
    title: "Externalisation administrative BTP Luxembourg",
    description:
      "Luxembourg : assistant travaux pour devis, relances et dossiers chantier. Relais administratif BTP francophone, forfaits publics TTC.",
    keywords: ["externalisation administrative BTP Luxembourg", "assistant travaux Luxembourg"],
  },
  "/cas-clients": {
    title: "Cas clients BTP : organisation et trésorerie chantier",
    description:
      "Exemples concrets : devis relancés, dossiers tenus, trésorerie sécurisée. Retours d’expérience d’entreprises du bâtiment avec BeWork.",
    keywords: ["cas clients BTP", "retour expérience BTP", "organisation chantier"],
  },
  "/cas-clients/ccmi-martin-audit-devis": {
    title: "Cas client CCMI Martin : audit devis BTP avant signature",
    description:
      "Audit d’un devis CCMI de 287 180 € TTC : 92 lignes, rapport DTU × devis (23 normes, 28 alertes), devis rectifié avant signature.",
    keywords: ["audit devis CCMI", "cas client BeWork", "devis BTP"],
  },
};

export function getPublicPageSeo(path: string): PublicPageSeo | undefined {
  return PUBLIC_PAGE_SEO[path];
}
