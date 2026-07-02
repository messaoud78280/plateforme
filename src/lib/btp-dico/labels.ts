export const BTP_DICO_LEVELS = ["débutant", "intermédiaire", "confirmé"] as const;
export type BtpDicoLevel = (typeof BTP_DICO_LEVELS)[number];

export const BTP_DICO_STATUSES = ["à vérifier", "validé", "brouillon"] as const;
export type BtpDicoStatus = (typeof BTP_DICO_STATUSES)[number];

export type BtpDicoCategory =
  | "technique"
  | "document"
  | "materiau"
  | "materiel"
  | "mise_en_oeuvre"
  | "vigilance"
  | "norme"
  | "securite";

export const BTP_DICO_CATEGORY_LABELS: Record<BtpDicoCategory, string> = {
  technique: "Terme technique",
  document: "Document / pièce marché",
  materiau: "Matériau",
  materiel: "Matériel / équipement",
  mise_en_oeuvre: "Mise en œuvre",
  vigilance: "Point de vigilance",
  norme: "Norme / DTU",
  securite: "Sécurité chantier",
};

export const BTP_DICO_CATEGORIES = Object.keys(BTP_DICO_CATEGORY_LABELS) as BtpDicoCategory[];

export function isBtpDicoLevel(v: string): v is BtpDicoLevel {
  return (BTP_DICO_LEVELS as readonly string[]).includes(v);
}

export function isBtpDicoStatus(v: string): v is BtpDicoStatus {
  return (BTP_DICO_STATUSES as readonly string[]).includes(v);
}

export function isBtpDicoCategory(v: string): v is BtpDicoCategory {
  return (BTP_DICO_CATEGORIES as readonly string[]).includes(v as BtpDicoCategory);
}

export function categoryLabel(v: string | null | undefined): string | null {
  if (!v) return null;
  return isBtpDicoCategory(v) ? BTP_DICO_CATEGORY_LABELS[v] : v;
}

/** Normalise un niveau libre (accent/casse) vers une valeur connue. */
export function normalizeLevel(raw: string | null | undefined): BtpDicoLevel {
  const t = (raw ?? "").trim().toLowerCase();
  if (t.startsWith("interm")) return "intermédiaire";
  if (t.startsWith("conf")) return "confirmé";
  return "débutant";
}

/** Normalise une catégorie libre vers un code connu, sinon null. */
export function normalizeCategory(raw: string | null | undefined): BtpDicoCategory | null {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return null;
  if (isBtpDicoCategory(t)) return t;
  if (t.includes("acron")) return "technique";
  if (t.includes("doc") || t.includes("pièce") || t.includes("piece") || t.includes("marché")) return "document";
  if (t.includes("matériau") || t.includes("materiau")) return "materiau";
  if (t.includes("matériel") || t.includes("materiel") || t.includes("équipement") || t.includes("equipement"))
    return "materiel";
  if (t.includes("mise en") || t.includes("œuvre") || t.includes("oeuvre") || t.includes("pose")) return "mise_en_oeuvre";
  if (t.includes("vigilance")) return "vigilance";
  if (t.includes("norme") || t.includes("dtu")) return "norme";
  if (t.includes("sécurit") || t.includes("securit")) return "securite";
  if (t.includes("techn")) return "technique";
  return null;
}
