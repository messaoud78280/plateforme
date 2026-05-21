/**
 * Classification automatique des pièces métier — Skill CCTP (P0).
 * Détection : nom de fichier, mots-clés, extrait initial, structure / catégorie fichier.
 */

import { getCctpFileCategory, type CctpFileCategory } from "@/lib/skills/cctp-upload-config";
import type { CctpVigilanceLevel } from "@/lib/skills/cctp-assistant-intelligence";

export type CctpMetierDocumentType =
  | "ccap"
  | "ae"
  | "cctp"
  | "dpgf"
  | "devis"
  | "doe"
  | "fiche_technique"
  | "notice_pose"
  | "plan"
  | "inconnu";

export type CctpDocumentAnalysisType =
  | "analyse_contractuelle"
  | "analyse_engagement"
  | "analyse_cctp"
  | "coherence_prix"
  | "analyse_doe"
  | "analyse_produit"
  | "analyse_pose"
  | "analyse_graphique"
  | "analyse_generique";

export type CctpClassificationConfidence = "haute" | "moyenne" | "faible";

export type CctpDocumentClassification = {
  fileName: string;
  documentType: CctpMetierDocumentType;
  /** Libellé court pour badge UI */
  badge: string;
  vigilance: CctpVigilanceLevel;
  analysisType: CctpDocumentAnalysisType;
  /** Libellé lisible du type d'analyse */
  analysisLabel: string;
  confidence: CctpClassificationConfidence;
  /** Consigne d'analyse injectée au prompt */
  analysisHint: string;
  scores: Partial<Record<CctpMetierDocumentType, number>>;
};

const EXTRACT_HEAD_CHARS = 12_000;

const TYPE_META: Record<
  CctpMetierDocumentType,
  {
    badge: string;
    vigilance: CctpVigilanceLevel;
    analysisType: CctpDocumentAnalysisType;
    analysisLabel: string;
    analysisHint: string;
  }
> = {
  ccap: {
    badge: "CCAP",
    vigilance: "eleve",
    analysisType: "analyse_contractuelle",
    analysisLabel: "Analyse contractuelle",
    analysisHint:
      "Repérer délais, pénalités, DOE art. 40, insertion, paiement (Ediflex), garanties — impacts chantier et litiges.",
  },
  ae: {
    badge: "AE",
    vigilance: "eleve",
    analysisType: "analyse_engagement",
    analysisLabel: "Analyse acte d'engagement",
    analysisHint:
      "Repérer lot, montants, index BT/TP, sous-traitance DC4, pièces contractuelles, délais — cohérence avec le DCE.",
  },
  cctp: {
    badge: "CCTP",
    vigilance: "moyen",
    analysisType: "analyse_cctp",
    analysisLabel: "Analyse CCTP",
    analysisHint:
      "Repérer ouvrages, prestations comprises/exclues, interfaces, réservations, DTU cités — chiffrabilité et exécution.",
  },
  dpgf: {
    badge: "DPGF",
    vigilance: "moyen",
    analysisType: "coherence_prix",
    analysisLabel: "Cohérence prix",
    analysisHint: "Croiser lignes DPGF/BPU avec ouvrages CCTP — oublis, doublons, unités.",
  },
  devis: {
    badge: "Devis",
    vigilance: "moyen",
    analysisType: "coherence_prix",
    analysisLabel: "Cohérence devis",
    analysisHint: "Croiser lignes devis avec CCTP — produits, quantités, sujétions, exclusions.",
  },
  doe: {
    badge: "DOE",
    vigilance: "moyen",
    analysisType: "analyse_doe",
    analysisLabel: "Analyse DOE",
    analysisHint:
      "Repérer convention de nommage, formats PDF/DWG, listes par lot, délais de remise — risque réception.",
  },
  fiche_technique: {
    badge: "Fiche tech.",
    vigilance: "moyen",
    analysisType: "analyse_produit",
    analysisLabel: "Analyse produit",
    analysisHint: "Produit, performances, compatibilité support, accessoires obligatoires vs CCTP.",
  },
  notice_pose: {
    badge: "Notice pose",
    vigilance: "moyen",
    analysisType: "analyse_pose",
    analysisLabel: "Analyse mise en œuvre",
    analysisHint: "Conditions de pose, jeux, fixations, températures — écart avec CCTP et FT.",
  },
  plan: {
    badge: "Plan",
    vigilance: "faible",
    analysisType: "analyse_graphique",
    analysisLabel: "Analyse graphique",
    analysisHint:
      "Plans : réservations, niveaux, coupes — à recouper avec CCTP ; préciser si texte non extractible.",
  },
  inconnu: {
    badge: "Pièce",
    vigilance: "faible",
    analysisType: "analyse_generique",
    analysisLabel: "Analyse document",
    analysisHint: "Identifier la nature de la pièce et son usage dans le dossier marché.",
  },
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

function headExtract(text: string): string {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= EXTRACT_HEAD_CHARS) return t;
  return t.slice(0, EXTRACT_HEAD_CHARS);
}

type ScoreMap = Record<CctpMetierDocumentType, number>;

function emptyScores(): ScoreMap {
  return {
    ccap: 0,
    ae: 0,
    cctp: 0,
    dpgf: 0,
    devis: 0,
    doe: 0,
    fiche_technique: 0,
    notice_pose: 0,
    plan: 0,
    inconnu: 0,
  };
}

function scoreFileName(fileName: string): ScoreMap {
  const n = normalize(fileName);
  const s = emptyScores();

  if (/\bccap\b|cahier.*clauses.*administratives|clauses administratives particulieres/.test(n)) s.ccap += 45;
  if (/\bae\b|acte.*engagement|engagement.*lot/.test(n)) s.ae += 40;
  if (/\bcctp\b|cahier.*clauses.*techniques|clauses techniques particulieres/.test(n)) s.cctp += 45;
  if (/\bdpgf\b|\bbpu\b|\bdqe\b|decomposition.*prix|bordereau.*prix/.test(n)) s.dpgf += 42;
  if (/\bdevis\b|offre.*financiere|proposition.*prix/.test(n)) s.devis += 40;
  if (/\bdoe\b|dossier.*ouvrages.*execut|convention.*doe|nommage.*doe/.test(n)) s.doe += 42;
  if (/fiche.?tech|fiche-tech|\bft\b|technical.?sheet|cedral|product.?sheet/.test(n)) s.fiche_technique += 38;
  if (/notice.?pose|guide.?pose|mode.?emploi|pose.*guide|installation.*guide/.test(n)) s.notice_pose += 38;
  if (
    /\bplan\b|masse|facade|coupe|niveau|repere|dwg|dxf|dgn|ifc|elevation|implantation/.test(n)
  ) {
    s.plan += 35;
  }

  if (/ediflex|convention.*interchange/.test(n)) s.ccap += 15;
  if (/indices?\s*bt|annexe.*bt/.test(n)) s.ae += 25;
  if (/lot\s*\d+|charpente|couverture|bardage|plomberie|electricite/.test(n) && /\bdevis\b/.test(n)) {
    s.devis += 12;
  }

  return s;
}

function scoreContent(text: string): ScoreMap {
  const t = normalize(headExtract(text));
  const s = emptyScores();
  if (!t) return s;

  if (/cahier des clauses administratives|\bccap\b|article \d+.*champ d.application/.test(t)) s.ccap += 35;
  if (/ccag|maitre de l.ouvrage|pouvoir adjudicateur|penalite|retenue de garantie/.test(t)) s.ccap += 12;
  if (/table des matieres/.test(t) && /article \d+/.test(t) && /ccap|clauses administratives/.test(t)) s.ccap += 15;

  if (/acte d.engagement|\bae\b.*lot|je m.engage|montant ht|index bt|sous.traitance/.test(t)) s.ae += 35;
  if (/pieces constitutives du marche|notification du marche/.test(t)) s.ae += 10;

  if (
    /cahier des clauses techniques|\bcctp\b|l.entreprise devra|prestations comprises|prestations exclues|objet des travaux/.test(
      t,
    )
  ) {
    s.cctp += 35;
  }
  if (/mise en oeuvre|references? dtu|interfaces inter.lots/.test(t)) s.cctp += 8;

  if (/decomposition du prix global|\bdpgf\b|\bbpu\b|prix unitaire.*quantite|bordereau/.test(t)) s.dpgf += 30;
  if (/\t.*\t/.test(t) && /lot|ouvrage|designation/.test(t)) s.dpgf += 8;

  if (/\bdevis\b|total ht|total ttc|montant ht|offre financiere/.test(t)) s.devis += 28;
  if (/tva.*20|prix unitaire/.test(t)) s.devis += 6;

  if (/convention de nommage.*doe|\bdoe\b|dossier des ouvrages executes|dossier racine.*doe/.test(t)) s.doe += 38;
  if (/fichiers obligatoires.*pdf|clef usb|ged/.test(t) && /doe/.test(t)) s.doe += 10;

  if (/fiche technique|caracteristiques techniques|reference produit|fabricant/.test(t)) s.fiche_technique += 28;
  if (/avis technique|cstb|acotherm|certificat/.test(t)) s.fiche_technique += 6;

  if (/notice de pose|mode de pose|conditions de pose|guide de pose|mise en oeuvre du produit/.test(t)) {
    s.notice_pose += 32;
  }

  if (/plan d.architecture|echelle|coupe aa|facade nord|repere|niveau rdc/.test(t)) s.plan += 15;

  return s;
}

function scoreStructure(text: string, fileCategory: CctpFileCategory): ScoreMap {
  const s = emptyScores();
  const t = headExtract(text);

  if (fileCategory === "cad" || fileCategory === "image") {
    s.plan += 50;
    return s;
  }

  if (fileCategory === "spreadsheet") {
    s.dpgf += 20;
    s.devis += 15;
    if (/devis/i.test(t)) s.devis += 10;
    if (/dpgf|bpu|dqe/i.test(t)) s.dpgf += 10;
  }

  if (!t) return s;

  const articleCount = (t.match(/article \d+/g) ?? []).length;
  if (articleCount >= 5 && /ccap|clauses administratives|maitre de l.ouvrage/.test(normalize(t))) {
    s.ccap += 18;
  }

  if (/☐|☒|cliquez pour completer|signature electronique/.test(t)) s.ae += 15;

  if ((t.match(/###|prestations comprises|prestations exclues/gi) ?? []).length >= 2) s.cctp += 10;

  if (t.includes("fichier transmis") || t.includes("extraction impossible") || t.includes("plan raster")) {
    s.plan += 12;
    s.inconnu += 5;
  }

  return s;
}

function pickWinner(scores: ScoreMap): { type: CctpMetierDocumentType; top: number; second: number } {
  const entries = (Object.entries(scores) as [CctpMetierDocumentType, number][]).filter(([k]) => k !== "inconnu");
  entries.sort((a, b) => b[1] - a[1]);
  const [winner, top] = entries[0] ?? ["inconnu", 0];
  const second = entries[1]?.[1] ?? 0;
  if (top < 12) return { type: "inconnu", top, second };
  return { type: winner, top, second };
}

function confidenceFromScores(top: number, second: number): CctpClassificationConfidence {
  if (top >= 35 && top - second >= 15) return "haute";
  if (top >= 20 && top - second >= 8) return "moyenne";
  return "faible";
}

/** Classification d'une pièce importée. */
export function classifyCctpDocument(input: {
  fileName: string;
  mimeType?: string | null;
  extractedText?: string | null;
  fileCategory?: CctpFileCategory;
  /** Fichier déposé comme « CCTP existant » */
  isPrimaryCctpSlot?: boolean;
}): CctpDocumentClassification {
  const fileCategory =
    input.fileCategory ?? getCctpFileCategory(input.fileName, input.mimeType ?? "");

  const scores = emptyScores();
  const fn = scoreFileName(input.fileName);
  const ct = scoreContent(input.extractedText ?? "");
  const st = scoreStructure(input.extractedText ?? "", fileCategory);

  for (const k of Object.keys(scores) as CctpMetierDocumentType[]) {
    scores[k] = fn[k] + ct[k] + st[k];
  }

  if (input.isPrimaryCctpSlot) scores.cctp += 18;

  const { type, top, second } = pickWinner(scores);
  const confidence = confidenceFromScores(top, second);
  const meta = TYPE_META[type];

  return {
    fileName: input.fileName,
    documentType: type,
    badge: meta.badge,
    vigilance: meta.vigilance,
    analysisType: meta.analysisType,
    analysisLabel: meta.analysisLabel,
    confidence,
    analysisHint: meta.analysisHint,
    scores: Object.fromEntries(
      (Object.entries(scores) as [CctpMetierDocumentType, number][])
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4),
    ),
  };
}

export function classifyCctpDocuments(
  files: {
    fileName: string;
    mimeType?: string | null;
    extractedText?: string | null;
    fileCategory?: CctpFileCategory;
    isPrimaryCctpSlot?: boolean;
  }[],
): CctpDocumentClassification[] {
  return files.map((f) => classifyCctpDocument(f));
}

/** Vigilance globale documents : max des pièces classées. */
export function maxVigilanceFromClassifications(
  classifications: CctpDocumentClassification[],
): CctpVigilanceLevel {
  const rank: Record<CctpVigilanceLevel, number> = { faible: 0, moyen: 1, eleve: 2, critique: 3 };
  let max: CctpVigilanceLevel = "faible";
  for (const c of classifications) {
    if (rank[c.vigilance] > rank[max]) max = c.vigilance;
  }
  return max;
}

export function formatClassificationsForPrompt(classifications: CctpDocumentClassification[]): string {
  if (!classifications.length) return "";
  const lines = [
    "## Pièces classées automatiquement (BeWork)",
    "",
    "| Fichier | Type | Vigilance | Analyse à mener |",
    "|---------|------|-----------|-----------------|",
  ];
  const vigLabel: Record<CctpVigilanceLevel, string> = {
    faible: "Faible",
    moyen: "Moyen",
    eleve: "Élevé",
    critique: "Critique",
  };
  for (const c of classifications) {
    lines.push(
      `| ${c.fileName} | **${c.badge}** (${c.confidence}) | ${vigLabel[c.vigilance]} | ${c.analysisLabel} |`,
    );
  }
  lines.push("", "### Consignes par pièce", "");
  for (const c of classifications) {
    lines.push(`- **${c.badge} — ${c.fileName}** : ${c.analysisHint}`);
  }
  return lines.join("\n");
}

export function formatClassificationsMarkdown(classifications: CctpDocumentClassification[]): string {
  if (!classifications.length) return "";
  const vigLabel: Record<CctpVigilanceLevel, string> = {
    faible: "Faible",
    moyen: "Moyen",
    eleve: "Élevé",
    critique: "Critique",
  };
  const lines = ["### Pièces détectées", ""];
  for (const c of classifications) {
    lines.push(
      `- **${c.fileName}** — badge \`${c.badge}\` · vigilance **${vigLabel[c.vigilance]}** · ${c.analysisLabel} (confiance ${c.confidence})`,
    );
  }
  return lines.join("\n");
}

/** Libellé bloc extrait (combineExtractedBlocks). */
export function classifiedExtractLabel(classification: CctpDocumentClassification, fallback: string): string {
  return `[${classification.badge}] ${fallback}`;
}
