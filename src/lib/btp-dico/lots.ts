export type BtpDicoLot = {
  code: string;
  name: string;
  /** Libellé complet affiché (ex. « Lot 09 - Électricité CFO CFA »). */
  label: string;
};

/** Les 16 lots travaux BeWork — évolutif, lot 09 prioritaire. */
export const BTP_DICO_LOTS: BtpDicoLot[] = [
  { code: "01", name: "Fondations / Gros œuvre", label: "Lot 01 - Fondations / Gros œuvre" },
  { code: "02", name: "Charpente / Couverture", label: "Lot 02 - Charpente / Couverture" },
  { code: "03", name: "Étanchéité", label: "Lot 03 - Étanchéité" },
  { code: "04", name: "Menuiseries extérieures", label: "Lot 04 - Menuiseries extérieures" },
  { code: "05", name: "Menuiseries intérieures", label: "Lot 05 - Menuiseries intérieures" },
  { code: "06", name: "Serrurerie", label: "Lot 06 - Serrurerie" },
  { code: "07", name: "Plâtrerie", label: "Lot 07 - Plâtrerie" },
  { code: "08", name: "CVC / Plomberie / Sanitaire", label: "Lot 08 - CVC / Plomberie / Sanitaire" },
  { code: "09", name: "Électricité CFO CFA", label: "Lot 09 - Électricité CFO CFA" },
  { code: "10", name: "Sols souples / Carrelage / Faïence", label: "Lot 10 - Sols souples / Carrelage / Faïence" },
  { code: "11", name: "Peinture", label: "Lot 11 - Peinture" },
  { code: "12", name: "Terrassement / Voirie / EU / EP", label: "Lot 12 - Terrassement / Voirie / EU / EP" },
  { code: "13", name: "Réseaux basse tension / Télécom", label: "Lot 13 - Réseaux basse tension / Télécom" },
  { code: "14", name: "AEP / Défense incendie / Arrosage", label: "Lot 14 - AEP / Défense incendie / Arrosage" },
  { code: "15", name: "Paysage / Espaces verts", label: "Lot 15 - Paysage / Espaces verts" },
  { code: "16", name: "Démolition", label: "Lot 16 - Démolition" },
];

const LOT_BY_CODE = new Map(BTP_DICO_LOTS.map((l) => [l.code, l]));

/** Normalise un code/libellé de lot vers le code court (ex. « 09 - Électricité » → « 09 »). */
export function normalizeLotCode(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const numMatch = t.match(/(\d{1,2})/);
  if (numMatch) {
    const code = numMatch[1].padStart(2, "0");
    if (LOT_BY_CODE.has(code)) return code;
  }
  const byName = BTP_DICO_LOTS.find(
    (l) => l.name.toLowerCase() === t.toLowerCase() || l.label.toLowerCase() === t.toLowerCase(),
  );
  return byName?.code ?? null;
}

export function lotLabelFromCode(code: string | null | undefined): string {
  if (!code) return "Sans lot";
  return LOT_BY_CODE.get(code)?.label ?? code;
}

export function lotNameFromCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return LOT_BY_CODE.get(code)?.name ?? null;
}
