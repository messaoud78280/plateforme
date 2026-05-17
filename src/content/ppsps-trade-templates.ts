/** Modèles par corps d'état — accélèrent la saisie PPSPS */
export type PpspsTradeTemplate = {
  id: string;
  label: string;
  trades: string[];
  operationType: "construction_neuve" | "renovation" | "rehabilitation" | "demolition_partielle" | "travaux_exterieurs";
  constraints: string;
  suggestedTaskIds: string[];
  coactivity: "oui" | "non" | "a_confirmer";
};

export const PPSPS_TRADE_TEMPLATES: readonly PpspsTradeTemplate[] = [
  {
    id: "maconnerie",
    label: "Maçonnerie / gros œuvre",
    trades: ["Maçonnerie", "Gros œuvre"],
    operationType: "construction_neuve",
    constraints: "Manutention matériaux, échafaudages, fouilles, coactivité",
    suggestedTaskIds: ["m-dechargement", "m-stockage", "h-echafaudage", "t-fondations", "t-coulage-fouille", "m-manuelle"],
    coactivity: "a_confirmer",
  },
  {
    id: "terrassement",
    label: "Terrassement / VRD",
    trades: ["Terrassement", "VRD"],
    operationType: "travaux_exterieurs",
    constraints: "Réseaux enterrés, circulation engins, voirie",
    suggestedTaskIds: ["t-terrassement", "t-tranchee", "t-reseaux-enterres", "e-pelle", "e-circulation", "e-voirie"],
    coactivity: "oui",
  },
  {
    id: "electricite",
    label: "Électricité",
    trades: ["Électricité"],
    operationType: "renovation",
    constraints: "Installations existantes, consignation, habilitations",
    suggestedTaskIds: ["el-outillage", "el-install-existante", "el-raccordement", "el-coffret", "el-lignes"],
    coactivity: "a_confirmer",
  },
  {
    id: "demolition",
    label: "Démolition",
    trades: ["Démolition"],
    operationType: "demolition_partielle",
    constraints: "Poussières, bruit, repérage amiante/plomb à confirmer",
    suggestedTaskIds: ["d-manuelle", "d-mecanique", "d-poussieres", "d-gravats", "c-amiante", "c-plomb"],
    coactivity: "oui",
  },
  {
    id: "couverture",
    label: "Couverture / étanchéité",
    trades: ["Couverture", "Étanchéité"],
    operationType: "rehabilitation",
    constraints: "Travaux en hauteur, intempéries, lignes de vie",
    suggestedTaskIds: ["h-toiture", "h-nacelle", "h-echelle", "h-garde-corps", "d-bruit"],
    coactivity: "non",
  },
  {
    id: "site-occupe",
    label: "Site occupé / ERP",
    trades: ["Plâtrerie / isolation"],
    operationType: "renovation",
    constraints: "Site occupé, public, accès secours, coactivité forte",
    suggestedTaskIds: ["o-site-occupe", "o-public", "o-coactivite", "o-secours", "o-evacuation", "o-stockage"],
    coactivity: "oui",
  },
] as const;

export function getPpspsTradeTemplate(id: string): PpspsTradeTemplate | undefined {
  return PPSPS_TRADE_TEMPLATES.find((t) => t.id === id);
}
