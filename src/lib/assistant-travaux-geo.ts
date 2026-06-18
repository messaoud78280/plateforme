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
    h1: "Assistant travaux en France : assistance technique et administrative BTP",
    introLead:
      "En France, les artisans, PME et conducteurs de travaux tiennent le terrain — mais l’analyse DCE, les appels d’offres, les situations Chorus Pro, le DOE et les relances s’accumulent vite au bureau.",
    localContext:
      "Marchés publics (plateformes régionales, Chorus Pro), accords-cadres, marchés privés et lots multi-corps d’état : BeWork structure vos dossiers à distance, avec supervision depuis la France et validation finale chez vous.",
    faq: [
      {
        q: "BeWork accompagne-t-il les entreprises BTP en métropole et en régions ?",
        a: "Oui, à distance partout en France. Vous transmettez DCE, dossiers chantier ou listes de relances ; nous préparons, suivons et alertons — vous validez avant tout envoi engageant.",
      },
      {
        q: "BeWork peut-il aider sur Chorus Pro et les marchés publics ?",
        a: "Oui : préparation des pièces, suivi des situations, relances et classement documentaire. La signature et l’engagement contractuel restent chez l’entreprise.",
      },
      {
        q: "Quelle différence avec une prestation administrative généraliste ?",
        a: "Un assistant travaux BeWork lit le BTP : lots, délais chantier, DCE, DOE, réserves, fournisseurs — pas une prestation administrative hors métier bâtiment.",
      },
    ],
  },
  belgique: {
    h1: "Assistant travaux en Belgique : assistance technique et administrative BTP",
    introLead:
      "En Belgique, les entreprises de construction gèrent souvent plusieurs chantiers avec peu de capacité bureau : analyse de pièces marché, relances et dossiers techniques passent après l’urgence terrain.",
    localContext:
      "Wallonie, Bruxelles ou Flandre francophone : BeWork propose une assistance travaux à distance, en français, pour structurer analyse DCE, comptes rendus, situations et suivi fournisseurs — sans recruter en interne.",
    faq: [
      {
        q: "BeWork travaille-t-il avec des entreprises belges ?",
        a: "Oui. L’accompagnement est à distance, en français, avec des process cadrés. Les validations techniques, prix et signatures restent chez votre entreprise.",
      },
      {
        q: "Quels dossiers peut-on déléguer depuis la Belgique ?",
        a: "Analyse DCE, devis et relances, comptes rendus, PPSPS/DOE (organisation), suivi fournisseurs et classement documentaire chantier, selon périmètre défini.",
      },
      {
        q: "Faut-il une présence locale BeWork en Belgique ?",
        a: "Non. L’assistance est opérée à distance avec supervision depuis la France. L’essentiel est un canal clair, des priorités et une validation avant diffusion.",
      },
    ],
  },
  suisse: {
    h1: "Assistant travaux en Suisse : assistance technique et administrative BTP",
    introLead:
      "En Suisse romande, les PME du bâtiment font face à des exigences documentaires élevées et à des délais serrés — souvent avec peu de renfort bureau pour structurer les dossiers chantier.",
    localContext:
      "BeWork aide à structurer dossiers chantier, analyse de pièces marché, relances et livrables documentaires en français, avec une méthode claire et une validation systématique côté dirigeant ou conducteur de travaux.",
    faq: [
      {
        q: "BeWork convient-il aux entreprises BTP en Suisse romande ?",
        a: "Oui pour l’assistance documentaire et technique chantier en français. Nous ne remplaçons pas vos responsables techniques ni vos engagements contractuels locaux.",
      },
      {
        q: "Peut-on déléguer le suivi de devis, AO et relances ?",
        a: "Oui. Tableaux de suivi, mails préparés, relances planifiées et alertes sur les dossiers en attente — vous gardez la décision commerciale.",
      },
      {
        q: "Comment démarrer depuis la Suisse ?",
        a: "Par un échange de cadrage : volume de dossiers, types de livrables, fréquence de suivi. Une mission ponctuelle ou un accompagnement mensuel est proposé selon votre charge.",
      },
    ],
  },
  luxembourg: {
    h1: "Assistant travaux au Luxembourg : assistance technique et administrative BTP",
    introLead:
      "Au Luxembourg, les entreprises BTP et titulaires de marchés jonglent entre chantiers, sous-traitants et dossiers techniques souvent traités en fin de journée.",
    localContext:
      "BeWork apporte une assistance travaux francophone : analyse DCE, devis, situations, DOE, relances et coordination documentaire — adaptée aux PME et structures multi-chantiers.",
    faq: [
      {
        q: "BeWork accompagne-t-il les entreprises luxembourgeoises du BTP ?",
        a: "Oui, à distance et en français. Le périmètre est cadré par mission : analyse DCE, suivi chantier, DOE, relances, etc.",
      },
      {
        q: "Peut-on confier un appel d’offres ou un DCE ?",
        a: "Oui pour l’analyse, la structuration des pièces, la préparation du mémoire technique et le suivi documentaire — la décision Go/No-go et le dépôt final restent chez vous.",
      },
      {
        q: "Quel niveau d’engagement pour démarrer ?",
        a: "Une mission ponctuelle structurée ou un accompagnement mensuel selon votre volume. Les tarifs de départ sont sur bework.fr/tarifs, ajustés au devis.",
      },
    ],
  },
};
