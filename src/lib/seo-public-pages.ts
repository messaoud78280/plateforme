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
            `Assistant travaux ${v.label} : relais bureau-chantier BTP, devis, marchés publics et dossiers chantier à distance`,
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
      "Tenez devis, relances et dossiers chantier sans embauche. Assistants travaux IA, forfaits HT, supervision depuis la France",
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
      "Externalisez le bureau-chantier : devis, relances, dossiers et suivi administratif BTP. Forfaits HT clairs, validation avant engagement",
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
      "Assistant travaux à distance : devis, relances et suivi dossiers pour le bâtiment. Plateforme supervisée, forfaits HT publics",
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
      "Externalisation administrative BTP en France : devis, relances, situations, DOE. Assistants travaux IA, sans recruter — forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["externalisation administrative BTP France", "assistant travaux France", ...SEO_KEYWORDS_GEO_SCOPE.slice(0, 4)],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-belgique": {
    title: "Externalisation administrative BTP Belgique | BeWork",
    description: metaDescriptionFrancophonie(
      "Belgique : déléguez dossiers chantier, devis et relances à un assistant travaux francophone. Wallonie, Bruxelles — forfaits HT",
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
      "Luxembourg : assistant travaux pour devis, relances et dossiers chantier. Relais administratif BTP francophone, forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["externalisation administrative BTP Luxembourg", "assistant travaux Luxembourg"],
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
    title: "Contact BeWork — qualifier votre besoin administratif BTP",
    description: metaDescriptionFrancophonie(
      "Contactez BeWork : marchés publics, accords-cadres, chantier ou appels d'offres — qualification en quelques minutes, rappel cadré",
    ),
    keywords: ["contact BeWork", "assistant travaux BTP", "marché public BTP", "qualification besoin administratif"],
  },
  "/notre-facon-de-travailler": {
    title: "Notre façon de travailler — méthode BeWork BTP",
    description: metaDescriptionFrancophonie(
      "Méthode BeWork : cadrage, validation humaine, traçabilité bureau-chantier pour entreprises du BTP en France, Belgique, Suisse et Luxembourg",
    ),
    keywords: ["méthode BeWork", "validation humaine BTP", "process assistant travaux", "relais bureau-chantier"],
  },
  "/assistants-administratifs-taches": {
    title: "Missions assistant travaux BTP : AO, chantier & marchés publics | BeWork",
    description: metaDescriptionFrancophonie(
      "Catalogue missions BeWork : assistance technique et administrative — analyse DCE, suivi chantier, appels d'offres et exécution marché public (Chorus Pro, réserves, DOE)",
    ),
    keywords: [
      "missions assistant travaux BTP",
      "assistance technique BTP",
      "analyse DCE BTP",
      "aide au chiffrage BTP",
      "gestion marché public BTP",
      "suivi documents exécution marché public",
      "facturation Chorus Pro travaux",
      "DOE marché public BTP",
      ...SEO_KEYWORDS_APPELS_OFFRES.slice(0, 4),
    ],
  },
  "/reponse-appel-offres-btp": {
    title: "Réponse aux appels d'offres BTP : DCE, chiffrage, mémoire technique | BeWork",
    description: metaDescriptionFrancophonie(
      "Assistance technique aux appels d'offres BTP : analyse DCE, aide au chiffrage, mémoire technique, DPGF et dépôt plateforme — validation finale chez vous",
    ),
    keywords: [
      "assistance technique appel d'offres BTP",
      "aide au chiffrage marché public",
      ...SEO_KEYWORDS_APPELS_OFFRES.slice(0, 10),
    ],
  },
  "/facturation-chorus-pro-btp": {
    title: "Facturation Chorus Pro BTP : situations, dépôt et suivi | BeWork",
    description: metaDescriptionFrancophonie(
      "Facturation Chorus Pro BTP : situations mensuelles, justificatifs, dépôt encadré, suivi paiement et relances — bloc exécution marché public BeWork",
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
    title: "Exécution marché public BTP : Chorus Pro, réserves et DOE | BeWork",
    description: metaDescriptionFrancophonie(
      "Assistance technique et administrative après attribution : documents d'exécution, situations, Chorus Pro, anti-pénalités, réserves et DOE au fil de l'eau",
    ),
    keywords: [
      "exécution marché public BTP",
      "assistance technique marché public",
      "gestion marché public BTP",
      "suivi administratif marché public",
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
    title: "Assistant travaux France : relais bureau-chantier BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Assistant travaux en France : devis, appels d'offres, situations, DOE et relances pour artisans et PME du bâtiment. Forfaits HT, validation chez vous",
      { withGeoTag: false },
    ),
    keywords: ["assistant travaux France", "assistant travaux BTP France", "externalisation administrative BTP France"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-belgique": {
    title: "Assistant travaux Belgique : support administratif BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Belgique : assistant travaux francophone pour devis, dossiers chantier et marchés publics. Relais bureau-chantier à distance, forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["assistant travaux Belgique", "assistant BTP Belgique", "BTP Wallonie"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-suisse": {
    title: "Assistant travaux Suisse : relais administratif BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Suisse romande : assistant travaux pour dossiers chantier, relances et suivi administratif BTP. Process cadré, validation chez vous",
      { withGeoTag: false },
    ),
    keywords: ["assistant travaux Suisse", "assistant BTP Suisse romande"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-luxembourg": {
    title: "Assistant travaux Luxembourg : accompagnement BTP | BeWork",
    description: metaDescriptionFrancophonie(
      "Luxembourg : assistant travaux pour devis, marchés publics et dossiers chantier. Relais administratif BTP francophone, forfaits HT",
      { withGeoTag: false },
    ),
    keywords: ["assistant travaux Luxembourg", "assistant BTP Luxembourg"],
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
