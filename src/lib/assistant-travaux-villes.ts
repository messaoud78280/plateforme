/** Cluster SEO villes francophones — contenus distincts (pas de copier-coller). */
export const ASSISTANT_TRAVAUX_VILLE_PATHS = {
  paris: "/assistant-travaux-paris",
  lyon: "/assistant-travaux-lyon",
  marseille: "/assistant-travaux-marseille",
  lille: "/assistant-travaux-lille",
  bordeaux: "/assistant-travaux-bordeaux",
  toulouse: "/assistant-travaux-toulouse",
  bruxelles: "/assistant-travaux-bruxelles",
  geneve: "/assistant-travaux-geneve",
} as const;

export type AssistantTravauxVilleKey = keyof typeof ASSISTANT_TRAVAUX_VILLE_PATHS;

export type AssistantTravauxVilleContent = {
  label: string;
  pays: "France" | "Belgique" | "Suisse";
  h1: string;
  introLead: string;
  localContext: string;
  casUsage: string;
  faq: readonly { q: string; a: string }[];
};

export const ASSISTANT_TRAVAUX_VILLES: Record<AssistantTravauxVilleKey, AssistantTravauxVilleContent> = {
  paris: {
    label: "Paris & Île-de-France",
    pays: "France",
    h1: "Assistant travaux Paris : relais bureau-chantier pour entreprises BTP en Île-de-France",
    introLead:
      "En Île-de-France, les entreprises du bâtiment enchaînent chantiers urbains, marchés publics et délais serrés — souvent avec peu de renfort administratif.",
    localContext:
      "Rénovation tertiaire, logement collectif, VRD en zone dense : les dossiers (AO, situations, DOE, DICT) s’accumulent vite. BeWork opère à distance avec supervision depuis la France — pas de présence physique sur site, mais un process cadré pour artisans, PME et conducteurs de travaux franciliens.",
    casUsage:
      "Lot second œuvre sur marché public en petite couronne : BeWork suit le DCE, prépare les situations Chorus Pro et compile le DOE pendant que le CT est sur trois réceptions la même semaine.",
    faq: [
      {
        q: "BeWork accompagne-t-il les entreprises BTP en Île-de-France ?",
        a: "Oui, à distance partout en IDF. Missions : devis, relances, appels d’offres, Chorus Pro, DOE, CR — validation finale chez vous.",
      },
      {
        q: "Faut-il un assistant sur place à Paris ?",
        a: "Non. Le relais est documentaire et administratif à distance. L’essentiel est un canal clair et des priorités partagées.",
      },
    ],
  },
  lyon: {
    label: "Lyon & Auvergne-Rhône-Alpes",
    pays: "France",
    h1: "Assistant travaux Lyon : support administratif BTP en Auvergne-Rhône-Alpes",
    introLead:
      "À Lyon et en région, les PME du bâtiment cumulent logements, équipements publics et chantiers en co-activité — l’administratif suit mal le rythme terrain.",
    localContext:
      "Marchés métropole, lots techniques et sous-traitance multi-corps d’état : BeWork structure devis, mémoires techniques et suivi marché public à distance, en français.",
    casUsage:
      "Entreprise de gros œuvre avec deux AO en parallèle : synthèse DCE et checklist dépôt préparées par BeWork — le dirigeant valide le Go/No Go et le prix.",
    faq: [
      {
        q: "BeWork intervient-il pour des entreprises lyonnaises ?",
        a: "Oui, à distance. Voir aussi /assistant-travaux-france pour le périmètre national.",
      },
    ],
  },
  marseille: {
    label: "Marseille & Sud",
    pays: "France",
    h1: "Assistant travaux Marseille : relais administratif chantier BTP",
    introLead:
      "À Marseille et sur le littoral sud, les entreprises gèrent souvent plusieurs chantiers avec des équipes réduites au bureau.",
    localContext:
      "Réhabilitation, VRD, marchés à tranches : relances fournisseurs, situations et DOE peuvent être délégués à un assistant travaux BeWork — vous gardez le pilotage chantier.",
    casUsage:
      "Artisan électricité débordé : relances devis et classement dossiers chantier confiés à BeWork, avec tableau de suivi hebdomadaire.",
    faq: [
      {
        q: "Peut-on démarrer par une mission ponctuelle depuis Marseille ?",
        a: "Oui — analyse DCE, DOE ou relances, à partir de 250 € HT. Détail sur /tarifs.",
      },
    ],
  },
  lille: {
    label: "Lille & Hauts-de-France",
    pays: "France",
    h1: "Assistant travaux Lille : externalisation légère pour le BTP nord",
    introLead:
      "Dans les Hauts-de-France, les entreprises BTP cherchent souvent à tenir le bureau sans recruter — surtout sur les pics d’appels d’offres.",
    localContext:
      "BeWork propose un relais francophone : réponse AO, situations, impayés et CR structurés. Accompagnement à distance, forfaits HT publics.",
    casUsage:
      "PME menuiserie : préparation mémoire technique et relecture DPGF avant dépôt plateforme — validation interne en une demi-journée au lieu de trois.",
    faq: [
      {
        q: "BeWork couvre-t-il le Nord et la Belgique voisine ?",
        a: "Oui en France à distance ; pour la Belgique voir /assistant-travaux-belgique et /assistant-travaux-bruxelles.",
      },
    ],
  },
  bordeaux: {
    label: "Bordeaux & Nouvelle-Aquitaine",
    pays: "France",
    h1: "Assistant travaux Bordeaux : accompagnement administratif BTP",
    introLead:
      "En Nouvelle-Aquitaine, la croissance du parc de chantiers s’accompagne souvent d’un retard sur les dossiers administratifs.",
    localContext:
      "Construction neuve, rénovation énergétique, marchés publics locaux : BeWork aide à structurer AO, devis et fin de chantier (DOE, réserves).",
    casUsage:
      "Conducteur sur lot CVC : comptes rendus et relances MOE préparés depuis les notes vocales du CT — diffusion après validation.",
    faq: [
      {
        q: "Quels documents peut-on transmettre depuis Bordeaux ?",
        a: "DCE, situations, listes de relances, notes de réunion, pièces DOE — via contact ou espace client.",
      },
    ],
  },
  toulouse: {
    label: "Toulouse & Occitanie",
    pays: "France",
    h1: "Assistant travaux Toulouse : relais bureau-chantier BTP",
    introLead:
      "À Toulouse et en Occitanie, les entreprises aéronautiques adjacency et le BTP traditionnel partagent le même problème : trop d’administratif, pas assez de temps.",
    localContext:
      "BeWork prend en charge le flux documentaire (devis, AO, Chorus Pro, DICT) pendant que vos équipes sont sur site — process et traçabilité inclus.",
    casUsage:
      "Lot VRD / terrassement : suivi DICT et classement pièces voirie avant démarrage — alertes sur échéances et manquants.",
    faq: [
      {
        q: "BeWork gère-t-il les DICT pour des chantiers à Toulouse ?",
        a: "Oui sur le suivi dossier et administratif — voir /dict-dt-travaux. Les responsabilités réseaux restent chez l’entreprise.",
      },
    ],
  },
  bruxelles: {
    label: "Bruxelles",
    pays: "Belgique",
    h1: "Assistant travaux Bruxelles : support administratif BTP francophone",
    introLead:
      "À Bruxelles, les entreprises de construction francophones jonglent entre chantiers urbains et dossiers administratifs souvent traités en fin de journée.",
    localContext:
      "BeWork assure un relais à distance en français : devis, relances, dossiers techniques et coordination documentaire — sans présence locale, avec validation chez vous.",
    casUsage:
      "PME rénovation : externalisation des relances clients et suivi devis pendant une période de surcharge chantier.",
    faq: [
      {
        q: "BeWork est-il adapté aux entreprises bruxelloises ?",
        a: "Oui pour le relais administratif francophone. Voir /assistant-travaux-belgique pour le périmètre pays.",
      },
    ],
  },
  geneve: {
    label: "Genève",
    pays: "Suisse",
    h1: "Assistant travaux Genève : relais administratif BTP en Suisse romande",
    introLead:
      "À Genève, les exigences documentaires et les délais serrés pèsent sur les PME du bâtiment qui n’ont pas de service administratif dédié.",
    localContext:
      "BeWork structure dossiers chantier, relances et livrables en français. Nous ne remplaçons pas vos responsables techniques ni vos obligations contractuelles locales.",
    casUsage:
      "Entreprise second œuvre : préparation devis structurés et relances fournisseurs avec suivi des statuts — le dirigeant valide les prix.",
    faq: [
      {
        q: "BeWork travaille-t-il avec des entreprises genevoises ?",
        a: "Oui, à distance et en français. Voir /assistant-travaux-suisse pour le périmètre romand.",
      },
    ],
  },
};

export const ASSISTANT_TRAVAUX_VILLE_NAV = (
  Object.entries(ASSISTANT_TRAVAUX_VILLE_PATHS) as [AssistantTravauxVilleKey, string][]
).map(([key, href]) => ({
  key,
  href,
  title: ASSISTANT_TRAVAUX_VILLES[key].label,
  pays: ASSISTANT_TRAVAUX_VILLES[key].pays,
}));
