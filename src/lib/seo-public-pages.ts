/**
 * Métadonnées SEO/GEO centralisées — repositionnement plateforme interne BTP.
 * Titles ~45–60 car. · descriptions ~140–160 car. · hreflang francophonie.
 * URLs historiques conservées ; copy recentrée éditeur / intégrateur / outils IA pour vos équipes.
 */

import { hreflangAssistantTravauxCluster } from "@/lib/assistant-travaux-geo";
import { ASSISTANT_TRAVAUX_VILLE_PATHS, ASSISTANT_TRAVAUX_VILLES } from "@/lib/assistant-travaux-villes";
import { hreflangExternalisationAdministrativeBtpCluster, metaDescriptionFrancophonie } from "@/lib/seo-francophonie";
import {
  SEO_KEYWORDS_APPELS_OFFRES,
  SEO_KEYWORDS_ASSISTANT_TRAVAUX,
  SEO_KEYWORDS_GEO_SCOPE,
  SEO_KEYWORDS_PLATEFORME,
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
      const city = v.label.split(" &")[0];
      return [
        path,
        {
          title: `Plateforme BTP ${city} | BeWork`,
          description: metaDescriptionFrancophonie(
            `Plateforme interne BTP à ${city} : outils IA, marchés, documents et suivi chantier pour vos équipes. Éditeur BeWork — démo sur étude`,
            { withGeoTag: false },
          ),
          keywords: [
            `plateforme BTP ${city}`,
            `outils IA BTP ${city}`,
            "plateforme interne BTP",
            "assistant travaux BTP",
          ],
        },
      ];
    },
  ),
);

export const PUBLIC_PAGE_SEO: Record<string, PublicPageSeo> = {
  ...villePagesSeo,
  "/relance-devis-btp": {
    title: "Relance devis BTP : suivre et convertir vos offres",
    description: metaDescriptionFrancophonie(
      "Relancez vos devis BTP à temps depuis votre plateforme : suivi des réponses, alertes et historique. Vos équipes pilotent ; BeWork équipe l’outil",
    ),
    keywords: ["relance devis BTP", "suivi devis travaux", "devis travaux", "plateforme BTP"],
  },
  "/devis-retard-btp": {
    title: "Devis BTP en retard : accélérer sans perdre le contrôle",
    description: metaDescriptionFrancophonie(
      "Devis en retard ? Structurez préparation, chiffrage et envois dans une plateforme métier. Outils IA BTP — vos prix restent chez vous",
    ),
    keywords: ["devis BTP en retard", "préparation devis BTP", "chiffrage devis BTP", "outils IA BTP"],
  },
  "/chantier-mal-suivi": {
    title: "Chantier mal suivi : centraliser le fil documentaire",
    description: metaDescriptionFrancophonie(
      "Chantier mal suivi côté bureau ? CR, réserves, fournisseurs et DOE dans une plateforme interne. Vos équipes valident ; BeWork équipe",
    ),
    keywords: ["chantier mal suivi", "suivi administratif chantier", "dossiers chantier BTP", "plateforme chantier"],
  },
  "/facture-impayee-btp": {
    title: "Facture impayée BTP : relances et trésorerie chantier",
    description: metaDescriptionFrancophonie(
      "Factures impayées : suivez relances, pièces et encaissements dans votre environnement BeWork. Sécurisez la trésorerie sans perdre le fil",
    ),
    keywords: ["facture impayée BTP", "relance facture BTP", "impayés chantier", "trésorerie BTP"],
  },
  "/artisan-deborde-administratif": {
    title: "Artisan débordé : organiser l’admin sans tout perdre",
    description: metaDescriptionFrancophonie(
      "Artisan débordé par l’administratif ? Une plateforme interne BTP pour devis, relances et dossiers — utilisée par vous, configurée par BeWork",
    ),
    keywords: ["artisan débordé administratif", "artisan BTP administratif", "plateforme BTP artisan"],
  },
  "/impayes-btp-relances": {
    title: "Impayés BTP : relances factures et situations",
    description: metaDescriptionFrancophonie(
      "Impayés BTP : suivez factures et situations, relancez à temps. Capacités de plateforme BeWork — décisions et validations restent chez vous",
    ),
    keywords: ["impayés BTP", "relance facture BTP", "situation travaux impayée"],
  },
  "/situation-travaux-btp": {
    title: "Situation de travaux BTP : structurer et facturer",
    description: metaDescriptionFrancophonie(
      "Situations de travaux BTP : modèles, pièces et suivi d’envoi dans votre plateforme. Facturer sans oubli — contrôle des montants chez vous",
    ),
    keywords: ["situation travaux BTP", "facturation chantier", "situation de travaux"],
  },
  "/dict-dt-travaux": {
    title: "DICT et DT travaux : suivi dossiers chantier BTP",
    description: metaDescriptionFrancophonie(
      "DICT et déclarations de travaux : pièces, relances et classement dans une plateforme métier. Vos équipes suivent ; BeWork équipe l’outil",
    ),
    keywords: ["DICT travaux", "DT travaux BTP", "déclaration travaux", "dossier chantier"],
  },
  "/avenant-chantier": {
    title: "Avenant chantier BTP : cadrer et sécuriser le CA",
    description: metaDescriptionFrancophonie(
      "Avenants travaux : formalisez demandes, chiffrage et preuves dans votre plateforme. Protégez vos marges — validations contractuelles chez vous",
    ),
    keywords: ["avenant chantier", "avenant travaux BTP", "modification marché travaux"],
  },
  "/suivi-fournisseurs-chantier": {
    title: "Suivi fournisseurs chantier : commandes et livraisons",
    description: metaDescriptionFrancophonie(
      "Suivi fournisseurs et achats chantier : commandes, livraisons et relances centralisés pour éviter les blocages terrain",
    ),
    keywords: ["suivi fournisseurs chantier", "commandes chantier BTP", "logistique chantier"],
  },
  "/admin-btp-sans-recruter": {
    title: "Admin BTP sans recruter : plateforme + outils IA",
    description: metaDescriptionFrancophonie(
      "Gagnez en capacité admin sans embauche : plateforme interne BTP, modules adaptés et IA métier. Mise en place + abonnement — étude BeWork",
    ),
    keywords: ["admin BTP sans recruter", "plateforme BTP", "outils IA chantier", "digitalisation BTP"],
  },
  "/comparatif-assistance-travaux-btp": {
    title: "Comparatif : recruter, externaliser ou plateforme BeWork",
    description: metaDescriptionFrancophonie(
      "Recrutement, prestataire externalisé ou plateforme interne BeWork ? Comparatif périmètre BTP, DCE, marchés, coût et contrôle des données",
    ),
    keywords: [
      "comparatif plateforme BTP",
      "recruter ou digitaliser BTP",
      "plateforme interne BTP",
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
    title: "Outils admin BTP : rôle, limites et plateforme | BeWork",
    description: metaDescriptionFrancophonie(
      "Admin BTP clarifié : analyse DCE, dossiers chantier et marchés dans une plateforme interne. Outils IA pour vos équipes — pas un secrétariat générique",
    ),
    keywords: [...SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 6), ...SEO_KEYWORDS_PLATEFORME.slice(0, 4)],
  },
  "/assistant-administratif-externalise": {
    title: "Plateforme BTP plutôt qu’externaliser l’exécution | BeWork",
    description: metaDescriptionFrancophonie(
      "Au lieu d’externaliser l’exécution : équipez vos collaborateurs d’une plateforme interne BTP (DCE, dossiers, marchés). Éditeur BeWork — démo",
    ),
    keywords: [...SEO_KEYWORDS_PLATEFORME.slice(0, 6), ...SEO_KEYWORDS_ASSISTANT_TRAVAUX.slice(0, 4)],
  },
  "/assistant-administratif-pme": {
    title: "Plateforme BTP pour PME : chantiers et marchés publics",
    description: metaDescriptionFrancophonie(
      "PME du bâtiment : centralisez DCE, relances, dossiers chantier et suivi de marché. Plateforme adaptée à votre organisation — vos équipes aux commandes",
    ),
    keywords: ["plateforme BTP PME", "outils IA BTP PME", "gestion chantier PME"],
  },
  "/assistant-administratif-distance": {
    title: "Plateforme BTP à distance | PME francophones",
    description: metaDescriptionFrancophonie(
      "Plateforme métier BTP accessible à distance : DCE, dossiers, CR et suivis. Hébergement et évolution BeWork — usage quotidien par vos équipes",
    ),
    keywords: ["plateforme BTP distance", "outils chantier à distance", "digitalisation BTP"],
  },
  "/externaliser-administratif": {
    title: "Équiper l’admin BTP sans tout externaliser | BeWork",
    description: metaDescriptionFrancophonie(
      "Besoin de capacité admin sans tout déléguer ? Plateforme interne + IA métier pour vos équipes. BeWork déploie et fait évoluer l’environnement",
    ),
    keywords: ["plateforme administrative BTP", "digitalisation administratif BTP", "outils IA chantier"],
  },
  "/externalisation-administrative-btp-france": {
    title: "Plateforme interne BTP France | Éditeur BeWork",
    description: metaDescriptionFrancophonie(
      "France : déployez une plateforme interne BTP (DCE, AO, situations, DOE). Vos équipes l’utilisent — BeWork configure, héberge et fait évoluer",
      { withGeoTag: false },
    ),
    keywords: ["plateforme BTP France", "éditeur BTP France", ...SEO_KEYWORDS_GEO_SCOPE.slice(0, 4)],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-belgique": {
    title: "Plateforme BTP Belgique | BeWork",
    description: metaDescriptionFrancophonie(
      "Belgique : plateforme métier BTP francophone — marchés, dossiers chantier, outils IA. Wallonie, Bruxelles — mise en place sur étude",
      { withGeoTag: false },
    ),
    keywords: ["plateforme BTP Belgique", "outils IA BTP Belgique", "BTP Wallonie"],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-suisse": {
    title: "Plateforme BTP Suisse romande | BeWork",
    description: metaDescriptionFrancophonie(
      "Suisse romande : plateforme interne pour dossiers chantier, pièces marché et suivis. Configurée pour votre organisation — usage par vos équipes",
      { withGeoTag: false },
    ),
    keywords: ["plateforme BTP Suisse", "outils chantier Suisse romande"],
    hreflangLanguages: geoCluster,
  },
  "/externalisation-administrative-btp-luxembourg": {
    title: "Plateforme BTP Luxembourg | BeWork",
    description: metaDescriptionFrancophonie(
      "Luxembourg : plateforme interne BTP pour DCE, marchés et dossiers chantier. Éditeur francophone — déploiement et évolution sur étude",
      { withGeoTag: false },
    ),
    keywords: ["plateforme BTP Luxembourg", "outils IA BTP Luxembourg"],
    hreflangLanguages: geoCluster,
  },
  "/cas-clients": {
    title: "Cas clients BTP : plateforme et organisation chantier",
    description: metaDescriptionFrancophonie(
      "Cas clients BTP : dossiers structurés, suivis clarifiés, organisation bureau-chantier. Retours d’expérience autour de la plateforme BeWork",
    ),
    keywords: ["cas clients BTP", "retour expérience BTP", "plateforme chantier"],
  },
  "/faq": {
    title: "FAQ BeWork : plateforme, IA, Chorus Pro, DOE",
    description: metaDescriptionFrancophonie(
      "FAQ BeWork : plateforme interne BTP, outils IA, marché public, Chorus Pro, DOE, abonnement, rôles et validations humaines",
    ),
    keywords: [
      "FAQ BeWork",
      "plateforme interne BTP",
      "gestion marché public BTP",
      "facturation Chorus Pro BTP",
      "DOE marché public BTP",
      "abonnement plateforme BTP",
    ],
  },
  "/contact": {
    title: "Contact BeWork — démonstration plateforme BTP",
    description: metaDescriptionFrancophonie(
      "Contactez BeWork : présentez votre organisation pour une démonstration ou une étude de plateforme interne BTP — modules, IA et accompagnement",
    ),
    keywords: ["contact BeWork", "démonstration plateforme BTP", "étude déploiement BTP"],
  },
  "/notre-facon-de-travailler": {
    title: "Notre façon de travailler — méthode de déploiement BeWork",
    description: metaDescriptionFrancophonie(
      "Méthode BeWork : diagnostic, composition, configuration, formation, déploiement et évolution — plateforme pour vos équipes",
    ),
    keywords: ["méthode BeWork", "déploiement plateforme BTP", "partenaire évolution BTP"],
  },
  "/assistants-administratifs-taches": {
    title: "Capacités plateforme BeWork : AO, DCE et marchés",
    description: metaDescriptionFrancophonie(
      "Modules et workflows BeWork : candidatures, analyse DCE, organisation de réponse et suivi post-attribution (Chorus Pro, réserves, DOE) — utilisés par vos équipes",
    ),
    keywords: [
      "plateforme marchés publics BTP",
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
    title: "Réponse AO BTP : analyse DCE et candidature | BeWork",
    description: metaDescriptionFrancophonie(
      "Préparez vos AO BTP dans une plateforme : analyse DCE, pièces, structure mémoire technique — prix, choix techniques et dépôt restent chez vous",
    ),
    keywords: [
      "réponse appel d'offres BTP",
      "analyse DCE marché public",
      "préparation candidature BTP",
      "plateforme AO BTP",
      ...SEO_KEYWORDS_APPELS_OFFRES.slice(0, 8),
    ],
  },
  "/facturation-chorus-pro-btp": {
    title: "Facturation Chorus Pro BTP : situations et suivi | BeWork",
    description: metaDescriptionFrancophonie(
      "Chorus Pro BTP : préparez situations et justificatifs dans votre plateforme, suivez dépôts et paiements — validation client avant envoi",
    ),
    keywords: [
      "facturation Chorus Pro BTP",
      "facture marché public Chorus Pro",
      "situation travaux BTP",
      "situations mensuelles marché public",
      "plateforme Chorus Pro BTP",
    ],
  },
  "/gestion-marche-public-btp": {
    title: "Suivi marché public BTP : Chorus Pro, DOE | BeWork",
    description: metaDescriptionFrancophonie(
      "Après attribution : documents d’exécution, situations, Chorus Pro, échéances, réserves et DOE dans votre plateforme — engagements chez vous",
    ),
    keywords: [
      "suivi administratif marché public BTP",
      "exécution marché public BTP",
      "gestion marché public BTP",
      "facturation Chorus Pro travaux",
      "DOE marché public BTP",
      "suivi réserves chantier",
      "plateforme marché public BTP",
    ],
  },
  "/promoteurs-immobiliers": {
    title: "Plateforme chantier pour promoteurs immobiliers | BeWork",
    description: metaDescriptionFrancophonie(
      "Promoteurs : relances entreprises, CR, DOE, réserves et reporting dans une plateforme interne adaptée à vos opérations immobilières",
    ),
    keywords: [
      "promoteur immobilier",
      "suivi chantier promoteur",
      "plateforme promoteur BTP",
      "suivi documentaire chantier",
      "relance entreprises chantier",
      "suivi DOE",
      "suivi réserves",
      "reporting chantier",
      "opération immobilière",
      "livraison logements",
      "suivi OPR",
      "coordination documentaire chantier",
    ],
  },
  "/assistant-travaux-france": {
    title: "Plateforme travaux France | Éditeur BTP BeWork",
    description: metaDescriptionFrancophonie(
      "France : plateforme interne pour analyse DCE, AO, situations, DOE et relances. Vos équipes l’utilisent — BeWork déploie et fait évoluer",
      { withGeoTag: false },
    ),
    keywords: ["plateforme BTP France", "outils IA travaux France", "assistant travaux France"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-belgique": {
    title: "Plateforme travaux Belgique | BeWork",
    description: metaDescriptionFrancophonie(
      "Belgique : plateforme métier BTP francophone — DCE, dossiers chantier et marchés publics. Déploiement sur étude, usage par vos équipes",
      { withGeoTag: false },
    ),
    keywords: ["plateforme BTP Belgique", "outils travaux BTP Belgique", "BTP Wallonie"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-suisse": {
    title: "Plateforme travaux Suisse | BeWork",
    description: metaDescriptionFrancophonie(
      "Suisse romande : plateforme pour dossiers chantier, pièces marché et relances. Configurée pour votre organisation — validations chez vous",
      { withGeoTag: false },
    ),
    keywords: ["plateforme BTP Suisse", "outils travaux Suisse romande"],
    hreflangLanguages: assistantTravauxGeoCluster,
  },
  "/assistant-travaux-luxembourg": {
    title: "Plateforme travaux Luxembourg | BeWork",
    description: metaDescriptionFrancophonie(
      "Luxembourg : plateforme interne BTP pour DCE, dossiers et relances. Éditeur francophone — mise en place et évolution sur étude",
      { withGeoTag: false },
    ),
    keywords: ["plateforme BTP Luxembourg", "outils travaux BTP Luxembourg"],
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
