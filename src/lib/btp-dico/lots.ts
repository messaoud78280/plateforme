export type BtpDicoLot = {
  code: string;
  name: string;
  /** Libellé complet affiché (ex. « Lot 09 - Électricité CFO CFA »). */
  label: string;
};

/** Les 16 lots travaux BeWork — référentiel Dico BTP. */
export const BTP_DICO_LOTS: BtpDicoLot[] = [
  { code: "01", name: "Fondations - Gros Oeuvre", label: "Lot 01 - Fondations - Gros Oeuvre" },
  { code: "02", name: "Enduits de façades", label: "Lot 02 - Enduits de façades" },
  { code: "03", name: "Charpente bois et couverture", label: "Lot 03 - Charpente bois et couverture" },
  { code: "04", name: "Menuiseries extérieures", label: "Lot 04 - Menuiseries extérieures" },
  { code: "05", name: "Menuiseries intérieures", label: "Lot 05 - Menuiseries intérieures" },
  { code: "06", name: "Serrurerie", label: "Lot 06 - Serrurerie" },
  { code: "07", name: "Plâtrerie - Isolation", label: "Lot 07 - Plâtrerie - Isolation" },
  { code: "08", name: "CVC Plomberie Sanitaire", label: "Lot 08 - CVC Plomberie Sanitaire" },
  { code: "09", name: "Electricite CFO-CFA", label: "Lot 09 - Electricite CFO-CFA" },
  { code: "10", name: "Carrelage, faïences et sols souples", label: "Lot 10 - Carrelage, faïences et sols souples" },
  { code: "11", name: "Peinture", label: "Lot 11 - Peinture" },
  { code: "12", name: "Terrassements, assainissements EP et EU, voirie", label: "Lot 12 - Terrassements, assainissements EP et EU, voirie" },
  { code: "13", name: "Réseaux basse tension - Télécom - Éclairage et IRVE", label: "Lot 13 - Réseaux basse tension - Télécom - Éclairage et IRVE" },
  { code: "14", name: "Réseau adduction eau potable - Défense incendie", label: "Lot 14 - Réseau adduction eau potable - Défense incendie" },
  { code: "15", name: "Paysage", label: "Lot 15 - Paysage" },
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
