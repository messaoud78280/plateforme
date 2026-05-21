/**
 * Intelligence métier Skill CCTP — vigilance, audit documentaire, interfaces, pédagogie.
 * Logique déterministe (complète le prompt LLM, ne le remplace pas).
 */

import { CCTP_DOCUMENT_CATEGORIES, formatCheckedDocumentsForPrompt } from "@/content/cctp-methodology";
import type { CctpDocumentClassification } from "@/lib/skills/cctp-document-classifier";
import {
  formatClassificationsForPrompt,
  maxVigilanceFromClassifications,
} from "@/lib/skills/cctp-document-classifier";
import type { CctpProjectContext } from "@/lib/skills/cctp-redaction-types";

export type CctpVigilanceLevel = "faible" | "moyen" | "eleve" | "critique";

export type CctpVigilanceAlert = {
  level: CctpVigilanceLevel;
  title: string;
  message: string;
  whyItMatters: string;
  frequentError?: string;
};

export type CctpDocumentAuditFinding = {
  severity: CctpVigilanceLevel;
  category: "piece_manquante" | "incoherence" | "risque_chantier" | "interface" | "dpgf" | "norme" | "contradiction";
  finding: string;
  recommendation: string;
  pedagogicalNote?: string;
};

export type CctpInterfaceAlert = {
  lots: string[];
  topic: string;
  message: string;
  action: string;
};

export type CctpAssistantInsights = {
  globalVigilance: CctpVigilanceLevel;
  vigilanceAlerts: CctpVigilanceAlert[];
  documentAudit: CctpDocumentAuditFinding[];
  interfaceAlerts: CctpInterfaceAlert[];
  checkedDocumentIds?: string[];
  documentClassifications?: CctpDocumentClassification[];
};

export const CCTP_OUVRAGE_STANDARD_SECTIONS = [
  "Objet des travaux",
  "Prestations comprises",
  "Prestations exclues",
  "Matériaux",
  "Mise en œuvre",
  "Références DTU et normes",
  "Prescriptions techniques",
  "Tolérances",
  "Réservations",
  "Interfaces inter-lots",
  "Points de contrôle",
  "Nettoyage chantier",
  "Essais et validations",
  "DOE et documents finaux",
] as const;

const VIGILANCE_RANK: Record<CctpVigilanceLevel, number> = {
  faible: 0,
  moyen: 1,
  eleve: 2,
  critique: 3,
};

function maxVigilance(a: CctpVigilanceLevel, b: CctpVigilanceLevel): CctpVigilanceLevel {
  return VIGILANCE_RANK[a] >= VIGILANCE_RANK[b] ? a : b;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

type LotProfile = {
  keywords: RegExp;
  baseLevel: CctpVigilanceLevel;
  triggers: { pattern: RegExp; level: CctpVigilanceLevel; title: string; message: string; why: string; error?: string }[];
};

const LOT_PROFILES: LotProfile[] = [
  {
    keywords: /gros.?oeuvre|go\b|maconnerie|fondation|dallage|structure|beton structure/,
    baseLevel: "eleve",
    triggers: [
      {
        pattern: /etude de sol|g2|fondation|semelle|radier/,
        level: "eleve",
        title: "Fondations et sol",
        message: "Absence d'étude G2 ou de repères géotechniques détectée dans le dossier saisi.",
        why: "Impact direct sur fondations, dallages et reprises en sous-œuvre — risque de tassement ou surcoût.",
        error: "Lancer un GO sans étude de sol validée sur rénovation ou sol incertain.",
      },
      {
        pattern: /reservation|percement/,
        level: "moyen",
        title: "Réservations structure",
        message: "Réservations réseaux ou menuiseries à cadrer avant coulage.",
        why: "Les percements structurels après exécution coûtent cher et fragilisent l'ouvrage.",
        error: "Oublier le plan de réservations avant coulage des dalles ou voiles.",
      },
    ],
  },
  {
    keywords: /etancheite|etanch|toiture terrasse|membrane/,
    baseLevel: "eleve",
    triggers: [
      {
        pattern: /relev|acrot|garde.corps|evacuation/,
        level: "critique",
        title: "Étanchéité et relevés",
        message: "Points singuliers (relevés, évacuations, traversées) à traiter impérativement.",
        why: "90 % des sinistres d'étanchéité viennent des détails, pas de la membrane plane.",
        error: "CCTP qui cite la membrane sans détailler relevés et traitements d'angles.",
      },
    ],
  },
  {
    keywords: /vrd|assainissement|terrassement|reseau enterr|canalisation|regard/,
    baseLevel: "eleve",
    triggers: [
      {
        pattern: /reseau|canalisation|regard|gaine|fouille/,
        level: "eleve",
        title: "VRD et réseaux enterrés",
        message: "Coordination réseaux enterrés et repérage avant remblaiement à valider.",
        why: "Conflits avec autres lots, reprises de tranchées et essais non réalisés = litiges fréquents.",
        error: "Oublier les essais d'étanchéité ou le géoréférencement des réseaux neufs.",
      },
    ],
  },
  {
    keywords: /plomberie|cvc|sanitaire|ecs|evacuation/,
    baseLevel: "moyen",
    triggers: [
      {
        pattern: /evacuation|wc|douche|baignoire/,
        level: "moyen",
        title: "Évacuations et pentes",
        message: "Pentes, diamètres et matériaux d'évacuation à expliciter dans le lot.",
        why: "Un lot plomberie sans évacuations chiffrables génère des plus-values en cours de chantier.",
        error: "CCTP plomberie qui ne cite pas les réseaux d'évacuation ni les essais.",
      },
    ],
  },
  {
    keywords: /electricite|elec\b|cfo|cfa|tableau/,
    baseLevel: "moyen",
    triggers: [
      {
        pattern: /tableau|gaine|cheminement|incendie/,
        level: "moyen",
        title: "Cheminements et réservations",
        message: "Réservations et cheminements à croiser avec GO et cloisons.",
        why: "Reprises de gaines après cloisons = surcoût et délais.",
      },
    ],
  },
  {
    keywords: /menuiserie|fenetre|porte|menuiseries exterieures/,
    baseLevel: "moyen",
    triggers: [
      {
        pattern: /menuiserie|fenetre|porte|store/,
        level: "moyen",
        title: "Menuiseries et étanchéité",
        message: "Interfaces menuiseries / étanchéité / isolation à verrouiller.",
        why: "Infiltrations et déperditions thermiques si le calfeutrement n'est pas attribué.",
      },
    ],
  },
  {
    keywords: /carrelage|faience|revetement sol|dallage interieur/,
    baseLevel: "moyen",
    triggers: [
      {
        pattern: /carrelage|faience|joint|colle/,
        level: "moyen",
        title: "Supports et planéité",
        message: "État des supports, délai de séchage et planéité à prescrire.",
        why: "Pose sur support non conforme = désordres et reprises.",
      },
    ],
  },
];

const INTERFACE_RULES: {
  pattern: RegExp;
  lots: string[];
  topic: string;
  message: string;
  action: string;
}[] = [
  {
    pattern: /plomberie|sanitaire|evacuation/,
    lots: ["Plomberie", "Gros œuvre", "Second œuvre"],
    topic: "Réservations et percements",
    message: "Coordination plomberie / GO : réservations, percements, rebouchements.",
    action: "Valider le plan de réservations avant coulage et la matrice lot/responsable.",
  },
  {
    pattern: /menuiserie|fenetre|porte|menuiseries exterieures/,
    lots: ["Menuiseries", "Étanchéité", "Gros œuvre"],
    topic: "Étanchéité et calfeutrement",
    message: "Interfaces menuiseries / étanchéité / finitions.",
    action: "Préciser qui réalise relevés, calfeutrements et habillages.",
  },
  {
    pattern: /electricite|elec\b|tableau/,
    lots: ["Électricité", "Gros œuvre", "Plâtrerie"],
    topic: "Gaines et réservations",
    message: "Cheminements et réservations électriques vs structure et cloisons.",
    action: "Croiser plans électriques et plans de réservations GO.",
  },
  {
    pattern: /vrd|assainissement|terrassement/,
    lots: ["VRD", "Gros œuvre", "Fluides"],
    topic: "Réseaux enterrés",
    message: "VRD et réseaux enterrés : tranchées, remblais, essais.",
    action: "Coordination avant finition espaces verts ou voirie.",
  },
  {
    pattern: /carrelage|faience|peinture|platre|placo/,
    lots: ["Second œuvre", "Lots supports"],
    topic: "Supports finitions",
    message: "Enchaînement supports / enduits / finitions.",
    action: "Définir qui prépare le support et qui contrôle la planéité.",
  },
];

function inferLotCategory(lot: string, projectType: string): LotProfile | null {
  const n = normalize(`${lot} ${projectType}`);
  for (const profile of LOT_PROFILES) {
    if (profile.keywords.test(n)) return profile;
  }
  return null;
}

export function computeVigilanceAlerts(context: CctpProjectContext): CctpVigilanceAlert[] {
  const n = normalize(
    `${context.lot} ${context.projectType} ${context.constraints} ${context.availableDocuments}`,
  );
  const alerts: CctpVigilanceAlert[] = [];
  const profile = inferLotCategory(context.lot, context.projectType);

  if (profile) {
    for (const t of profile.triggers) {
      if (t.pattern.test(n)) {
        alerts.push({
          level: t.level,
          title: t.title,
          message: t.message,
          whyItMatters: t.why,
          frequentError: t.error,
        });
      }
    }
    if (
      profile.keywords.test(n) &&
      /gros.?oeuvre|fondation|dallage|structure/.test(n) &&
      !/etude de sol|g2|geotechnique/.test(n)
    ) {
      const g2 = profile.triggers.find((t) => t.title === "Fondations et sol");
      if (g2 && !alerts.some((a) => a.title === g2.title)) {
        alerts.push({
          level: g2.level,
          title: g2.title,
          message: g2.message,
          whyItMatters: g2.why,
          frequentError: g2.error,
        });
      }
    }
  }

  if (/renovation|rehabilitation|existant|curage/.test(n) && !/diagnostic|amiante|plomb|structure/.test(n)) {
    alerts.push({
      level: "eleve",
      title: "Rénovation — diagnostics",
      message: "Projet en rénovation : vérifier la prise en compte des diagnostics (amiante, plomb, structure, humidité).",
      whyItMatters: "Les diagnostics conditionnent le phasage, les protections et le périmètre réel des travaux.",
      frequentError: "CCTP rénovation sans référence aux rapports de diagnostics.",
    });
  }

  if (/securite|ppsps|coactivite|site occupe/.test(n)) {
    alerts.push({
      level: "moyen",
      title: "Sécurité et coactivité",
      message: "Contraintes sécurité / site occupé : croiser avec PPSPS et planning.",
      whyItMatters: "Impact sur phasage, protections et responsabilités entre entreprises.",
    });
  }

  if (!context.lot.trim()) {
    alerts.push({
      level: "moyen",
      title: "Lot non précisé",
      message: "Précisez le lot concerné pour calibrer vigilance, interfaces et structure CCTP.",
      whyItMatters: "Chaque lot a des risques et des prescriptions différents.",
    });
  }

  return dedupeAlerts(alerts);
}

function dedupeAlerts(alerts: CctpVigilanceAlert[]): CctpVigilanceAlert[] {
  const seen = new Set<string>();
  return alerts.filter((a) => {
    const k = `${a.title}:${a.message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function computeInterfaceAlerts(context: CctpProjectContext): CctpInterfaceAlert[] {
  const n = normalize(`${context.lot} ${context.projectType} ${context.constraints}`);
  const alerts: CctpInterfaceAlert[] = [];
  for (const rule of INTERFACE_RULES) {
    if (rule.pattern.test(n)) {
      alerts.push({
        lots: rule.lots,
        topic: rule.topic,
        message: rule.message,
        action: rule.action,
      });
    }
  }
  if (alerts.length === 0 && context.lot.trim()) {
    alerts.push({
      lots: ["Lot courant", "Lots limitrophes"],
      topic: "Coordination inter-lots",
      message: "Coordination inter-lots à valider avant exécution.",
      action: "Lister réservations, rebouchages et attentes avec le MOE.",
    });
  }
  return alerts;
}

function documentMentioned(n: string, item: string): boolean {
  const itemN = normalize(item);
  return n.includes(itemN) || itemN.split(" ").some((w) => w.length > 4 && n.includes(w));
}

export function runDocumentAudit(
  context: CctpProjectContext,
  extractedFromFiles?: string,
  checkedDocumentIds?: string[],
): CctpDocumentAuditFinding[] {
  const findings: CctpDocumentAuditFinding[] = [];
  const n = normalize(
    `${context.availableDocuments} ${extractedFromFiles ?? ""} ${context.constraints} ${context.projectType}`,
  );
  const isRenovation = /renovation|rehabilitation|existant/.test(n);
  const isStructure = /gros.?oeuvre|go\b|fondation|structure|maconnerie/.test(normalize(context.lot));

  const requiredPieces: { label: string; pattern: RegExp; renov?: boolean; structure?: boolean }[] = [
    { label: "Plans architecte à jour", pattern: /plan.*architecte|plan.*masse|plan.*facade/ },
    { label: "Plans techniques / structure", pattern: /plan.*technique|plan.*structure|etude structure/, structure: true },
    { label: "Étude de sol G2", pattern: /etude de sol|g2|geotechnique/, structure: true },
    { label: "DPGF ou BPU", pattern: /dpgf|bpu|dqe|devis/ },
    { label: "CCAP / pièces marché", pattern: /ccap|reglement|acte d.engagement/ },
    { label: "Diagnostics amiante / plomb", pattern: /amiante|plomb|diagnostic/, renov: true },
  ];

  for (const piece of requiredPieces) {
    if (piece.renov && !isRenovation) continue;
    if (piece.structure && !isStructure) continue;
    if (!piece.pattern.test(n)) {
      findings.push({
        severity: piece.label.includes("G2") ? "eleve" : "moyen",
        category: "piece_manquante",
        finding: `Pièce non signalée : ${piece.label}.`,
        recommendation: `Demander ou intégrer ${piece.label} avant diffusion du CCTP.`,
        pedagogicalNote:
          piece.label.includes("G2")
            ? "Sans étude de sol, les fondations et dallages restent une hypothèse contractuelle risquée."
            : undefined,
      });
    }
  }

  if (/plomberie|sanitaire/.test(normalize(context.lot)) && !/evacuation|wc|douche|reseau/.test(n)) {
    findings.push({
      severity: "eleve",
      category: "risque_chantier",
      finding: "Lot fluides sans mention claire des évacuations ou réseaux.",
      recommendation: "Compléter les articles évacuations, pentes, matériaux et essais.",
      pedagogicalNote: "Un CCTP plomberie incomplet génère des litiges de plus-value systématiques.",
    });
  }

  if (/dpgf|bpu|devis/.test(n) && /cctp/.test(n) && /incoher|ecart|manque.*ligne/.test(n)) {
    findings.push({
      severity: "eleve",
      category: "dpgf",
      finding: "Signal d'écart entre CCTP et pièce de prix.",
      recommendation: "Tableau de cohérence ouvrage ↔ ligne DPGF avant validation.",
    });
  }

  if (checkedDocumentIds?.length) {
    const missingCritical: string[] = [];
    for (const cat of CCTP_DOCUMENT_CATEGORIES) {
      for (const item of cat.items) {
        const id = `${cat.id}:${item}`;
        const critical =
          /etude de sol|structure|plan.*architecte|dpgf|diagnostic|amiante/.test(normalize(item));
        if (critical && !checkedDocumentIds.includes(id) && !documentMentioned(n, item)) {
          missingCritical.push(item);
        }
      }
    }
    if (missingCritical.length > 3) {
      findings.push({
        severity: "moyen",
        category: "piece_manquante",
        finding: `${missingCritical.length} pièces critiques non cochées dans la checklist.`,
        recommendation: "Compléter le dossier documentaire ou marquer « à demander au MOA/MOE ».",
      });
    }
  }

  if (!extractedFromFiles?.trim() && !context.availableDocuments.trim()) {
    findings.push({
      severity: "moyen",
      category: "piece_manquante",
      finding: "Aucun document importé ni liste de pièces disponibles.",
      recommendation: "Importer CCTP existant, plans ou DPGF — ou renseigner la checklist des pièces.",
      pedagogicalNote: "L'audit documentaire est limité sans source : les alertes restent indicatives.",
    });
  }

  return findings.slice(0, 12);
}

function auditFromClassifications(classifications: CctpDocumentClassification[]): CctpDocumentAuditFinding[] {
  const findings: CctpDocumentAuditFinding[] = [];
  const types = new Set(classifications.map((c) => c.documentType));

  if (types.has("ccap") && types.has("cctp")) {
    findings.push({
      severity: "moyen",
      category: "incoherence",
      finding: "CCAP et CCTP détectés — vérifier la hiérarchie des pièces et les dérogations.",
      recommendation: "Croiser délais, pénalités et DOE CCAP avec prescriptions CCTP.",
      pedagogicalNote: "Le CCAP prime sur le CCTP en cas de contradiction administrative.",
    });
  }
  if ((types.has("devis") || types.has("dpgf")) && !types.has("cctp")) {
    findings.push({
      severity: "eleve",
      category: "dpgf",
      finding: "Pièce de prix sans CCTP joint — cohérence ouvrages non vérifiable automatiquement.",
      recommendation: "Joindre le CCTP du lot ou lancer le mode Cohérence DPGF.",
    });
  }
  if (types.has("fiche_technique") && !types.has("cctp") && !types.has("notice_pose")) {
    findings.push({
      severity: "moyen",
      category: "risque_chantier",
      finding: "Fiche technique sans CCTP associé dans les imports.",
      recommendation: "Vérifier que le produit FT est bien celui prescrit au CCTP.",
    });
  }
  for (const c of classifications.filter((x) => x.documentType === "inconnu")) {
    findings.push({
      severity: "faible",
      category: "piece_manquante",
      finding: `Type de pièce non identifié : ${c.fileName}.`,
      recommendation: "Renommer le fichier (CCAP, CCTP, devis, DOE…) ou préciser la nature dans la demande.",
    });
  }
  return findings;
}

export function computeCctpAssistantInsights(
  context: CctpProjectContext,
  options?: {
    extractedFromFiles?: string;
    checkedDocumentIds?: string[];
    documentClassifications?: CctpDocumentClassification[];
  },
): CctpAssistantInsights {
  const vigilanceAlerts = computeVigilanceAlerts(context);
  let documentAudit = runDocumentAudit(context, options?.extractedFromFiles, options?.checkedDocumentIds);
  const interfaceAlerts = computeInterfaceAlerts(context);
  const documentClassifications = options?.documentClassifications ?? [];

  if (documentClassifications.length) {
    documentAudit = [...auditFromClassifications(documentClassifications), ...documentAudit].slice(0, 14);
    documentAudit = documentAudit.filter((f) => {
      if (f.finding.includes("CCAP / pièces marché") && documentClassifications.some((c) => c.documentType === "ccap")) {
        return false;
      }
      if (
        f.finding.includes("DPGF ou BPU") &&
        documentClassifications.some((c) => c.documentType === "dpgf" || c.documentType === "devis")
      ) {
        return false;
      }
      return true;
    });
  }

  let globalVigilance: CctpVigilanceLevel = "faible";
  const profile = inferLotCategory(context.lot, context.projectType);
  if (profile) globalVigilance = profile.baseLevel;

  for (const a of [...vigilanceAlerts, ...documentAudit.map((d) => ({ level: d.severity }))]) {
    globalVigilance = maxVigilance(globalVigilance, "level" in a ? a.level : "moyen");
  }
  if (documentClassifications.length) {
    globalVigilance = maxVigilance(globalVigilance, maxVigilanceFromClassifications(documentClassifications));
  }

  return {
    globalVigilance,
    vigilanceAlerts,
    documentAudit,
    interfaceAlerts,
    checkedDocumentIds: options?.checkedDocumentIds,
    documentClassifications: documentClassifications.length ? documentClassifications : undefined,
  };
}

export function formatInsightsMarkdown(insights: CctpAssistantInsights): string {
  const levelLabel: Record<CctpVigilanceLevel, string> = {
    faible: "Faible",
    moyen: "Moyen",
    eleve: "Élevé",
    critique: "Critique",
  };

  const lines: string[] = [
    "## Pilotage chantier BeWork (avant rédaction)",
    "",
    `**Niveau de vigilance global : ${levelLabel[insights.globalVigilance]}**`,
    "",
  ];

  if (insights.vigilanceAlerts.length) {
    lines.push("### Points de vigilance", "");
    for (const a of insights.vigilanceAlerts) {
      lines.push(`- **[${levelLabel[a.level]}] ${a.title}** — ${a.message}`);
      lines.push(`  - *Pourquoi :* ${a.whyItMatters}`);
      if (a.frequentError) lines.push(`  - *Erreur fréquente :* ${a.frequentError}`);
    }
    lines.push("");
  }

  if (insights.documentAudit.length) {
    lines.push("### Audit documentaire", "", "| Niveau | Constat | Action |", "|--------|---------|--------|");
    for (const f of insights.documentAudit) {
      lines.push(`| ${levelLabel[f.severity]} | ${f.finding} | ${f.recommendation} |`);
    }
    lines.push("");
  }

  if (insights.interfaceAlerts.length) {
    lines.push("### Interfaces inter-lots", "");
    for (const i of insights.interfaceAlerts) {
      lines.push(`- **${i.topic}** (${i.lots.join(" · ")}) — ${i.message}`);
      lines.push(`  - *À faire :* ${i.action}`);
    }
    lines.push("");
  }

  if (insights.documentClassifications?.length) {
    const vigLabel = levelLabel;
    lines.push("### Pièces classées (détection automatique)", "");
    for (const c of insights.documentClassifications) {
      lines.push(
        `- **${c.fileName}** — \`${c.badge}\` · vigilance **${vigLabel[c.vigilance]}** · ${c.analysisLabel}`,
      );
    }
    lines.push("");
  }

  lines.push(
    "> Ces éléments complètent la rédaction CCTP. Validez avec le MOE avant engagement contractuel.",
  );
  return lines.join("\n");
}

/** Bloc injecté dans le prompt utilisateur (LLM). */
export function formatIntelligenceBlockForPrompt(insights: CctpAssistantInsights): string {
  const classificationBlock = insights.documentClassifications?.length
    ? `\n\n${formatClassificationsForPrompt(insights.documentClassifications)}`
    : "";
  return [
    "## Analyse métier BeWork (vigilance + audit + interfaces)",
    "Intègre ces éléments en tête de réponse (tableaux + alertes), puis produis le livrable demandé.",
    "Ton : conducteur de travaux / économiste — jamais startup SaaS.",
    "Applique le **type d'analyse** indiqué pour chaque pièce classée.",
    "",
    formatInsightsMarkdown(insights),
    classificationBlock,
  ].join("\n");
}

export function formatCheckedIdsForPrompt(checkedDocumentIds: string[]): string {
  if (!checkedDocumentIds.length) return "";
  return formatCheckedDocumentsForPrompt(checkedDocumentIds);
}
