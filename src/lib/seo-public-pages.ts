/**
 * Métadonnées SEO/GEO centralisées — pages vitrine, douleurs business, géo, assistants.
 * Titles ~45–60 car. · descriptions ~140–160 car. · hreflang francophonie.
 */

import { hreflangExternalisationAdministrativeBtpCluster, metaDescriptionFrancophonie } from "@/lib/seo-francophonie";
import { SEO_KEYWORDS_ASSISTANT_TRAVAUX, SEO_KEYWORDS_GEO_SCOPE, SEO_KEYWORDS_TECHNIQUE } from "@/lib/seo-keywords";

export type PublicPageSeo = {
  title: string;
  description: string;
  keywords?: string[];
  hreflangLanguages?: Record<string, string>;
};

const geoCluster = hreflangExternalisationAdministrativeBtpCluster();

export const PUBLIC_PAGE_SEO: Record<string, PublicPageSeo> = {
  "/relance-devis-btp": {
    title: "Relance devis BTP : ne laissez plus vos chantiers dormir",
    description: metaDescriptionFrancophonie(
      "Relancez vos devis BTP à temps, suivez les réponses et convertissez plus d’offres. Assistants travaux BeWork : bureau tenu, vous sur chantier",
    ),
    keywords: ["relance devis BTP", "suivi devis travaux", "devis travaux", "assistant travaux BTP"],
  },
  "/devis-retard-btp": {
    title: "Devis BTP en retard : accélérer préparation et envois",
    description: metaDescriptionFrancophonie(
      "Devis en retard ? Structurez préparation, relances et envois sans perdre vos prix. Assistant travaux IA pour artisans et conducteurs",
    ),
    keywords: ["devis BTP en retard", "préparation devis BTP", "chiffrage devis BTP", "assistant travaux"],
  },
  "/chantier-mal-suivi": {
    title: "Chantier mal suivi : reprendre le fil administratif",
    description: metaDescriptionFrancophonie(
      "Chantier mal suivi côté bureau ? CR, réserves, fournisseurs et DOE structurés. Relais travaux BTP : vous validez, BeWork suit",
    ),
    keywords: ["chantier mal suivi", "suivi administratif chantier", "dossiers chantier BTP"],
  },
  "/facture-impayee-btp": {
    title: "Facture impayée BTP : relances et trésorerie chantier",
    description: metaDescriptionFrancophonie(
      "Factures impayées sur chantier ? Relances cadrées, suivi encaissements et litiges remontés. Sécurisez la trésorerie sans vos soirées",
    ),
    keywords: ["facture impayée BTP", "relance facture BTP", "impayés chantier", "trésorerie BTP"],
  },
  "/artisan-deborde-administratif": {
    title: "Artisan débordé : déléguer le bureau-chantier BTP",
    description: metaDescriptionFrancophonie(
      "Artisan débordé par l’administratif ? Déléguez devis, relances et dossiers à un assistant travaux BTP, sans recruter en interne",
    ),
    keywords: ["artisan débordé administratif", "artisan BTP administratif", "externalisation BTP"],
  },
  "/impayes-btp-relances": {
    title: "Impayés BTP : relances factures et situations",
    description: metaDescriptionFrancophonie(
      "Impayés BTP : suivez factures et situations, relancez à temps, limitez les retards de paiement. Relais administratif chantier encadré",
    ),
    keywords: ["impayés BTP", "relance facture BTP", "situation travaux impayée"],
  },
  "/situation-travaux-btp": {
    title: "Situation de travaux BTP : structurer et facturer",
    description: metaDescriptionFrancophonie(
      "Situations de travaux BTP : pièces, modèles et envois au fil du chantier. Assistant travaux pour facturer sans retard ni oubli",
    ),
    keywords: ["situation travaux BTP", "facturation chantier", "situation de travaux"],
  },
  "/dict-dt-travaux": {
    title: "DICT et DT travaux : suivi dossiers chantier BTP",
    description: metaDescriptionFrancophonie(
      "DICT et déclarations de travaux : suivi des pièces, relances et classement. Assistant travaux BTP pendant que vous êtes sur site",
    ),
    keywords: ["DICT travaux", "DT travaux BTP", "déclaration travaux", "dossier chantier"],
  },
  "/avenant-chantier": {
    title: "Avenant chantier BTP : cadrer et sécuriser le CA",
    description: metaDescriptionFrancophonie(
      "Avenants travaux : formalisez demandes, chiffrage et preuves pour protéger vos marges. Relais bureau-chantier, validation chez vous",
    ),
    keywords: ["avenant chantier", "avenant travaux BTP", "modification marché travaux"],
  },
  "/suivi-fournisseurs-chantier": {
    title: "Suivi fournisseurs chantier : commandes et livraisons",
    description: metaDescriptionFrancophonie(
      "Suivi fournisseurs et achats chantier : commandes, livraisons, locations et relances pour éviter les blocages terrain",
    ),
    keywords: ["suivi fournisseurs chantier", "commandes chantier BTP", "logistique chantier"],
  },
  "/admin-btp-sans-recruter": {
    title: "Admin BTP sans recruter : relais travaux BeWork",
    description: metaDescriptionFrancophonie(
      "Tenez devis, relances et dossiers chantier sans embauche. Assistants travaux IA, forfaits TTC, supervision depuis la France",
    ),
    keywords: ["admin BTP sans recruter", "externalisation administrative BTP", "relais travaux"],
  },
  "/assistant-administratif-btp": {
    title: "Assistant travaux BTP : relais bureau-chantier | BeWork",
    description: metaDescriptionFrancophonie(
      "Assistant travaux BTP : devis, relances, dossiers chantier et coordination documentaire. Spécialiste bâtiment, pas secrétariat généraliste",
    ),
    keywords: [...SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 8)],
  },
  "/assistant-administratif-externalise": {
    title: "Assistant travaux externalisé pour PME et BTP",
    description: metaDescriptionFrancophonie(
      "Externalisez le bureau-chantier : devis, relances, dossiers et suivi administratif BTP. Forfaits TTC clairs, validation avant engagement",
    ),
    keywords: SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 10),
  },
  "/assistant-administratif-pme": {
    title: "Assistant travaux PME : externaliser l’administratif",
    description: metaDescriptionFrancophonie(
      "PME du bâtiment : déléguez devis, relances et dossiers à un assistant travaux encadré. Accompagnement francophone à distance",
    ),
    keywords: ["assistant travaux PME", "externalisation administrative PME", "assistant BTP"],
  },
  "/assistant-administratif-distance": {
    title: "Assistant travaux à distance | PME et BTP francophones",
    description: metaDescriptionFrancophonie(
      "Assistant travaux à distance : devis, relances et suivi dossiers pour le bâtiment. Plateforme supervisée, forfaits TTC publics",
    ),
    keywords: ["assistant travaux distance", "assistant BTP distance", "relais administratif distance"],
  },
  "/externaliser-administratif": {
    title: "Externaliser l’administratif BTP | Assistant travaux",
    description: metaDescriptionFrancophonie(
      "Externalisez l’administratif chantier : devis, factures, relances et dossiers sans recruter. Relais bureau-chantier spécialisé BTP",
    ),
    keywords: ["externaliser administratif", "externalisation administrative BTP", "assistant travaux"],
  },
  "/externalisation-administrative-btp-france": {
    title: "Externalisation administrative BTP France | BeWork",
    description: metaDescriptionFrancophonie(
      "Externalisation administrative BTP en France : devis, relances, situations, DOE. Assistants travaux IA, sans recruter — forfaits TTC",
      { withGeoTag: false },
    ),
    keywords: ["externalisation administrative BTP France", "assistant travaux France", ...SEO_KEYWORDS_GEO_SCOPE.slice(0, 4)],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-belgique": {
    title: "Externalisation administrative BTP Belgique | BeWork",
    description: metaDescriptionFrancophonie(
      "Belgique : déléguez dossiers chantier, devis et relances à un assistant travaux francophone. Wallonie, Bruxelles — forfaits TTC",
      { withGeoTag: false },
    ),
    keywords: ["externalisation administrative BTP Belgique", "assistant travaux Belgique", "BTP Wallonie"],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-suisse": {
    title: "Externalisation administrative BTP Suisse | BeWork",
    description: metaDescriptionFrancophonie(
      "Suisse romande : relais bureau-chantier pour dossiers, relances et suivi administratif BTP. Process cadré, validation chez vous",
      { withGeoTag: false },
    ),
    keywords: ["externalisation administrative BTP Suisse", "assistant travaux Suisse", "BTP Suisse romande"],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-luxembourg": {
    title: "Externalisation administrative BTP Luxembourg",
    description: metaDescriptionFrancophonie(
      "Luxembourg : assistant travaux pour devis, relances et dossiers chantier. Relais administratif BTP francophone, forfaits TTC",
      { withGeoTag: false },
    ),
    keywords: ["externalisation administrative BTP Luxembourg", "assistant travaux Luxembourg"],
    hreflangLanguages: geoCluster,
  },
  "/cas-clients": {
    title: "Cas clients BTP : organisation et trésorerie chantier",
    description: metaDescriptionFrancophonie(
      "Exemples concrets : devis relancés, dossiers tenus, trésorerie sécurisée. Retours d’expérience d’entreprises du bâtiment avec BeWork",
    ),
    keywords: ["cas clients BTP", "retour expérience BTP", "organisation chantier"],
  },
  "/cas-clients/ccmi-martin-audit-devis": {
    title: "Cas client CCMI Martin : audit devis BTP avant signature",
    description: metaDescriptionFrancophonie(
      "Audit devis CCMI 287 180 € TTC : 92 lignes, rapport DTU × devis, 28 alertes. Devis rectifié avant signature — cas BeWork",
      { withGeoTag: false },
    ),
    keywords: ["audit devis CCMI", "cas client BeWork", "devis BTP"],
  },
};

export function getPublicPageSeo(path: string): PublicPageSeo | undefined {
  return PUBLIC_PAGE_SEO[path];
}
