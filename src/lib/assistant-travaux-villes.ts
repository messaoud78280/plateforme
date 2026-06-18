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
    h1: "Assistant travaux Paris : assistance technique et administrative BTP en Île-de-France",
    introLead:
      "En Île-de-France, les entreprises du bâtiment enchaînent chantiers urbains, appels d’offres et marchés publics — souvent avec peu de renfort bureau pour structurer les dossiers.",
    localContext:
      "Rénovation tertiaire, logement collectif, VRD en zone dense : analyse DCE, situations Chorus Pro, DOE et relances s’accumulent vite. BeWork opère à distance avec supervision depuis la France — assistance travaux spécialisée BTP, pas prestation administrative généraliste.",
    casUsage:
      "Lot second œuvre sur marché public en petite couronne : BeWork analyse le DCE, prépare les situations Chorus Pro et compile le DOE pendant que le CT est sur trois réceptions la même semaine.",
    faq: [
      {
        q: "BeWork accompagne-t-il les entreprises BTP en Île-de-France ?",
        a: "Oui, à distance partout en IDF. Missions : analyse DCE, appels d’offres, comptes rendus, Chorus Pro, DOE, relances — validation finale chez vous.",
      },
      {
        q: "Faut-il un assistant sur place à Paris ?",
        a: "Non. L’assistance est documentaire et technique à distance (dossiers chantier, pièces marché, suivi). L’essentiel est un canal clair et des priorités partagées.",
      },
    ],
  },
  lyon: {
    label: "Lyon & Auvergne-Rhône-Alpes",
    pays: "France",
    h1: "Assistant travaux Lyon : assistance technique et administrative BTP en Auvergne-Rhône-Alpes",
    introLead:
      "À Lyon et en région, les PME du bâtiment cumulent logements, équipements publics et chantiers en co-activité — les dossiers techniques et documentaires suivent mal le rythme terrain.",
    localContext:
      "Marchés métropole, lots techniques et sous-traitance multi-corps d’état : BeWork structure analyse DCE, mémoires techniques et suivi marché public à distance, en français.",
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
    h1: "Assistant travaux Marseille : assistance technique et administrative BTP",
    introLead:
      "À Marseille et sur le littoral sud, les entreprises gèrent souvent plusieurs chantiers avec des équipes réduites au bureau pour tenir les dossiers.",
    localContext:
      "Réhabilitation, VRD, marchés à tranches : relances fournisseurs, situations, réserves et DOE peuvent être confiés à un assistant travaux BeWork — vous gardez le pilotage technique chantier.",
    casUsage:
      "Artisan électricité débordé : relances devis, classement dossiers chantier et suivi réserves confiés à BeWork, avec tableau de suivi hebdomadaire.",
    faq: [
      {
        q: "Peut-on démarrer par une mission ponctuelle depuis Marseille ?",
        a: "Oui — intervention ponctuelle dès 150 € HT ou mission structurée dès 250 € HT. Détail sur /tarifs.",
      },
    ],
  },
  lille: {
    label: "Lille & Hauts-de-France",
    pays: "France",
    h1: "Assistant travaux Lille : assistance technique et administrative BTP dans le Nord",
    introLead:
      "Dans les Hauts-de-France, les entreprises BTP cherchent souvent à sécuriser le bureau sans recruter — surtout sur les pics d’appels d’offres et d’exécution marché public.",
    localContext:
      "BeWork propose une assistance travaux francophone : analyse DCE, réponse AO, situations Chorus Pro, réserves et DOE. Accompagnement à distance, forfaits HT publics.",
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
    h1: "Assistant travaux Bordeaux : assistance technique et administrative BTP",
    introLead:
      "En Nouvelle-Aquitaine, la croissance du parc de chantiers s’accompagne souvent d’un retard sur les dossiers techniques et documentaires.",
    localContext:
      "Construction neuve, rénovation énergétique, marchés publics locaux : BeWork aide à structurer AO, analyse DCE, devis et clôture chantier (DOE, réserves).",
    casUsage:
      "Conducteur sur lot CVC : comptes rendus et relances MOE préparés depuis les notes du CT — diffusion après validation.",
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
    h1: "Assistant travaux Toulouse : assistance technique et administrative BTP",
    introLead:
      "À Toulouse et en Occitanie, les entreprises BTP partagent le même enjeu : trop de dossiers à structurer, pas assez de temps pour l’analyse et le suivi documentaire.",
    localContext:
      "BeWork prend en charge le flux technique et documentaire (analyse DCE, AO, Chorus Pro, DICT, DOE) pendant que vos équipes sont sur site — process cadré et traçabilité.",
    casUsage:
      "Lot VRD / terrassement : suivi DICT et classement pièces voirie avant démarrage — alertes sur échéances et manquants.",
    faq: [
      {
        q: "BeWork gère-t-il les DICT pour des chantiers à Toulouse ?",
        a: "Oui sur le suivi dossier et documentaire — voir /dict-dt-travaux. Les responsabilités réseaux restent chez l’entreprise.",
      },
    ],
  },
  bruxelles: {
    label: "Bruxelles",
    pays: "Belgique",
    h1: "Assistant travaux Bruxelles : assistance technique et administrative BTP francophone",
    introLead:
      "À Bruxelles, les entreprises de construction francophones jonglent entre chantiers urbains et dossiers techniques souvent traités en fin de journée.",
    localContext:
      "BeWork assure une assistance travaux à distance en français : analyse DCE, devis, relances, comptes rendus et coordination documentaire — sans présence locale, validation chez vous.",
    casUsage:
      "PME rénovation : suivi devis, relances clients et préparation situations pendant une période de surcharge chantier.",
    faq: [
      {
        q: "BeWork est-il adapté aux entreprises bruxelloises ?",
        a: "Oui pour l’assistance travaux BTP francophone. Voir /assistant-travaux-belgique pour le périmètre pays.",
      },
    ],
  },
  geneve: {
    label: "Genève",
    pays: "Suisse",
    h1: "Assistant travaux Genève : assistance technique et administrative BTP en Suisse romande",
    introLead:
      "À Genève, les exigences documentaires et les délais serrés pèsent sur les PME du bâtiment qui n’ont pas de renfort bureau dédié aux dossiers chantier.",
    localContext:
      "BeWork structure dossiers chantier, analyse pièces marché, relances et livrables en français. Nous ne remplaçons pas vos responsables techniques ni vos obligations contractuelles locales.",
    casUsage:
      "Entreprise second œuvre : préparation devis structurés, relances fournisseurs et suivi réserves — le dirigeant valide les prix.",
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
