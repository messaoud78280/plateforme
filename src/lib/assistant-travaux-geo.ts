import { absoluteUrl } from "@/lib/site";

/** Cluster SEO : assistant travaux par pays francophone (contenus distincts). */
export const ASSISTANT_TRAVAUX_GEO_PATHS = {
  france: "/assistant-travaux-france",
  belgique: "/assistant-travaux-belgique",
  suisse: "/assistant-travaux-suisse",
  luxembourg: "/assistant-travaux-luxembourg",
} as const;

export type AssistantTravauxGeoKey = keyof typeof ASSISTANT_TRAVAUX_GEO_PATHS;

export function hreflangAssistantTravauxCluster(): Record<string, string> {
  const p = ASSISTANT_TRAVAUX_GEO_PATHS;
  const fr = absoluteUrl(p.france);
  return {
    "fr-FR": fr,
    "fr-BE": absoluteUrl(p.belgique),
    "fr-CH": absoluteUrl(p.suisse),
    "fr-LU": absoluteUrl(p.luxembourg),
    fr,
    "x-default": fr,
  };
}

export const ASSISTANT_TRAVAUX_GEO_NAV = [
  { key: "france", href: ASSISTANT_TRAVAUX_GEO_PATHS.france, title: "France", line: "Artisans, CT, PME bâtiment" },
  { key: "belgique", href: ASSISTANT_TRAVAUX_GEO_PATHS.belgique, title: "Belgique", line: "PME construction francophone" },
  { key: "suisse", href: ASSISTANT_TRAVAUX_GEO_PATHS.suisse, title: "Suisse", line: "Romandie & entreprises BTP" },
  { key: "luxembourg", href: ASSISTANT_TRAVAUX_GEO_PATHS.luxembourg, title: "Luxembourg", line: "Titulaires & sous-traitants" },
] as const;

export type AssistantTravauxGeoContent = {
  h1: string;
  introLead: string;
  localContext: string;
  faq: readonly { q: string; a: string }[];
};

export const ASSISTANT_TRAVAUX_GEO_CONTENT: Record<AssistantTravauxGeoKey, AssistantTravauxGeoContent> = {
  france: {
    h1: "Plateforme travaux en France : outils BTP pour vos équipes",
    introLead:
      "En France, les artisans, PME et conducteurs de travaux tiennent le terrain — mais DCE, appels d’offres, situations Chorus Pro, DOE et relances restent souvent dispersés hors d’un outil métier partagé.",
    localContext:
      "Marchés publics (plateformes régionales, Chorus Pro), accords-cadres, marchés privés et lots multi-corps d’état : BeWork déploie une plateforme interne adaptée à votre organisation. Vos équipes l’utilisent au quotidien ; BeWork configure, héberge et fait évoluer.",
    faq: [
      {
        q: "BeWork équipe-t-il les entreprises BTP en métropole et en régions ?",
        a: "Oui. BeWork est l’éditeur de la plateforme : déploiement, configuration et évolution. Vos collaborateurs utilisent les modules (DCE, dossiers chantier, marchés) — les validations engageantes restent chez vous.",
      },
      {
        q: "La plateforme couvre-t-elle Chorus Pro et les marchés publics ?",
        a: "Oui sur le suivi documentaire et la préparation des pièces (situations, classement, relances). La signature et l’engagement contractuel restent chez l’entreprise.",
      },
      {
        q: "Quelle différence avec un logiciel administratif généraliste ?",
        a: "BeWork est une plateforme métier BTP : lots, délais chantier, DCE, DOE, réserves, fournisseurs — pas un outil de secrétariat hors bâtiment.",
      },
    ],
  },
  belgique: {
    h1: "Plateforme travaux en Belgique : outils BTP pour vos équipes",
    introLead:
      "En Belgique, les entreprises de construction gèrent souvent plusieurs chantiers avec peu de capacité bureau : pièces marché, relances et dossiers techniques passent après l’urgence terrain.",
    localContext:
      "Wallonie, Bruxelles ou Flandre francophone : BeWork propose une plateforme métier BTP en français — analyse DCE, comptes rendus, situations et suivi fournisseurs — configurée pour votre organisation, utilisée par vos équipes.",
    faq: [
      {
        q: "BeWork travaille-t-il avec des entreprises belges ?",
        a: "Oui. Déploiement à distance, en français, avec un cadrage clair. Vos équipes pilotent dans la plateforme ; les validations techniques, prix et signatures restent chez vous.",
      },
      {
        q: "Quels modules peut-on activer depuis la Belgique ?",
        a: "Analyse DCE, devis et relances, comptes rendus, PPSPS/DOE (organisation), suivi fournisseurs et classement documentaire chantier, selon le périmètre défini à l’étude.",
      },
      {
        q: "Faut-il une présence locale BeWork en Belgique ?",
        a: "Non. La plateforme est opérée et supervisée à distance. L’essentiel est un cadrage clair, des rôles d’accès et une validation avant diffusion engageante.",
      },
    ],
  },
  suisse: {
    h1: "Plateforme travaux en Suisse : outils BTP pour vos équipes",
    introLead:
      "En Suisse romande, les PME du bâtiment font face à des exigences documentaires élevées et à des délais serrés — souvent sans environnement numérique métier pour structurer les dossiers chantier.",
    localContext:
      "BeWork déploie une plateforme pour dossiers chantier, pièces marché, relances et livrables documentaires en français. Vos équipes l’utilisent ; BeWork assure configuration, hébergement et évolution.",
    faq: [
      {
        q: "BeWork convient-il aux entreprises BTP en Suisse romande ?",
        a: "Oui pour une plateforme documentaire et technique chantier en français. Nous ne remplaçons pas vos responsables techniques ni vos engagements contractuels locaux.",
      },
      {
        q: "Peut-on structurer le suivi de devis, AO et relances dans la plateforme ?",
        a: "Oui. Tableaux de suivi, préparations, relances planifiées et alertes sur les dossiers en attente — vous gardez la décision commerciale.",
      },
      {
        q: "Comment démarrer depuis la Suisse ?",
        a: "Par une étude de cadrage : volume de dossiers, modules utiles, rôles et fréquence de suivi. Démonstration et devis de déploiement selon votre organisation.",
      },
    ],
  },
  luxembourg: {
    h1: "Plateforme travaux au Luxembourg : outils BTP pour vos équipes",
    introLead:
      "Au Luxembourg, les entreprises BTP et titulaires de marchés jonglent entre chantiers, sous-traitants et dossiers techniques souvent traités hors d’un outil partagé.",
    localContext:
      "BeWork équipe une plateforme interne francophone : analyse DCE, devis, situations, DOE, relances et coordination documentaire — adaptée aux PME et structures multi-chantiers, utilisée par vos collaborateurs.",
    faq: [
      {
        q: "BeWork accompagne-t-il les entreprises luxembourgeoises du BTP ?",
        a: "Oui, en français. Le périmètre est cadré à l’étude : modules DCE, suivi chantier, DOE, relances, etc. Vos équipes utilisent ; BeWork déploie et fait évoluer.",
      },
      {
        q: "Peut-on traiter un appel d’offres ou un DCE dans la plateforme ?",
        a: "Oui pour l’analyse, la structuration des pièces, la préparation du mémoire technique et le suivi documentaire — la décision Go/No-go et le dépôt final restent chez vous.",
      },
      {
        q: "Comment démarrer au Luxembourg ?",
        a: "Une démonstration et une étude de déploiement selon votre volume et vos modules. Les modalités sont précisées sur bework.fr/tarifs et au devis.",
      },
    ],
  },
};
