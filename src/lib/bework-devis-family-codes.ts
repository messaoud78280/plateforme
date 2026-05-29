/**
 * Lexique des familles d’ouvrages BeWork Devis (codes courts BW-XXX-NNN).
 */

/** Repli quand aucun corps de métier ne correspond (jamais GAR : réservé à l’administratif). */
export const DEFAULT_BEWORK_FAMILY_CODE = "DIV";

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
    matchTerms: [
      "fondations / soubassement",
      "fondation",
      "fondations superficielles",
      "soubassement",
      "semelle",
      "longrine",
      "radier",
      "puits",
      "beton de proprete",
      "béton de propreté",
      "terrassement pour fondation",
      "pieux",
    ],
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
    matchTerms: [
      "maçonnerie / élévation",
      "maçonnerie",
      "maconnerie",
      "élévation",
      "gros œuvre",
      "gros oeuvre",
      "mur porteur",
      "mur agglo",
      "parpaing",
      "beton arme",
      "béton armé",
      "chainage",
      "chaînage",
      "linteau",
      "poutre ba",
      "poteau ba",
      "dalle beton",
      "dalle béton",
      "plancher",
      "demolition maconnerie",
      "démolition maçonnerie",
      "ouverture mur",
    ],
  },
  {
    code: "ECH",
    label: "Échafaudages / Protections",
    order: 6.5,
    description: "Échafaudages, protections collectives, filets et garde-corps provisoires.",
    matchTerms: [
      "échafaudage",
      "echafaudage",
      "échafaudages",
      "garde-corps de protection",
      "filet de protection",
      "protection échafaudage",
      "protection echafaudage",
      "échafaudage volant",
      "echafaudage volant",
      "échafaudage pied",
      "échafaudage roulant",
      "nacelle",
    ],
  },
  {
    code: "DEM",
    label: "Démolition / Dépose",
    order: 6.6,
    description: "Démolitions, déposes, curages et évacuations.",
    matchTerms: ["démolition", "demolition", "dépose", "depose", "curage", "évacuation gravats"],
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
    matchTerms: [
      "couverture / zinguerie",
      "couverture",
      "zinguerie",
      "étanchéité toiture",
      "tuile",
      "ardoise",
      "faîtage",
      "faitage",
      "gouttière",
      "gouttiere",
      "cheneau",
      "chéneau",
      "zinc",
      "ecran sous toiture",
      "écran sous toiture",
    ],
  },
  {
    code: "ETA",
    label: "Étanchéité",
    order: 8.5,
    description: "Membranes, relevés, terrasses étanchées et résines.",
    matchTerms: [
      "étanchéité",
      "etancheite",
      "membrane",
      "epdm",
      "bitume",
      "relevé d'étanchéité",
      "releve d etancheite",
      "terrasse etanchee",
      "terrasse étanchée",
      "resine etancheite",
      "résine étanchéité",
    ],
  },
  {
    code: "MEX",
    label: "Menuiseries extérieures",
    order: 9,
    description: "Portes, fenêtres, volets et occultations extérieures.",
    matchTerms: [
      "menuiseries extérieures",
      "fenêtre",
      "porte-fenêtre",
      "volet roulant",
      "baie vitrée",
      "portail",
      "portillon",
      "portes et portails",
      "portes et portillons",
      "porte de garage",
      "porte sectionnelle",
      "porte coulissante",
      "portail coulissant",
      "grillage",
      "cloture",
      "clôture",
      "portes coulissantes",
    ],
  },
  {
    code: "PLA",
    label: "Isolation / Plâtrerie",
    order: 10,
    description: "Isolants, doublages, cloisons sèches et enduits intérieurs.",
    matchTerms: [
      "isolation / plâtrerie",
      "isolation",
      "plâtrerie",
      "platerie",
      "doublage",
      "cloison sèche",
      "cloison seche",
      "placo",
      "plaque de platre",
      "plaque de plâtre",
      "faux plafond",
      "laine minerale",
      "laine minérale",
      "isolation thermique",
      "isolation acoustique",
    ],
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
      "electricite",
      "courants faibles",
      "vmc",
      "tableau électrique",
      "tableau electrique",
      "éclairage",
      "eclairage",
      "prise",
      "interrupteur",
      "point lumineux",
      "gaine icta",
      "gaine ICTA",
      "cable",
      "câble",
      "disjoncteur",
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
    matchTerms: [
      "carrelage / faïence",
      "carrelage",
      "faïence",
      "faience",
      "joint carrelage",
      "plinthe carrelage",
      "chape",
      "ragreage",
      "ragréage",
    ],
  },
  {
    code: "SOL",
    label: "Sols stratifiés / Parquets",
    order: 16,
    description: "Parquets, stratifiés, sous-couches et plinthes.",
    matchTerms: [
      "sols stratifiés / parquets",
      "parquet",
      "stratifié",
      "stratifie",
      "sol stratifié",
      "sol souple",
      "pvc",
      "moquette",
      "ragreage sol",
      "ragréage sol",
    ],
  },
  {
    code: "PEI",
    label: "Peinture",
    order: 17,
    description: "Peintures, sous-couches et finitions murales.",
    matchTerms: [
      "peinture",
      "sous-couche peinture",
      "finition murale",
      "impression",
      "enduit de lissage",
      "preparation support",
      "préparation support",
      "lessivage",
      "finition mur",
      "finition plafond",
    ],
  },
  {
    code: "FAC",
    label: "Façade / Enduits",
    order: 18,
    description: "Isolation par l’extérieur, enduits, bardages et reprises de façade.",
    matchTerms: ["façade / enduits", "façade", "facade", "enduit extérieur", "bardage", "ipe"],
  },
  {
    code: "ESP",
    label: "Espaces verts",
    order: 19,
    description: "Plantations, engazonnement, taille, haies, arrosage et entretien paysager.",
    matchTerms: [
      "espaces verts",
      "espace vert",
      "espaces_verts",
      "paysager",
      "plantation",
      "engazonnement",
      "haie",
      "taille de haie",
      "élagage",
      "arrosage",
      "gazon",
    ],
  },
  {
    code: "GAR",
    label: "Garanties / Assurances / Frais contractuels",
    order: 99,
    description: "Garanties décennales, assurances chantier, frais et réserves contractuelles.",
    matchTerms: [
      "garanties / assurances / frais contractuels",
      "garanties / assurances",
      "frais contractuels",
      "frais contractuel",
      "dommage-ouvrage",
      "dommage ouvrage",
      "assurance chantier",
      "assurance decennale",
      "garantie decennale",
      "retenue de garantie",
      "caution bancaire",
      "attestation d assurance",
      "attestation de garantie",
    ],
  },
  {
    code: "DIV",
    label: "Divers / À classer",
    order: 98,
    description: "Ouvrages sans corps de métier identifié automatiquement.",
    matchTerms: [],
  },
];

const GAR_CANONICAL_LOT_LABEL = normalizeBeWorkMatchString("Garanties / Assurances / Frais contractuels");

/** Signaux d’ouvrage technique : empêche un classement GAR sur un libellé ambigu. */
const TECHNICAL_WORK_SIGNAL =
  /\b(portail|portillon|beton|maconnerie|charpente|couverture|carrelage|plomberie|electricite|terrassement|fourniture et pose|dalle|semelle|parpaing|isolation|peinture|enduit|menuiserie|echafaud|nacelle|grue|tube|pvc|cable|gaine)\b/;

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

export type WorkItemFamilySuggestionInput = {
  lot: string;
  subLot?: string | null;
  family?: string | null;
  title?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  itemType?: string | null;
};

function sanitizedLotForClassification(lot: string, title?: string | null): string {
  const raw = lot.trim();
  if (!raw) return raw;
  if (title?.trim() && normalizeBeWorkMatchString(raw) === GAR_CANONICAL_LOT_LABEL) {
    return title.trim();
  }
  return raw;
}

/** Chaîne normalisée pour la classification (titre prioritaire si le lot a été écrasé en GAR). */
export function buildWorkItemClassificationHaystack(input: WorkItemFamilySuggestionInput): string {
  const lotPart = sanitizedLotForClassification(input.lot, input.title);
  const descSnippet = input.fullDescription?.trim().slice(0, 320) ?? "";
  return normalizeBeWorkMatchString(
    [input.title, input.subLot, input.family, lotPart, input.shortDescription, descSnippet].filter(Boolean).join(" "),
  );
}

function isStrictAdministrativeHaystack(hay: string): boolean {
  const gar = BEWORK_DEVIS_FAMILY_LEXICON.find((f) => f.code === "GAR");
  if (!gar) return false;
  for (const term of gar.matchTerms) {
    const t = normalizeBeWorkMatchString(term);
    if (t && hay.includes(t)) return true;
  }
  return false;
}

function matchFamilyFromHaystack(hay: string, opts: { allowGar: boolean }): string | null {
  const rules = [...BEWORK_DEVIS_FAMILY_LEXICON]
    .filter((f) => f.code !== "DIV" && (opts.allowGar || f.code !== "GAR"))
    .sort((a, b) => {
      const maxLen = (f: BeWorkDevisFamilyDefinition) => Math.max(...f.matchTerms.map((t) => t.length), 0);
      return maxLen(b) - maxLen(a) || (FAMILY_ORDER.get(a.code) ?? 0) - (FAMILY_ORDER.get(b.code) ?? 0);
    });

  for (const fam of rules) {
    for (const term of fam.matchTerms) {
      const t = normalizeBeWorkMatchString(term);
      if (t && hay.includes(t)) return fam.code.toUpperCase();
    }
  }

  if (opts.allowGar && isStrictAdministrativeHaystack(hay) && !TECHNICAL_WORK_SIGNAL.test(hay)) {
    return "GAR";
  }

  return null;
}

/**
 * Déduit le code famille à partir du contexte ouvrage.
 * Retourne null si aucune règle ne correspond (repli : {@link DEFAULT_BEWORK_FAMILY_CODE}).
 */
/** Alias `code_categorie` (exports ChatGPT) → code famille BeWork. */
const CODE_CATEGORIE_TO_FAMILY: Record<string, string> = {
  espaces_verts: "ESP",
  espace_vert: "ESP",
  espacesvert: "ESP",
  assainissement: "VRD",
  electricite: "ELE",
  plomberie: "PLO",
  terrassement: "TER",
  maconnerie: "MAC",
  couverture: "COU",
  peinture: "PEI",
  echafaudage: "ECH",
  etancheite: "ETA",
  demolition: "DEM",
};

/**
 * Résout un `code_categorie` ou libellé famille export (ex. espaces_verts → ESP).
 */
export function resolveFamilyCodeFromCodeCategorie(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const key = normalizeBeWorkMatchString(raw).replace(/\s+/g, "_");
  const direct = CODE_CATEGORIE_TO_FAMILY[key];
  if (direct && isKnownFamilyCode(direct)) return direct;
  const hinted = suggestFamilyCodeFromWorkItem({ lot: raw.trim(), title: raw.trim(), itemType: "ouvrage_technique" });
  return hinted;
}

export function suggestFamilyCodeFromWorkItem(input: WorkItemFamilySuggestionInput): string | null {
  const itemType = input.itemType?.trim();
  if (itemType === "garantie_assurance") return "GAR";

  const hay = buildWorkItemClassificationHaystack(input);
  const allowGar = itemType !== "ouvrage_technique";
  const matched = matchFamilyFromHaystack(hay, { allowGar });

  if (matched) return matched;

  if (itemType === "prestation_administrative" || itemType === "frais_annexe") {
    if (isStrictAdministrativeHaystack(hay)) return "GAR";
    return "ADM";
  }

  return null;
}

/**
 * Déduit le code famille à partir du lot (et optionnellement du libellé famille texte).
 * @deprecated Préférer {@link suggestFamilyCodeFromWorkItem} avec titre / type d’ouvrage.
 */
export function suggestFamilyCodeFromLot(
  lot: string,
  familyField?: string | null,
  extra?: Pick<WorkItemFamilySuggestionInput, "title" | "itemType" | "subLot">,
): string | null {
  return suggestFamilyCodeFromWorkItem({
    lot,
    family: familyField,
    subLot: extra?.subLot,
    title: extra?.title,
    itemType: extra?.itemType,
  });
}
