/**
 * Unités canoniques du métré (spec §3.3) et affichage des quantités.
 */

const ALIASES: Record<string, string> = {
  ft: "forfait",
  fft: "forfait",
  ens: "forfait",
  forfait: "forfait",
  m3: "m3",
  "m³": "m3",
  "m^3": "m3",
  m2: "m2",
  "m²": "m2",
  "m^2": "m2",
  ml: "ml",
  "m.l": "ml",
  m: "m",
  u: "u",
  "unité": "u",
  unite: "u",
  pce: "u",
  pc: "u",
  kg: "kg",
  t: "t",
  tonne: "t",
  tonnes: "t",
  h: "h",
  heure: "h",
  heures: "h",
  j: "j",
  jour: "j",
  jours: "j",
  rotation: "rotation",
  rotations: "rotation",
  coef: "coef",
  "kg/m3": "kg/m3",
  "kg/m³": "kg/m3",
};

export function normalizePrepUnit(raw: string): { unit: string; changed: boolean } {
  const trimmed = raw.trim();
  const key = trimmed.toLowerCase().replace(/\s+/g, "");
  const unit = ALIASES[key] ?? (key.endsWith("/j") ? key.replace("³", "3").replace("²", "2") : trimmed);
  return { unit, changed: unit !== trimmed };
}

const UNIT_DISPLAY: Record<string, string> = {
  m3: "m³",
  m2: "m²",
  "kg/m3": "kg/m³",
  "m3/j": "m³/j",
  "m2/j": "m²/j",
  coef: "",
};

export function displayUnit(unit: string): string {
  return UNIT_DISPLAY[unit] ?? unit;
}

/** Affichage français, 3 décimales maximum, sans altérer la valeur de calcul. */
export function formatQty(value: number | null | undefined, maxDecimals = 3): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/** Saisie utilisateur française (virgule ou point) → nombre, ou null si invalide. */
export function parseUserNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?[0-9]+(\.[0-9]+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
