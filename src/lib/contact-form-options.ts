export const MARKET_TYPE_OPTIONS = [
  { value: "marche_public", label: "Marché public" },
  { value: "marche_prive", label: "Marché privé" },
  { value: "accord_cadre", label: "Accord-cadre" },
  { value: "contrat_recurrent", label: "Contrat récurrent" },
  { value: "autre", label: "Autre" },
] as const;

export const MAIN_NEED_OPTIONS = [
  { value: "suivi_administratif", label: "Suivi administratif marché" },
  { value: "doe", label: "DOE" },
  { value: "comptes_rendus", label: "Comptes rendus" },
  { value: "dt_dict", label: "DT / DICT" },
  { value: "attachements_situations", label: "Attachements / situations" },
  { value: "relances_donneurs_ordre", label: "Relances donneurs d'ordre" },
  { value: "autre", label: "Autre" },
] as const;

export type MarketTypeValue = (typeof MARKET_TYPE_OPTIONS)[number]["value"];
export type MainNeedValue = (typeof MAIN_NEED_OPTIONS)[number]["value"];

const marketLabels = Object.fromEntries(MARKET_TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<
  string,
  string
>;
const needLabels = Object.fromEntries(MAIN_NEED_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

export function labelMarketType(value: string): string {
  return marketLabels[value] ?? value;
}

export function labelMainNeed(value: string): string {
  return needLabels[value] ?? value;
}
