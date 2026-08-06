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
    h1: "Plateforme BTP Paris : outils travaux pour vos équipes en Île-de-France",
    introLead:
      "En Île-de-France, les entreprises du bâtiment enchaînent chantiers urbains, appels d’offres et marchés publics — souvent sans plateforme métier pour structurer les dossiers entre bureau et terrain.",
    localContext:
      "Rénovation tertiaire, logement collectif, VRD en zone dense : DCE, situations Chorus Pro, DOE et relances s’accumulent vite. BeWork déploie une plateforme interne spécialisée BTP — vos équipes l’utilisent ; BeWork configure et fait évoluer.",
    casUsage:
      "Lot second œuvre sur marché public en petite couronne : la plateforme centralise l’analyse DCE, la préparation des situations Chorus Pro et la compilation DOE pendant que le CT enchaîne trois réceptions la même semaine.",
    faq: [
      {
        q: "BeWork équipe-t-il les entreprises BTP en Île-de-France ?",
        a: "Oui. Plateforme interne pour analyse DCE, appels d’offres, comptes rendus, Chorus Pro, DOE, relances — usage par vos équipes, validation finale chez vous.",
      },
      {
        q: "Faut-il un outil sur place à Paris ?",
        a: "La plateforme est accessible à distance (dossiers chantier, pièces marché, suivi). L’essentiel est un cadrage clair, des rôles et des priorités partagées.",
      },
    ],
  },
  lyon: {
    label: "Lyon & Auvergne-Rhône-Alpes",
    pays: "France",
    h1: "Plateforme BTP Lyon : outils travaux pour vos équipes en Auvergne-Rhône-Alpes",
    introLead:
      "À Lyon et en région, les PME du bâtiment cumulent logements, équipements publics et chantiers en co-activité — les dossiers techniques suivent mal le rythme sans environnement numérique métier.",
    localContext:
      "Marchés métropole, lots techniques et sous-traitance multi-corps d’état : BeWork structure analyse DCE, mémoires techniques et suivi marché public dans une plateforme utilisée par vos collaborateurs.",
    casUsage:
      "Entreprise de gros œuvre avec deux AO en parallèle : synthèse DCE et checklist dépôt préparées dans la plateforme — le dirigeant valide le Go/No Go et le prix.",
    faq: [
      {
        q: "BeWork intervient-il pour des entreprises lyonnaises ?",
        a: "Oui : déploiement et évolution de plateforme à distance. Voir aussi /assistant-travaux-france pour le périmètre national.",
      },
    ],
  },
  marseille: {
    label: "Marseille & Sud",
    pays: "France",
    h1: "Plateforme BTP Marseille : outils travaux pour vos équipes",
    introLead:
      "À Marseille et sur le littoral sud, les entreprises gèrent souvent plusieurs chantiers avec des équipes réduites au bureau — sans outil partagé pour tenir les dossiers.",
    localContext:
      "Réhabilitation, VRD, marchés à tranches : relances fournisseurs, situations, réserves et DOE peuvent être structurés dans la plateforme BeWork — vous gardez le pilotage technique chantier.",
    casUsage:
      "Artisan électricité débordé : relances devis, classement dossiers chantier et suivi réserves dans la plateforme, avec tableau de suivi hebdomadaire validé en interne.",
    faq: [
      {
        q: "Peut-on démarrer par une étude depuis Marseille ?",
        a: "Oui — démonstration et étude de déploiement selon votre volume et vos modules. Détail des modalités sur /tarifs.",
      },
    ],
  },
  lille: {
    label: "Lille & Hauts-de-France",
    pays: "France",
    h1: "Plateforme BTP Lille : outils travaux pour vos équipes dans le Nord",
    introLead:
      "Dans les Hauts-de-France, les entreprises BTP cherchent souvent à sécuriser le bureau sans recruter — surtout sur les pics d’appels d’offres et d’exécution marché public.",
    localContext:
      "BeWork propose une plateforme métier francophone : analyse DCE, réponse AO, situations Chorus Pro, réserves et DOE. Vos équipes l’utilisent ; BeWork déploie et accompagne l’évolution.",
    casUsage:
      "PME menuiserie : préparation mémoire technique et relecture DPGF avant dépôt plateforme — validation interne accélérée grâce aux checklists et au classement partagé.",
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
    h1: "Plateforme BTP Bordeaux : outils travaux pour vos équipes",
    introLead:
      "En Nouvelle-Aquitaine, la croissance du parc de chantiers s’accompagne souvent d’un retard sur les dossiers techniques et documentaires faute d’outil métier unique.",
    localContext:
      "Construction neuve, rénovation énergétique, marchés publics locaux : BeWork équipe une plateforme pour structurer AO, analyse DCE, devis et clôture chantier (DOE, réserves).",
    casUsage:
      "Conducteur sur lot CVC : comptes rendus et relances MOE préparés depuis les notes du CT dans la plateforme — diffusion après validation.",
    faq: [
      {
        q: "Quels documents peut-on centraliser depuis Bordeaux ?",
        a: "DCE, situations, listes de relances, notes de réunion, pièces DOE — via la plateforme et l’espace client.",
      },
    ],
  },
  toulouse: {
    label: "Toulouse & Occitanie",
    pays: "France",
    h1: "Plateforme BTP Toulouse : outils travaux pour vos équipes",
    introLead:
      "À Toulouse et en Occitanie, les entreprises BTP partagent le même enjeu : trop de dossiers à structurer, pas assez d’environnement partagé pour l’analyse et le suivi documentaire.",
    localContext:
      "La plateforme BeWork centralise le flux technique et documentaire (analyse DCE, AO, Chorus Pro, DICT, DOE) pendant que vos équipes sont sur site — process cadré et traçabilité.",
    casUsage:
      "Lot VRD / terrassement : suivi DICT et classement pièces voirie avant démarrage — alertes sur échéances et manquants dans la plateforme.",
    faq: [
      {
        q: "BeWork gère-t-il les DICT pour des chantiers à Toulouse ?",
        a: "Oui sur le suivi dossier et documentaire dans la plateforme — voir /dict-dt-travaux. Les responsabilités réseaux restent chez l’entreprise.",
      },
    ],
  },
  bruxelles: {
    label: "Bruxelles",
    pays: "Belgique",
    h1: "Plateforme BTP Bruxelles : outils travaux francophones pour vos équipes",
    introLead:
      "À Bruxelles, les entreprises de construction francophones jonglent entre chantiers urbains et dossiers techniques souvent traités hors d’un outil métier partagé.",
    localContext:
      "BeWork déploie une plateforme travaux en français : analyse DCE, devis, relances, comptes rendus et coordination documentaire — usage par vos équipes, validation chez vous.",
    casUsage:
      "PME rénovation : suivi devis, relances clients et préparation situations dans la plateforme pendant une période de surcharge chantier.",
    faq: [
      {
        q: "BeWork est-il adapté aux entreprises bruxelloises ?",
        a: "Oui pour une plateforme métier BTP francophone. Voir /assistant-travaux-belgique pour le périmètre pays.",
      },
    ],
  },
  geneve: {
    label: "Genève",
    pays: "Suisse",
    h1: "Plateforme BTP Genève : outils travaux pour vos équipes en Suisse romande",
    introLead:
      "À Genève, les exigences documentaires et les délais serrés pèsent sur les PME du bâtiment qui n’ont pas d’environnement numérique dédié aux dossiers chantier.",
    localContext:
      "BeWork structure dossiers chantier, pièces marché, relances et livrables dans une plateforme en français. Vos équipes l’utilisent ; nous ne remplaçons pas vos responsables techniques ni vos obligations contractuelles locales.",
    casUsage:
      "Entreprise second œuvre : préparation devis structurés, relances fournisseurs et suivi réserves dans la plateforme — le dirigeant valide les prix.",
    faq: [
      {
        q: "BeWork travaille-t-il avec des entreprises genevoises ?",
        a: "Oui : déploiement à distance et en français. Voir /assistant-travaux-suisse pour le périmètre romand.",
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
