/**
 * Lexique codification BeWork : BW-[LOT]-[FAMILLE]-[OUVRAGE]-[VARIANTE]
 */

export type BeWorkLotDefinition = {
  code: string;
  label: string;
  matchTerms: string[];
};

export type BeWorkCodificationFamilyDefinition = {
  code: string;
  label: string;
  matchTerms: string[];
};

export type BeWorkOuvrageTypeDefinition = {
  code: string;
  label: string;
  matchTerms: string[];
  /** Sous-famille par défaut quand ce type est détecté */
  sousFamilleCode?: string;
  sousFamilleNom?: string;
};

export const BEWORK_LOT_LEXICON: BeWorkLotDefinition[] = [
  { code: "GO", label: "Gros œuvre", matchTerms: ["gros œuvre", "gros oeuvre", "g.o.", " go ", "structure", "maçonnerie", "démolition", "fondation"] },
  { code: "SO", label: "Second œuvre", matchTerms: ["second œuvre", "second oeuvre", "cloison", "doublage", "plafond", "carrelage", "peinture intérieure"] },
  { code: "VRD", label: "Voirie réseaux divers", matchTerms: ["vrd", "voirie", "réseaux divers", "assainissement", "caniveau", "bordure", "regard"] },
  { code: "CVC", label: "Chauffage ventilation climatisation", matchTerms: ["cvc", "chauffage", "ventilation", "climatisation", "vmc"] },
  { code: "PLB", label: "Plomberie", matchTerms: ["plomberie", "sanitaire", "eau chaude"] },
  { code: "ELE", label: "Électricité", matchTerms: ["électricité", "electricite", "courant fort", "tableau électrique"] },
  { code: "MEN", label: "Menuiserie", matchTerms: ["menuiserie", "porte", "fenêtre", "fenetre", "huisserie"] },
  { code: "ISO", label: "Isolation", matchTerms: ["isolation", "isolant", "laine de verre", "polystyrène"] },
  { code: "REV", label: "Revêtements", matchTerms: ["revêtement", "revetement", "sol souple", "parquet"] },
  { code: "PEI", label: "Peinture", matchTerms: ["peinture", "enduit décoratif", "laque"] },
  { code: "ETA", label: "Étanchéité", matchTerms: ["étanchéité", "etancheite", "membrane"] },
  { code: "CHA", label: "Charpente / Couverture", matchTerms: ["charpente", "couverture", "tuile", "zinguerie"] },
  { code: "EXT", label: "Espaces extérieurs", matchTerms: ["espace extérieur", "espaces verts", "aménagement extérieur", "plantation"] },
];

/** Familles techniques (segment FAMILLE du code). */
export const BEWORK_CODIFICATION_FAMILIES: BeWorkCodificationFamilyDefinition[] = [
  { code: "DEM", label: "Démolition / Dépose", matchTerms: ["démolition", "demolition", "dépose", "depose", "curage", "évacuation gravats", "evacuation gravats"] },
  { code: "TER", label: "Terrassement", matchTerms: ["terrassement", "décapage", "decapage", "fouille", "tranchée", "tranchee", "remblai", "déblai"] },
  { code: "FON", label: "Fondations / Soubassement", matchTerms: ["fondation", "semelle", "longrine", "radier", "soubassement", "pieux"] },
  { code: "DAL", label: "Dallage / Plancher bas", matchTerms: ["dallage", "plancher bas", "dalle portée"] },
  { code: "MAC", label: "Maçonnerie / Élévation", matchTerms: ["maçonnerie", "maconnerie", "mur porteur", "parpaing", "agglo", "linteau", "chaînage"] },
  { code: "BET", label: "Béton armé", matchTerms: ["béton armé", "beton arme", "poteau ba", "poutre ba"] },
  { code: "ASS", label: "Assainissement", matchTerms: ["assainissement", "égout", "egout", "fosse", "epandage"] },
  { code: "CLO", label: "Cloisons / Doublages", matchTerms: ["cloison", "doublage", "plaque de plâtre", "placo", "ossature métallique"] },
  { code: "PLA", label: "Plafonds", matchTerms: ["plafond", "faux plafond", "dalles de plafond"] },
  { code: "ISO", label: "Isolation", matchTerms: ["isolation", "isolant thermique", "isolant acoustique"] },
  { code: "CAR", label: "Carrelage", matchTerms: ["carrelage", "faïence", "faience", "mosaïque"] },
  { code: "SOL", label: "Sols", matchTerms: ["sol dur", "chape", "ragréage", "dallage intérieur"] },
  { code: "PEI", label: "Peinture", matchTerms: ["peinture", "couche de finition", "laque"] },
  { code: "MEN", label: "Menuiseries", matchTerms: ["menuiserie", "porte", "fenêtre", "fenetre"] },
  { code: "ELE", label: "Électricité", matchTerms: ["électricité", "electricite", "câblage", "tableau"] },
  { code: "PLB", label: "Plomberie", matchTerms: ["plomberie", "tuyauterie", "robinetterie"] },
  { code: "CVC", label: "Chauffage / Ventilation", matchTerms: ["chauffage", "ventilation", "climatisation", "radiateur"] },
];

export const BEWORK_OUVRAGE_TYPES: BeWorkOuvrageTypeDefinition[] = [
  { code: "CLO", label: "Cloison", matchTerms: ["cloison", "cloisons"], sousFamilleCode: "CLO", sousFamilleNom: "Cloisons" },
  { code: "PLA", label: "Plafond", matchTerms: ["plafond", "faux plafond"], sousFamilleCode: "PLA", sousFamilleNom: "Plafonds" },
  { code: "SOL", label: "Sol dur", matchTerms: ["sol dur", "carrelage sol", "dallage intérieur"], sousFamilleCode: "SOL", sousFamilleNom: "Sols" },
  { code: "FAI", label: "Faïence", matchTerms: ["faïence", "faience", "carrelage mural"] },
  { code: "REV", label: "Revêtement", matchTerms: ["revêtement", "revetement", "parquet", "sol souple"] },
  { code: "DAL", label: "Dallage", matchTerms: ["dallage", "dalle béton"] },
  { code: "MUR", label: "Mur", matchTerms: ["mur", "maçonnerie", "parpaing", "agglo"] },
  { code: "CHP", label: "Chape", matchTerms: ["chape", "ragréage"] },
  { code: "PLT", label: "Plinthe", matchTerms: ["plinthe"] },
  { code: "FOU", label: "Fouille", matchTerms: ["fouille", "fouilles"], sousFamilleCode: "FOU", sousFamilleNom: "Fouilles" },
  { code: "TRC", label: "Tranchée", matchTerms: ["tranchée", "tranchee"], sousFamilleCode: "TRC", sousFamilleNom: "Tranchées" },
  { code: "REM", label: "Remblai", matchTerms: ["remblai", "remblais"] },
  { code: "DEC", label: "Décapage", matchTerms: ["décapage", "decapage"] },
  { code: "EVG", label: "Évacuation gravats", matchTerms: ["évacuation gravats", "evacuation gravats", "gravats"] },
  { code: "CAN", label: "Caniveau", matchTerms: ["caniveau", "canalisation"] },
  { code: "BOR", label: "Bordure", matchTerms: ["bordure", "bordures"] },
  { code: "REG", label: "Regard", matchTerms: ["regard", "regards"] },
  { code: "SEM", label: "Semelle", matchTerms: ["semelle", "semelles"] },
  { code: "LON", label: "Longrine", matchTerms: ["longrine"] },
  { code: "RAD", label: "Radier", matchTerms: ["radier"] },
  { code: "SOU", label: "Soubassement", matchTerms: ["soubassement"] },
  { code: "ARM", label: "Armatures", matchTerms: ["armature", "ferraillage", "acier"] },
  { code: "GEN", label: "Ouvrage générique", matchTerms: [] },
];

export const BEWORK_CODE_REGEX = /^BW-[A-Z]{2,3}-[A-Z]{3}-[A-Z]{3}-\d{3}$/;

export function getLotLabel(code: string): string {
  return BEWORK_LOT_LEXICON.find((l) => l.code === code)?.label ?? code;
}

export function getFamilleLabel(code: string): string {
  return BEWORK_CODIFICATION_FAMILIES.find((f) => f.code === code)?.label ?? code;
}

export function getOuvrageLabel(code: string): string {
  return BEWORK_OUVRAGE_TYPES.find((o) => o.code === code)?.label ?? code;
}
