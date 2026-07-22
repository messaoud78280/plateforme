/**
 * Métadonnées SEO/GEO centralisées — pages vitrine, douleurs business, géo, assistants.
 * Titles ~45–60 car. · descriptions ~140–160 car. · hreflang francophonie.
 */

import { hreflangAssistantTravauxCluster } from "@/lib/assistant-travaux-geo";
import { ASSISTANT_TRAVAUX_VILLE_PATHS, ASSISTANT_TRAVAUX_VILLES } from "@/lib/assistant-travaux-villes";
import { hreflangExternalisationAdministrativeBtpCluster, metaDescriptionFrancophonie } from "@/lib/seo-francophonie";
import {
  SEO_KEYWORDS_APPELS_OFFRES,
  SEO_KEYWORDS_ASSISTANT_TRAVAUX,
  SEO_KEYWORDS_GEO_SCOPE,
  SEO_KEYWORDS_TECHNIQUE,
} from "@/lib/seo-keywords";

export type PublicPageSeo = {
  title: string;
  description: string;
  keywords?: string[];
  hreflangLanguages?: Record<string, string>;
};

const geoCluster = hreflangExternalisationAdministrativeBtpCluster();
const assistantTravauxGeoCluster = hreflangAssistantTravauxCluster();

const villePagesSeo: Record<string, PublicPageSeo> = Object.fromEntries(
  (Object.entries(ASSISTANT_TRAVAUX_VILLE_PATHS) as [keyof typeof ASSISTANT_TRAVAUX_VILLE_PATHS, string][]).map(
    ([key, path]) => {
      const v = ASSISTANT_TRAVAUX_VILLES[key];
      return [
        path,
        {
          title: `Assistant travaux ${v.label.split(" &")[0]} | BeWork`,
          description: metaDescriptionFrancophonie(
            `Assistant travaux ${v.label} : assistance technique et administrative BTP, devis, marchés publics et dossiers chantier à distance`,
            { withGeoTag: false },
          ),
          keywords: [`assistant travaux ${v.label}`, "assistant BTP", "externalisation administrative BTP"],
        },
      ];
    },
  ),
);

export const PUBLIC_PAGE_SEO: Record<string, PublicPageSeo> = {
  ...villePagesSeo,
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
      "Chantier mal suivi côté bureau ? CR, réserves, fournisseurs et DOE structurés. Assistance travaux BTP : vous validez, BeWork suit",
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
    title: "Artisan débordé : déléguer l'assistance administrative chantier BTP",
    description: metaDescriptionFrancophonie(
      "Artisan débordé par l’administratif ? Déléguez devis, relances et dossiers à un assistant travaux BTP, sans recruter en interne",
    ),
    keywords: ["artisan débordé administratif", "artisan BTP administratif", "externalisation BTP"],
  },
  "/impayes-btp-relances": {
    title: "Impayés BTP : relances factures et situations",
    description: metaDescriptionFrancophonie(
      "Impayés BTP : suivez factures et situations, relancez à temps, limitez les retards de paiement. Assistance travaux chantier encadrée",
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
      "Avenants travaux : formalisez demandes, chiffrage et preuves pour protéger vos marges. Assistance travaux, validation chez vous",
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
    title: "Admin BTP sans recruter : assistance travaux BeWork",
    description: metaDescriptionFrancophonie(
      "Tenez devis, relances et dossiers chantier sans embauche. Assistants travaux IA, forfaits HT, supervision depuis la France",
    ),
    keywords: ["admin BTP sans recruter", "assistance travaux BTP", "externalisation chantier"],
  },
  "/comparatif-assistance-travaux-btp": {
    title: "Comparatif : recruter, externaliser ou BeWork pour le BTP",
    description: metaDescriptionFrancophonie(
      "Recruter en interne, prestataire administratif ou BeWork ? Comparatif périmètre BTP, DCE, marchés publics, coût et validation",
    ),
    keywords: [
      "comparatif assistant travaux BTP",
      "recruter ou externaliser BTP",
      "assistance travaux BTP",
      "alternative recrutement conducteur travaux",
    ],
  },
  "/checklist-depot-appel-offres-btp": {
    title: "Checklist dépôt appel d'offres BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Checklist terrain avant dépôt AO : pièces administratives, mémoire technique, DPGF et contrôles anti-rejet pour marchés publics travaux",
    ),
    keywords: [
      "checklist appel d'offres BTP",
      "dépôt marché public travaux",
      "pièces obligatoires AO BTP",
      "éviter rejet offre",
    ],
  },
  "/assistant-administratif-btp": {
    title: "Assistant travaux BTP : assistance technique et administrative | BeWork",
    description: metaDescriptionFrancophonie(
      "Assistant travaux BTP : analyse DCE, dossiers chantier, appels d'offres et marchés publics. Spécialiste bâtiment, pas prestation administrative généraliste",
    ),
    keywords: [...SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 8), "assistance technique BTP"],
  },
  "/assistant-administratif-externalise": {
    title: "Assistant travaux externalisé pour PME et BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Externalisez l'assistance travaux BTP : analyse DCE, dossiers chantier, relances et marchés publics. Forfaits HT clairs, validation avant engagement",
    ),
    keywords: SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 10),
  },
  "/assistant-administratif-pme": {
    title: "Assistant travaux PME : assistance chantier et marchés publics",
    description: metaDescriptionFrancophonie(
      "PME du bâtiment : déléguez analyse DCE, relances, dossiers chantier et suivi marché public. Assistance travaux encadrée, francophone à distance",
    ),
    keywords: ["assistant travaux PME", "assistance technique BTP PME", "assistant BTP"],
  },
  "/assistant-administratif-distance": {
    title: "Assistant travaux à distance | PME et BTP francophones",
    description: metaDescriptionFrancophonie(
      "Assistant travaux à distance : analyse DCE, relances, comptes rendus et suivi dossiers chantier. Plateforme supervisée, forfaits HT publics",
    ),
    keywords: ["assistant travaux distance", "assistant BTP distance", "assistance travaux à distance"],
  },
  "/externaliser-administratif": {
    title: "Externaliser l'assistance travaux BTP | Assistant travaux",
    description: metaDescriptionFrancophonie(
      "Externaliser le suivi chantier : analyse DCE, devis, relances, marchés publics et DOE sans recruter. Assistance travaux spécialisée BTP",
    ),
    keywords: ["externaliser assistance travaux", "externalisation administrative BTP", "assistant travaux"],
  },
  "/externalisation-administrative-btp-france": {
    title: "Assistance travaux BTP France | Externalisation encadrée",
    description: metaDescriptionFrancophonie(
      "Assistance travaux BTP en France : analyse DCE, appels d'offres, situations, DOE. Assistants travaux IA, sans recruter — forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["assistance travaux BTP France", "assistant travaux France", ...SEO_KEYWORDS_GEO_SCOPE.slice(0, 4)],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-belgique": {
    title: "Assistance travaux BTP Belgique | BeWork",
    description: metaDescriptionFrancophonie(
      "Belgique : assistance travaux francophone — analyse DCE, dossiers chantier, marchés publics. Wallonie, Bruxelles — forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["assistance travaux BTP Belgique", "assistant travaux Belgique", "BTP Wallonie"],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-suisse": {
    title: "Assistance travaux BTP Suisse romande | BeWork",
    description: metaDescriptionFrancophonie(
      "Suisse romande : assistance technique et administrative chantier — dossiers, relances, pièces marché. Process cadré, validation chez vous",
      { withGeoTag: false },
    ),
    keywords: ["assistance travaux BTP Suisse", "assistant travaux Suisse romande"],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-luxembourg": {
    title: "Assistance travaux BTP Luxembourg | BeWork",
    description: metaDescriptionFrancophonie(
      "Luxembourg : assistant travaux pour analyse DCE, marchés publics et dossiers chantier. Assistance BTP francophone, forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["assistance travaux BTP Luxembourg", "assistant travaux Luxembourg"],
    hreflangLanguages: geoCluster,
  },
  "/cas-clients": {
    title: "Cas clients BTP : assistance travaux et résultats chantier",
    description: metaDescriptionFrancophonie(
      "Exemples concrets : dossiers structurés, devis relancés, situations cadrées, trésorerie sécurisée. Retours d’expérience d’entreprises du bâtiment avec BeWork",
    ),
    keywords: ["cas clients BTP", "retour expérience BTP", "organisation chantier"],
  },
  "/faq": {
    title: "FAQ assistant travaux BTP : marchés publics, Chorus Pro, DOE | BeWork",
    description: metaDescriptionFrancophonie(
      "FAQ BeWork : assistant travaux, exécution marché public, Chorus Pro, amiante SS4, DCE, DOE, forfaits et validation avant envoi",
    ),
    keywords: [
      "FAQ BeWork",
      "assistant travaux marché public",
      "gestion administrative marché public BTP",
      "facturation Chorus Pro BTP",
      "DOE marché public BTP",
      "amiante SS4 logement occupé",
    ],
  },
  "/contact": {
    title: "Contact BeWork — cadrer un renfort AO, DCE ou suivi de marché",
    description: metaDescriptionFrancophonie(
      "Contactez BeWork : candidature, analyse DCE ou suivi admin de marché — qualification en quelques minutes, mission sous votre validation",
    ),
    keywords: ["contact BeWork", "renfort administratif BTP", "appel d'offres BTP", "qualification besoin AO"],
  },
  "/notre-facon-de-travailler": {
    title: "Notre façon de travailler — méthode BeWork BTP",
    description: metaDescriptionFrancophonie(
      "Méthode BeWork : cadrage, validation client, relecture humaine et traçabilité — renfort dossier, pas prise en charge intégrale",
    ),
    keywords: ["méthode BeWork", "validation client BTP", "process assistant travaux", "renfort administratif BTP"],
  },
  "/assistants-administratifs-taches": {
    title: "Missions BeWork : renfort AO, DCE et suivi admin des marchés | BeWork",
    description: metaDescriptionFrancophonie(
      "Catalogue missions BeWork : préparation candidatures, analyse DCE, organisation de réponse et suivi admin post-attribution (Chorus Pro, réserves, DOE)",
    ),
    keywords: [
      "missions assistant travaux BTP",
      "renfort administratif BTP",
      "analyse DCE BTP",
      "préparation candidature marché public",
      "gestion marché public BTP",
      "suivi documents exécution marché public",
      "facturation Chorus Pro travaux",
      "DOE marché public BTP",
      ...SEO_KEYWORDS_APPELS_OFFRES.slice(0, 4),
    ],
  },
  "/reponse-appel-offres-btp": {
    title: "Réponse aux appels d'offres BTP : analyse DCE et candidature | BeWork",
    description: metaDescriptionFrancophonie(
      "Renfort AO BTP : analyse DCE, pièces, structure mémoire technique et préparation au dépôt — prix, choix techniques et dépôt restent chez vous",
    ),
    keywords: [
      "assistance appel d'offres BTP",
      "analyse DCE marché public",
      "préparation candidature BTP",
      ...SEO_KEYWORDS_APPELS_OFFRES.slice(0, 10),
    ],
  },
  "/facturation-chorus-pro-btp": {
    title: "Facturation Chorus Pro BTP : situations, dépôt et suivi | BeWork",
    description: metaDescriptionFrancophonie(
      "Renfort Chorus Pro BTP : préparation situations, justificatifs, dépôt encadré et suivi paiement — validation client avant envoi",
    ),
    keywords: [
      "facturation Chorus Pro BTP",
      "facture marché public Chorus Pro",
      "situation travaux BTP",
      "situations mensuelles marché public",
      "assistant travaux marché public",
    ],
  },
  "/gestion-marche-public-btp": {
    title: "Suivi administratif marché public BTP : Chorus Pro, réserves, DOE | BeWork",
    description: metaDescriptionFrancophonie(
      "Après attribution : renfort documents d'exécution, situations, Chorus Pro, échéances, réserves et DOE — vous gardez engagements et validations",
    ),
    keywords: [
      "suivi administratif marché public BTP",
      "exécution marché public BTP",
      "gestion marché public BTP",
      "facturation Chorus Pro travaux",
      "DOE marché public BTP",
      "suivi réserves chantier",
      "assistant travaux marché public",
    ],
  },
  "/promoteurs-immobiliers": {
    title: "Assistant travaux pour promoteurs immobiliers | BeWork",
    description: metaDescriptionFrancophonie(
      "BeWork accompagne les promoteurs immobiliers dans le suivi administratif, documentaire et opérationnel de leurs chantiers : relances entreprises, comptes rendus, DOE, réserves, reporting et assistant travaux sur site",
    ),
    keywords: [
      "promoteur immobilier",
      "suivi chantier promoteur",
      "assistant travaux",
      "assistant travaux sur site",
      "relais chantier",
      "suivi documentaire chantier",
      "relance entreprises chantier",
      "suivi DOE",
      "suivi réserves",
      "reporting chantier",
      "opération immobilière",
      "livraison logements",
      "suivi OPR",
      "présence chantier",
      "coordination documentaire chantier",
    ],
  },
  "/assistant-travaux-france": {
    title: "Assistant travaux France : assistance technique BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Assistant travaux en France : analyse DCE, appels d'offres, situations, DOE et relances pour artisans et PME du bâtiment. Forfaits HT, validation chez vous",
      { withGeoTag: false },
    ),
    keywords: ["assistant travaux France", "assistance technique BTP France", "assistant travaux BTP France"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-belgique": {
    title: "Assistant travaux Belgique : assistance technique BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Belgique : assistant travaux francophone — analyse DCE, dossiers chantier et marchés publics. Assistance à distance, forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["assistant travaux Belgique", "assistance travaux BTP Belgique", "BTP Wallonie"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-suisse": {
    title: "Assistant travaux Suisse : assistance technique BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Suisse romande : assistant travaux pour dossiers chantier, pièces marché et relances. Process cadré, validation chez vous",
      { withGeoTag: false },
    ),
    keywords: ["assistant travaux Suisse", "assistance travaux BTP Suisse romande"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-luxembourg": {
    title: "Assistant travaux Luxembourg : assistance technique BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Luxembourg : assistant travaux pour analyse DCE, marchés publics et dossiers chantier. Assistance BTP francophone, forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["assistant travaux Luxembourg", "assistance travaux BTP Luxembourg"],
    hreflangLanguages: assistantTravauxGeoCluster,
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
