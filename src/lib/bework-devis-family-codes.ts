/**
 * Lexique des familles d’ouvrages BeWork Devis (codes courts BW-XXX-NNN).
 */

export type BeWorkDevisFamilyDefinition = {
  code: string;
  label: string;
  order: number;
  description: string;
  /** Termes à chercher dans lot + famille (ordre = priorité : plus spécifique en premier dans le tableau global). */
  matchTerms: string[];
};

export const BEWORK_DEVIS_FAMILY_LEXICON: BeWorkDevisFamilyDefinition[] = [
  {
    code: "ADM",
    label: "Études / administratif",
    order: 1,
    description: "Constats, diagnostics, études de conception, dossiers administratifs.",
    matchTerms: ["études / administratif", "administratif", "étude", "diagnostic", "dossier administratif"],
  },
  {
    code: "TER",
    label: "Terrassement",
    order: 2,
    description: "Décapage, fouilles, tranchées, remblais et mouvements de terre.",
    matchTerms: ["terrassement", "décapage", "fouille", "tranchée", "remblai", "mouvement de terre"],
  },
  {
    code: "VRD",
    label: "VRD / Réseaux",
    order: 3,
    description: "Réseaux secs, humides, raccordements et équipements extérieurs.",
    matchTerms: ["vrd / réseaux", "vrd", "réseaux extérieurs", "assainissement", "égout", "eaux pluviales"],
  },
  {
    code: "FON",
    label: "Fondations / Soubassement",
    order: 4,
    description: "Semelles, longrines, pieux, soubassements maçonnés ou béton.",
    matchTerms: ["fondations / soubassement", "fondation", "soubassement", "semelle", "longrine", "pieux"],
  },
  {
    code: "DAL",
    label: "Dallage / Plancher bas",
    order: 5,
    description: "Dalle portée, plancher sur terre-plein, isolants sous dalle.",
    matchTerms: ["dallage / plancher bas", "dallage", "plancher bas", "dalle portée"],
  },
  {
    code: "MAC",
    label: "Maçonnerie / Élévation",
    order: 6,
    description: "Gros œuvre, murs porteurs, linteaux, reprises et ouvertures.",
    matchTerms: ["maçonnerie / élévation", "maçonnerie", "élévation", "gros œuvre", "mur porteur", "linteau"],
  },
  {
    code: "CHA",
    label: "Charpente",
    order: 7,
    description: "Charpente bois ou métallique, fermettes, pannes et contreventements.",
    matchTerms: ["charpente", "fermette", "panne", "contreventement"],
  },
  {
    code: "COU",
    label: "Couverture / Zinguerie",
    order: 8,
    description: "Couverture, étanchéité toiture, zinguerie et évacuations.",
    matchTerms: ["couverture / zinguerie", "couverture", "zinguerie", "étanchéité toiture"],
  },
  {
    code: "MEX",
    label: "Menuiseries extérieures",
    order: 9,
    description: "Portes, fenêtres, volets et occultations extérieures.",
    matchTerms: ["menuiseries extérieures", "fenêtre", "porte-fenêtre", "volet roulant", "baie vitrée"],
  },
  {
    code: "PLA",
    label: "Isolation / Plâtrerie",
    order: 10,
    description: "Isolants, doublages, cloisons sèches et enduits intérieurs.",
    matchTerms: ["isolation / plâtrerie", "isolation", "plâtrerie", "doublage", "cloison sèche", "placo"],
  },
  {
    code: "PLO",
    label: "Plomberie / Sanitaires",
    order: 11,
    description: "Distribution eau, évacuation, sanitaires et appareillages.",
    matchTerms: ["plomberie / sanitaires", "plomberie", "sanitaire", "évacuation eau", "salle de bain"],
  },
  {
    code: "ELE",
    label: "Électricité / VMC / Courants faibles",
    order: 12,
    description: "Courants forts, éclairage, VMC, réseaux faibles et domotique.",
    matchTerms: [
      "électricité / vmc / courants faibles",
      "électricité",
      "courants faibles",
      "vmc",
      "tableau électrique",
      "éclairage",
    ],
  },
  {
    code: "CHF",
    label: "Chauffage / PAC / Régulation",
    order: 13,
    description: "Génération de chaleur, émetteurs, régulation et fluides frigorigènes.",
    matchTerms: ["chauffage / pac / régulation", "chauffage", "pac", "pompe à chaleur", "régulation", "radiateur"],
  },
  {
    code: "MIN",
    label: "Menuiseries intérieures / Escalier",
    order: 14,
    description: "Portes intérieures, habillages, escaliers et rangements intégrés.",
    matchTerms: ["menuiseries intérieures / escalier", "menuiserie intérieure", "escalier", "porte intérieure"],
  },
  {
    code: "CAR",
    label: "Carrelage / Faïence",
    order: 15,
    description: "Revêtements céramiques, faïences et joints.",
    matchTerms: ["carrelage / faïence", "carrelage", "faïence", "faience", "joint carrelage"],
  },
  {
    code: "SOL",
    label: "Sols stratifiés / Parquets",
    order: 16,
    description: "Parquets, stratifiés, sous-couches et plinthes.",
    matchTerms: ["sols stratifiés / parquets", "parquet", "stratifié", "sol stratifié"],
  },
  {
    code: "PEI",
    label: "Peinture",
    order: 17,
    description: "Peintures, sous-couches et finitions murales.",
    matchTerms: ["peinture", "sous-couche peinture", "finition murale"],
  },
  {
    code: "FAC",
    label: "Façade / Enduits",
    order: 18,
    description: "Isolation par l’extérieur, enduits, bardages et reprises de façade.",
    matchTerms: ["façade / enduits", "façade", "facade", "enduit extérieur", "bardage", "ipe"],
  },
  {
    code: "GAR",
    label: "Garanties / Assurances / Frais contractuels",
    order: 99,
    description: "Garanties décennales, assurances chantier, frais et réserves contractuelles.",
    matchTerms: [
      "garanties / assurances / frais contractuels",
      "garantie",
      "assurance",
      "frais contractuel",
      "décennale",
      "dommage-ouvrage",
    ],
  },
];

const FAMILY_ORDER = new Map(BEWORK_DEVIS_FAMILY_LEXICON.map((f, i) => [f.code.toUpperCase(), f.order ?? i]));

export function getBeWorkFamilyLexiconSorted(): BeWorkDevisFamilyDefinition[] {
  return [...BEWORK_DEVIS_FAMILY_LEXICON].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getBeWorkFamilyLabel(familyCode: string | null | undefined): string | null {
  if (!familyCode) return null;
  const u = familyCode.trim().toUpperCase();
  const row = BEWORK_DEVIS_FAMILY_LEXICON.find((f) => f.code.toUpperCase() === u);
  return row ? row.label : null;
}

export function isKnownFamilyCode(code: string): boolean {
  const u = code.trim().toUpperCase();
  return BEWORK_DEVIS_FAMILY_LEXICON.some((f) => f.code.toUpperCase() === u);
}

/** Normalise pour comparaison (accents retirés, minuscules). */
export function normalizeBeWorkMatchString(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Génère un code BeWork générique : BW-XXX-001 (index 1 → 001).
 */
export function generateBeWorkCode(familyCode: string, index: number): string {
  const fam = familyCode.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(fam)) {
    throw new Error(`Code famille invalide : ${familyCode} (attendu 3 lettres A-Z).`);
  }
  if (!Number.isInteger(index) || index < 1 || index > 999_999) {
    throw new Error(`Index invalide : ${index}`);
  }
  const num = index < 1000 ? String(index).padStart(3, "0") : String(index);
  return `BW-${fam}-${num}`;
}

/**
 * Déduit le code famille à partir du lot (et optionnellement du libellé famille texte).
 * Retourne null si aucune règle ne correspond (l’appelant peut utiliser GAR par défaut).
 */
export function suggestFamilyCodeFromLot(lot: string, familyField?: string | null): string | null {
  const hay = normalizeBeWorkMatchString(`${lot}\n${familyField ?? ""}`);

  const rules = [...BEWORK_DEVIS_FAMILY_LEXICON].sort((a, b) => {
    const maxLen = (f: BeWorkDevisFamilyDefinition) => Math.max(...f.matchTerms.map((t) => t.length), 0);
    return maxLen(b) - maxLen(a) || (FAMILY_ORDER.get(a.code) ?? 0) - (FAMILY_ORDER.get(b.code) ?? 0);
  });

  for (const fam of rules) {
    for (const term of fam.matchTerms) {
      const t = normalizeBeWorkMatchString(term);
      if (t && hay.includes(t)) return fam.code.toUpperCase();
    }
  }
  return null;
}
