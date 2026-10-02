/**
 * Chantier → Métré global → Planning global.
 * Les ProjectScope restent des phases / catégories, pas des plannings séparés.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { commitPrepSchedule } from "@/lib/preparation/schedule/transfer";
import type { StoredProvenance } from "@/lib/preparation/types";

const GLOBAL_STUDY_MARKER = "bework_global_metre_v1";

export type GlobalPrepQuantity = {
  key: string;
  label: string;
  value: number;
  unit: string;
  provenance: StoredProvenance;
  /** Libellé métier : mesuré | calculé | projeté | estimé | à confirmer */
  originLabel: string;
  sourceRef: string;
  note: string | null;
  zone: "CUISINE" | "SDB" | "CHANTIER";
};

export type GlobalPrepPreview = {
  projectId: string;
  projectTitle: string;
  quoteId: string;
  quoteNumber: string;
  hasVisit: boolean;
  hasStudy: boolean;
  hasPlan: boolean;
  existingStudyId: string | null;
  existingPlanId: string | null;
  quantities: GlobalPrepQuantity[];
  quoteLineCount: number;
  proposedTaskCount: number;
  warnings: string[];
  caseLabel: "A" | "B" | "C" | "D";
};

export type GlobalPrepResult = {
  studyId: string;
  studyCreated: boolean;
  planId: string;
  planCreated: boolean;
  planHref: string;
  taskCount: number;
  dependencyCount: number;
  quantities: GlobalPrepQuantity[];
  durations: Array<{ name: string; days: number; mode: string }>;
  hypotheses: string[];
  quoteTotalSellHt: number;
  scopesKeptAsPhases: Array<{ id: string; code: string; name: string }>;
};

function numFromText(re: RegExp, text: string): number | null {
  const m = text.match(re);
  if (!m?.[1]) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function dimsFromText(
  re: RegExp,
  text: string,
): { l: number; w: number } | null {
  const m = text.match(re);
  if (!m?.[1] || !m?.[2]) return null;
  const l = Number(m[1].replace(",", "."));
  const w = Number(m[2].replace(",", "."));
  if (!Number.isFinite(l) || !Number.isFinite(w)) return null;
  return { l, w };
}

/** Extrait les quantités chantier depuis devis (+ visite si présente). */
export function extractQuantitiesFromQuoteTexts(input: {
  lines: Array<{ designation: string; description: string | null; quantity: unknown; unit: string }>;
  visitNotes?: string;
}): { quantities: GlobalPrepQuantity[]; warnings: string[]; hypotheses: string[] } {
  const blob = input.lines
    .map((l) => `${l.designation}\n${l.description ?? ""}`)
    .join("\n");
  const all = `${blob}\n${input.visitNotes ?? ""}`;
  const quantities: GlobalPrepQuantity[] = [];
  const warnings: string[] = [];
  const hypotheses: string[] = [];

  const push = (q: GlobalPrepQuantity) => quantities.push(q);

  const cuisineSol =
    numFromText(/soit\s+([\d.,]+)\s*m²\s+au\s+sol/i, all) ??
    numFromText(/pièce\s+de\s+([\d.,]+)\s*m²/i, all);
  const cuisineDims = dimsFromText(
    /Cuisine\s+relevée\s+à\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*m/i,
    all,
  );
  const cuisineMurs = numFromText(
    /Surface\s+murale\s+brute\s+calculée\s*:\s*([\d.,]+)\s*m²\s+avant\s+déduction\s+de\s+la\s+fenêtre/i,
    all,
  );
  const fenetre = dimsFromText(
    /fenêtre\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*m/i,
    all,
  );
  const porteCuisine = dimsFromText(
    /porte\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*m(?![^\n]{0,40}salle)/i,
    all,
  ) ?? dimsFromText(
    /fenêtre\s+[\d.,]+\s*[×x]\s*[\d.,]+\s*m,\s*de\s+la\s+porte\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*m/i,
    all,
  );

  const sdbSol =
    numFromText(/soit\s+([\d.,]+)\s*m²\s+au\s+sol/i, all.match(/Salle de bain[\s\S]{0,400}/i)?.[0] ?? "") ??
    numFromText(/Surface\s+calculée\s*:\s*[\d.,]+\s*[×x]\s*[\d.,]+\s*m\s*=\s*([\d.,]+)\s*m²/i, all);
  const sdbDims = dimsFromText(
    /Salle\s+de\s+bain\s+relevée\s+à\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*m/i,
    all,
  );
  const sdbMurs = numFromText(
    /périmètre\s+[\d.,]+\s*ml\s*[×x]\s*hauteur\s+[\d.,]+\s*m\s*=\s*([\d.,]+)\s*m²/i,
    all,
  ) ?? numFromText(
    /Surface\s+murale\s+brute\s+calculée\s*:\s*([\d.,]+)\s*m²(?!\s+avant\s+déduction\s+de\s+la\s+fenêtre)/i,
    all,
  );
  const baignoire = dimsFromText(
    /baignoire\s+existante\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*m/i,
    all,
  );
  const douche = dimsFromText(
    /douche\s+projetée\s+de\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*m/i,
    all,
  ) ?? dimsFromText(/douche\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*cm/i, all);
  const porteSdb = dimsFromText(
    /déductions?\s+de\s+porte\s+([\d.,]+)\s*[×x]\s*([\d.,]+)\s*m/i,
    all,
  );
  const hauteur =
    numFromText(/hauteur\s+([\d.,]+)\s*m/i, all) ?? 2.5;

  if (cuisineDims) {
    push({
      key: "cuisine_longueur_m",
      label: "Cuisine — longueur",
      value: cuisineDims.l,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: "Relevé repris dans le devis",
      zone: "CUISINE",
    });
    push({
      key: "cuisine_largeur_m",
      label: "Cuisine — largeur",
      value: cuisineDims.w,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: "Relevé repris dans le devis",
      zone: "CUISINE",
    });
  }
  push({
    key: "cuisine_hauteur_m",
    label: "Cuisine — hauteur sous plafond",
    value: hauteur,
    unit: "m",
    provenance: "RELEVE",
    originLabel: "mesuré",
    sourceRef: "devis",
    note: null,
    zone: "CUISINE",
  });
  if (cuisineSol != null) {
    push({
      key: "cuisine_sol_m2",
      label: "Cuisine — surface sol",
      value: cuisineSol,
      unit: "m²",
      provenance: "RELEVE",
      originLabel: "calculé",
      sourceRef: "devis",
      note: cuisineDims
        ? `${cuisineDims.l} × ${cuisineDims.w} m`
        : "Surface sol reprise du devis",
      zone: "CUISINE",
    });
  } else {
    warnings.push("Surface sol cuisine absente — à confirmer");
  }
  if (cuisineMurs != null) {
    push({
      key: "cuisine_murs_bruts_m2",
      label: "Cuisine — surface murs brute",
      value: cuisineMurs,
      unit: "m²",
      provenance: "RELEVE",
      originLabel: "calculé",
      sourceRef: "devis",
      note: "Surface murale brute avant déductions",
      zone: "CUISINE",
    });
  }
  if (fenetre) {
    push({
      key: "cuisine_fenetre_l_m",
      label: "Cuisine — fenêtre largeur",
      value: fenetre.l,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: null,
      zone: "CUISINE",
    });
    push({
      key: "cuisine_fenetre_h_m",
      label: "Cuisine — fenêtre hauteur",
      value: fenetre.w,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: null,
      zone: "CUISINE",
    });
  }
  if (porteCuisine) {
    push({
      key: "cuisine_porte_l_m",
      label: "Cuisine — porte largeur",
      value: porteCuisine.l,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: null,
      zone: "CUISINE",
    });
    push({
      key: "cuisine_porte_h_m",
      label: "Cuisine — porte hauteur",
      value: porteCuisine.w,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: null,
      zone: "CUISINE",
    });
  }

  if (sdbDims) {
    push({
      key: "sdb_longueur_m",
      label: "Salle de bain — longueur",
      value: sdbDims.l,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: "Relevé repris dans le devis",
      zone: "SDB",
    });
    push({
      key: "sdb_largeur_m",
      label: "Salle de bain — largeur",
      value: sdbDims.w,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: "Relevé repris dans le devis",
      zone: "SDB",
    });
  }
  push({
    key: "sdb_hauteur_m",
    label: "Salle de bain — hauteur sous plafond",
    value: hauteur,
    unit: "m",
    provenance: "RELEVE",
    originLabel: "mesuré",
    sourceRef: "devis",
    note: null,
    zone: "SDB",
  });
  if (sdbSol != null) {
    push({
      key: "sdb_sol_m2",
      label: "Salle de bain — surface sol",
      value: sdbSol,
      unit: "m²",
      provenance: "RELEVE",
      originLabel: "calculé",
      sourceRef: "devis",
      note: sdbDims ? `${sdbDims.l} × ${sdbDims.w} m` : null,
      zone: "SDB",
    });
  }
  if (sdbMurs != null) {
    push({
      key: "sdb_murs_bruts_m2",
      label: "Salle de bain — surface murs brute",
      value: sdbMurs,
      unit: "m²",
      provenance: "RELEVE",
      originLabel: "calculé",
      sourceRef: "devis",
      note: "Surface brute avant déductions — à calepiner",
      zone: "SDB",
    });
  }
  if (baignoire) {
    push({
      key: "sdb_baignoire_l_m",
      label: "Salle de bain — baignoire existante longueur",
      value: baignoire.l,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: "À déposer",
      zone: "SDB",
    });
    push({
      key: "sdb_baignoire_w_m",
      label: "Salle de bain — baignoire existante largeur",
      value: baignoire.w,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: "À déposer",
      zone: "SDB",
    });
  }
  if (douche) {
    // Si cm dans le texte (120 × 80), normaliser en m
    const dl = douche.l > 3 ? douche.l / 100 : douche.l;
    const dw = douche.w > 3 ? douche.w / 100 : douche.w;
    push({
      key: "sdb_douche_l_m",
      label: "Salle de bain — douche projetée longueur",
      value: dl,
      unit: "m",
      provenance: "HYPOTHESE",
      originLabel: "projeté",
      sourceRef: "devis",
      note: "Dimension projetée — à confirmer après dépose",
      zone: "SDB",
    });
    push({
      key: "sdb_douche_w_m",
      label: "Salle de bain — douche projetée largeur",
      value: dw,
      unit: "m",
      provenance: "HYPOTHESE",
      originLabel: "projeté",
      sourceRef: "devis",
      note: "Dimension projetée — à confirmer après dépose",
      zone: "SDB",
    });
    hypotheses.push(`Douche projetée ${dl.toFixed(2)} × ${dw.toFixed(2)} m`);
  }
  if (porteSdb) {
    push({
      key: "sdb_porte_l_m",
      label: "Salle de bain — porte largeur",
      value: porteSdb.l,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: null,
      zone: "SDB",
    });
    push({
      key: "sdb_porte_h_m",
      label: "Salle de bain — porte hauteur",
      value: porteSdb.w,
      unit: "m",
      provenance: "RELEVE",
      originLabel: "mesuré",
      sourceRef: "devis",
      note: null,
      zone: "SDB",
    });
  }

  if (!input.visitNotes) {
    warnings.push(
      "Aucune visite structurée rattachée — métré reconstitué depuis le devis (cas D).",
    );
  }

  return { quantities, warnings, hypotheses };
}

function phaseLotFromSection(title: string): string {
  const cleaned = title.replace(/^Lot\s*\d+\s*[—–-]\s*/i, "").trim() || title;
  return cleaned;
}

/**
 * Lot / phase d'exécution : priorité à la section commerciale structurée.
 * Pas de hardcode produit métier (prise→…, béton→…).
 * Seuls les rôles terminaux génériques (contrôle / remise) surclassent la section.
 */
function taskMetaForLine(designation: string, unit: string, qty: number, sectionTitle: string): {
  phase: string;
  duration: { mode: "fixed"; days: number } | { mode: "computed"; rateId: string; driver: string };
  orderBoost: number;
} {
  const dsg = designation.toLowerCase();
  const sectionLot = phaseLotFromSection(sectionTitle);
  const safePhase =
    sectionLot && sectionLot !== designation.trim() ? sectionLot : "À classer";

  // Rôles terminaux génériques — ne pas hériter d'une mauvaise section
  if (
    /nettoyage|remise (de l'|au )?client|remise des clés|remise des cles|réception|reception|livraison/.test(
      dsg,
    )
  ) {
    return { phase: "Remise", duration: { mode: "fixed", days: 0.5 }, orderBoost: 800 };
  }
  if (
    (/contrôle|controle|essais|vérification|verification|inspection/.test(dsg) &&
      /final|finaux|finale|conformite|conformité/.test(dsg)) ||
    /^contrôles?\b|^controles?\b/.test(dsg)
  ) {
    return { phase: "Contrôles", duration: { mode: "fixed", days: 1 }, orderBoost: 700 };
  }

  // Durées : heuristiques légères génériques (unité / forfait) — phase = section
  if (/m²|m2/i.test(unit) && qty > 0) {
    return {
      phase: safePhase,
      duration: { mode: "computed", rateId: "rate_carrelage_sol_m2j", driver: "TO_USE_LINE" },
      orderBoost: 100 + Math.min(200, Math.round(qty)),
    };
  }
  if (/ml|m\.l/i.test(unit) && qty > 0) {
    return {
      phase: safePhase,
      duration: { mode: "fixed", days: Math.max(0.5, Math.min(5, Math.ceil(qty / 30))) },
      orderBoost: 100,
    };
  }
  return {
    phase: safePhase,
    duration: {
      mode: "fixed",
      days: Math.max(0.5, qty >= 1 && /forfait/i.test(unit) ? 1 : 0.5),
    },
    orderBoost: 100,
  };
}

async function loadProjectQuoteContext(orgId: string, projectId: string, quoteId?: string | null) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true, title: true, organizationId: true },
  });
  if (!project) throw new Error("Chantier introuvable");

  const quote = quoteId
    ? await prisma.commercialQuote.findFirst({
        where: {
          id: quoteId,
          organizationId: orgId,
          OR: [{ projectId }, { projectId: null }],
        },
        select: {
          id: true,
          number: true,
          subject: true,
          projectId: true,
          scopeId: true,
          sourcePrepStudyId: true,
          currentVersionId: true,
          totalSellHt: true,
        },
      })
    : await prisma.commercialQuote.findFirst({
        where: { organizationId: orgId, projectId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          number: true,
          subject: true,
          projectId: true,
          scopeId: true,
          sourcePrepStudyId: true,
          currentVersionId: true,
          totalSellHt: true,
        },
      });
  if (!quote?.currentVersionId) throw new Error("Devis introuvable sur ce chantier");

  const sections = await prisma.commercialQuoteSection.findMany({
    where: { versionId: quote.currentVersionId, organizationId: orgId },
    orderBy: { sortOrder: "asc" },
    include: {
      lines: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          designation: true,
          description: true,
          unit: true,
          quantity: true,
          lineSellHt: true,
          lineCostHt: true,
          kind: true,
          sortOrder: true,
        },
      },
    },
  });

  const visit = await prisma.siteVisit.findFirst({
    where: {
      organizationId: orgId,
      OR: [{ projectId }, { commercialQuoteId: quote.id }],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      findingsJson: true,
      proposedWorksJson: true,
      prepJson: true,
      zonesJson: true,
      measurements: {
        select: {
          zone: true,
          label: true,
          lengthM: true,
          widthM: true,
          heightM: true,
          computedQuantity: true,
          quantityValue: true,
          unit: true,
        },
      },
    },
  });

  const visitNotes = visit
    ? [
        visit.subject ?? "",
        JSON.stringify(visit.findingsJson ?? {}),
        JSON.stringify(visit.proposedWorksJson ?? {}),
        JSON.stringify(visit.prepJson ?? {}),
        ...visit.measurements.map(
          (m) =>
            `${m.zone} ${m.label} ${m.lengthM ?? ""} ${m.widthM ?? ""} ${m.heightM ?? ""} ${m.computedQuantity ?? m.quantityValue ?? ""} ${m.unit ?? ""}`,
        ),
      ].join("\n")
    : "";

  const studyCandidates = await prisma.prepStudy.findMany({
    where: {
      organizationId: orgId,
      projectId,
      archivedAt: null,
      scopeId: null,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { id: true, sourcesJson: true, title: true },
  });
  const existingStudy =
    studyCandidates.find((s) => {
      const kind =
        s.sourcesJson && typeof s.sourcesJson === "object"
          ? (s.sourcesJson as { kind?: string }).kind
          : null;
      return kind === GLOBAL_STUDY_MARKER;
    }) ??
    studyCandidates.find((s) => /métré chantier|metre chantier/i.test(s.title)) ??
    null;

  const existingPlan = existingStudy
    ? await prisma.prepSchedulePlan.findFirst({
        where: {
          organizationId: orgId,
          projectId,
          studyId: existingStudy.id,
          status: { not: "ARCHIVED" },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    : await prisma.prepSchedulePlan.findFirst({
        where: {
          organizationId: orgId,
          projectId,
          scopeId: null,
          status: { not: "ARCHIVED" },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

  return { project, quote, sections, visit, visitNotes, existingStudy, existingPlan };
}

export async function previewGlobalPrepFromQuote(input: {
  orgId: string;
  projectId: string;
  quoteId?: string | null;
}): Promise<GlobalPrepPreview> {
  const ctx = await loadProjectQuoteContext(input.orgId, input.projectId, input.quoteId);
  const flatLines = ctx.sections.flatMap((s) => s.lines);
  const { quantities, warnings } = extractQuantitiesFromQuoteTexts({
    lines: flatLines,
    visitNotes: ctx.visitNotes,
  });

  const caseLabel: GlobalPrepPreview["caseLabel"] = ctx.existingStudy
    ? "A"
    : ctx.visit
      ? "B"
      : flatLines.length
        ? "D"
        : "C";

  return {
    projectId: ctx.project.id,
    projectTitle: ctx.project.title,
    quoteId: ctx.quote.id,
    quoteNumber: ctx.quote.number,
    hasVisit: !!ctx.visit,
    hasStudy: !!ctx.existingStudy,
    hasPlan: !!ctx.existingPlan,
    existingStudyId: ctx.existingStudy?.id ?? null,
    existingPlanId: ctx.existingPlan?.id ?? null,
    quantities,
    quoteLineCount: flatLines.length,
    proposedTaskCount: flatLines.filter((l) => l.kind === "WORK").length,
    warnings,
    caseLabel,
  };
}

function lineCode(sectionIndex: number, lineIndex: number): string {
  return `Q${String(sectionIndex + 1).padStart(2, "0")}-${String(lineIndex + 1).padStart(2, "0")}`;
}

/**
 * Crée / enrichit le métré global + génère UN planning chantier
 * à partir du devis (et de la visite si disponible).
 */
export async function createGlobalPrepFromQuote(input: {
  orgId: string;
  projectId: string;
  userId: string;
  quoteId?: string | null;
  forceNewPlan?: boolean;
}): Promise<GlobalPrepResult> {
  const ctx = await loadProjectQuoteContext(input.orgId, input.projectId, input.quoteId);
  const flatLines = ctx.sections.flatMap((s) =>
    s.lines.map((l) => ({ ...l, sectionTitle: s.title, sectionId: s.id })),
  );
  const extracted = extractQuantitiesFromQuoteTexts({
    lines: flatLines,
    visitNotes: ctx.visitNotes,
  });

  // 1) Métré global (scopeId null)
  let studyId = ctx.existingStudy?.id ?? null;
  let studyCreated = false;

  if (!studyId) {
    const created = await prisma.prepStudy.create({
      data: {
        organizationId: input.orgId,
        projectId: input.projectId,
        scopeId: null,
        title: `Métré chantier — ${ctx.project.title}`.slice(0, 180),
        trade: "Tous corps d’état",
        description:
          "Métré global reconstitué depuis le devis (et la visite si disponible). Les lots ProjectScope restent des phases / catégories.",
        mode: "PROFESSIONAL",
        dossierStatus: "PRO_A_VALIDER",
        sourceFormat: GLOBAL_STUDY_MARKER,
        sourcesJson: {
          kind: GLOBAL_STUDY_MARKER,
          quoteId: ctx.quote.id,
          quoteNumber: ctx.quote.number,
          visitId: ctx.visit?.id ?? null,
          case: ctx.visit ? "B" : "D",
        },
        hypothesesJson: {
          items: extracted.hypotheses,
          note: "Les dimensions projetées (ex. douche) ne sont pas des mesures réelles.",
        },
        createdById: input.userId,
        updatedById: input.userId,
      },
      select: { id: true },
    });
    studyId = created.id;
    studyCreated = true;
  } else {
    await prisma.prepStudy.update({
      where: { id: studyId },
      data: {
        sourcesJson: {
          kind: GLOBAL_STUDY_MARKER,
          quoteId: ctx.quote.id,
          quoteNumber: ctx.quote.number,
          visitId: ctx.visit?.id ?? null,
          case: ctx.visit ? "B" : "D",
        },
        hypothesesJson: {
          items: extracted.hypotheses,
          note: "Les dimensions projetées (ex. douche) ne sont pas des mesures réelles.",
        },
        updatedById: input.userId,
        version: { increment: 1 },
      },
    });
  }

  // Paramètres
  await prisma.prepParameter.deleteMany({ where: { studyId } });
  await prisma.prepParameter.createMany({
    data: extracted.quantities.map((q, i) => ({
      studyId: studyId!,
      organizationId: input.orgId,
      key: q.key,
      label: q.label,
      unit: q.unit,
      value: q.value,
      formula: null,
      provenance: q.provenance,
      sourceRef: q.sourceRef,
      evidenceJson: {
        originLabel: q.originLabel,
        zone: q.zone,
      },
      note: q.note,
      sortOrder: i,
      originalValue: q.value,
      originalProvenance: q.provenance,
    })),
  });

  // Lignes de métré = postes devis
  await prisma.prepTakeoffLine.deleteMany({ where: { studyId } });
  const takeoffRows: Array<{
    code: string;
    quoteLineId: string;
    designation: string;
    description: string | null;
    unit: string;
    quantity: number;
    lot: string;
    phase: string;
    orderBoost: number;
    duration:
      | { mode: "fixed"; days: number }
      | { mode: "computed"; rateId: string; driver: string };
    lineSellHt: number;
    lineCostHt: number;
  }> = [];

  let sectionIndex = 0;
  for (const section of ctx.sections) {
    let lineIndex = 0;
    for (const line of section.lines) {
      if (line.kind !== "WORK") continue;
      const code = lineCode(sectionIndex, lineIndex);
      const qty = d(line.quantity);
      const meta = taskMetaForLine(
        line.designation,
        line.unit,
        qty,
        section.title ?? "",
      );
      const duration =
        meta.duration.mode === "computed"
          ? { ...meta.duration, driver: code }
          : meta.duration;
      takeoffRows.push({
        code,
        quoteLineId: line.id,
        designation: line.designation,
        description: line.description,
        unit: line.unit,
        quantity: qty,
        lot: meta.phase,
        phase: meta.phase,
        orderBoost: meta.orderBoost,
        duration,
        lineSellHt: d(line.lineSellHt),
        lineCostHt: d(line.lineCostHt),
      });
      lineIndex += 1;
    }
    sectionIndex += 1;
  }

  await prisma.prepTakeoffLine.createMany({
    data: takeoffRows.map((r, i) => ({
      studyId: studyId!,
      organizationId: input.orgId,
      code: r.code,
      lot: r.lot,
      designation: r.designation,
      description: r.description,
      originalDesignation: r.designation,
      unit: r.unit,
      declaredQuantity: r.quantity,
      computedQuantity: r.quantity,
      provenance: /m²|m2|ml|u/i.test(r.unit) && r.quantity > 0 ? "RELEVE" : "HYPOTHESE",
      literalProvenance: /forfait/i.test(r.unit) ? "HYPOTHESE" : "RELEVE",
      justification: `Posté depuis ${ctx.quote.number}`,
      role: "quote",
      notes: r.description?.slice(0, 500) ?? null,
      sortOrder: i,
    })),
  });

  // Lien devis ↔ métré (transfer + links)
  const transferKey = `global-metre-link:${input.projectId}:${ctx.quote.id}:${studyId}`;
  let transfer = await prisma.prepQuoteTransfer.findUnique({
    where: {
      organizationId_idempotencyKey: {
        organizationId: input.orgId,
        idempotencyKey: transferKey,
      },
    },
  });
  if (!transfer) {
    transfer = await prisma.prepQuoteTransfer.create({
      data: {
        organizationId: input.orgId,
        studyId: studyId!,
        quoteId: ctx.quote.id,
        idempotencyKey: transferKey,
        studyVersion: 1,
        isDemonstration: false,
        summaryJson: {
          kind: "quote_to_metre",
          lineCount: takeoffRows.length,
        },
        createdById: input.userId,
      },
    });
  }

  // Remplacer les liens de ce devis vers notre étude
  await prisma.prepQuoteLink.deleteMany({
    where: { quoteId: ctx.quote.id, organizationId: input.orgId },
  });
  await prisma.prepQuoteLink.createMany({
    data: takeoffRows.map((r) => ({
      organizationId: input.orgId,
      transferId: transfer!.id,
      studyId: studyId!,
      studyLineCode: r.code,
      quoteId: ctx.quote.id,
      quoteLineId: r.quoteLineId,
      quantityAtTransfer: r.quantity,
      unitAtTransfer: r.unit,
      designationAtTransfer: r.designation,
      descriptionAtTransfer: r.description,
    })),
  });

  // Rattacher le devis au chantier + sourceStudy pour le planning engine
  await prisma.commercialQuote.update({
    where: { id: ctx.quote.id },
    data: {
      projectId: input.projectId,
      ...(ctx.quote.sourcePrepStudyId ? {} : { sourcePrepStudyId: studyId }),
    },
  });

  // Workflow + schedule JSON
  const sorted = [...takeoffRows].sort((a, b) => a.orderBoost - b.orderBoost);
  const stepIds = sorted.map((r) => `S-${r.code}`);

  const resourcesJson = {
    labor: [
      { id: "lab_macon", role: "Maçon / carreleur" },
      { id: "lab_plomb", role: "Plombier" },
      { id: "lab_elec", role: "Électricien" },
      { id: "lab_menu", role: "Menuisier / poseur cuisine" },
    ],
    equipment: [],
    supplies: [],
    rates: [
      {
        id: "rate_carrelage_sol_m2j",
        label: "Carrelage sol — rendement standard",
        value: 8,
        unit: "m²/j",
        per: "equipe",
        provenance: "HYPOTHESE",
        note: "Rendement estimatif — modifiable",
      },
      {
        id: "rate_faience_m2j",
        label: "Faïence / revêtement mural — rendement standard",
        value: 7,
        unit: "m²/j",
        per: "equipe",
        provenance: "HYPOTHESE",
        note: "Rendement estimatif — modifiable",
      },
    ],
  };

  const workflowSteps = sorted.map((r, order) => {
    const duration =
      r.duration.mode === "computed"
        ? {
            mode: "computed" as const,
            driver_item: r.code,
            rate_id: r.duration.rateId,
            parallel_units: 1,
            rounding: "ceil_half_day" as const,
          }
        : {
            mode: "fixed" as const,
            days: r.duration.days,
            calendar: "working" as const,
            provenance: "HYPOTHESE",
          };
    return {
      id: `S-${r.code}`,
      order: order + 1,
      name: r.designation,
      lot: r.phase,
      kind: "work" as const,
      description: r.description,
      takeoff_ids: [r.code],
      duration,
      crew: [],
      equipment: [],
      supplies: [],
      preconditions: [],
      controls_before_next: [],
      constraints: [],
      safety: [],
      proofs: [],
      hold_point: /étanchéité|etancheit|protection à l'eau/i.test(r.designation),
    };
  });

  // Pas de FS inventés : sans dépendance technique fiable, le resource leveling
  // séquence les tâches d’une même ressource logique (lot / crew_id).
  const uniqueLots = [...new Set(sorted.map((r) => r.phase).filter(Boolean))];
  const scheduleJson = {
    start_date: null,
    start_date_provenance: "HYPOTHESE",
    calendar: {
      working_days: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularity_days: 0.5,
    },
    tasks: stepIds.map((sid) => ({
      step_id: sid,
      depends_on: [] as Array<{ step_id: string; type: "FS" }>,
      include_in_base: true,
    })),
    note: "Planning global chantier généré depuis le devis — durées estimatives modifiables. Séquencement par ressource (lot) sauf dépendances techniques explicites.",
  };

  await prisma.prepStudy.update({
    where: { id: studyId },
    data: {
      resourcesJson: resourcesJson as unknown as Prisma.InputJsonValue,
      workflowJson: { steps: workflowSteps } as unknown as Prisma.InputJsonValue,
      scheduleJson: scheduleJson as unknown as Prisma.InputJsonValue,
      lotsJson: uniqueLots.map((name, i) => ({
        code: `L${i + 1}`,
        name,
      })),
      updatedById: input.userId,
    },
  });

  // Planning global unique (idempotent)
  const planKey = `global-plan:${input.projectId}:${ctx.quote.id}`;
  let planCreated = false;
  let planId = ctx.existingPlan?.id ?? null;
  let planHref = planId
    ? `/dashboard/visites-metres/etudes/${studyId}/planning/${planId}`
    : "";

  if (!planId || input.forceNewPlan) {
    // Archiver un éventuel ancien plan CURRENT du projet (évite doublons métier)
    if (input.forceNewPlan && planId) {
      await prisma.prepSchedulePlan.updateMany({
        where: { projectId: input.projectId, organizationId: input.orgId, id: planId },
        data: { status: "ARCHIVED" },
      });
    }

    const commit = await commitPrepSchedule({
      orgId: input.orgId,
      studyId: studyId!,
      userId: input.userId,
      idempotencyKey: input.forceNewPlan
        ? `${planKey}:${Date.now()}`
        : planKey,
      selectedStepIds: stepIds,
      quoteId: ctx.quote.id,
      title: `Planning global — ${ctx.project.title}`.slice(0, 200),
    });
    planId = commit.planId;
    planHref = commit.href;
    planCreated = commit.action === "created";

    // Forcer scopeId null + status CURRENT (planning chantier)
    await prisma.prepSchedulePlan.update({
      where: { id: planId },
      data: {
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        quoteId: ctx.quote.id,
      },
    });
  } else {
    planHref = `/dashboard/visites-metres/etudes/${studyId}/planning/${planId}`;
  }

  const [tasks, deps, scopes] = await Promise.all([
    prisma.prepScheduleTask.findMany({
      where: { planId: planId! },
      orderBy: { sortOrder: "asc" },
      select: { name: true, durationDays: true, durationMode: true },
    }),
    prisma.prepScheduleDependency.count({ where: { planId: planId! } }),
    prisma.projectScope.findMany({
      where: { projectId: input.projectId, organizationId: input.orgId, status: "ACTIVE" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { id: true, code: true, name: true },
    }),
  ]);

  return {
    studyId: studyId!,
    studyCreated,
    planId: planId!,
    planCreated,
    planHref,
    taskCount: tasks.length,
    dependencyCount: deps,
    quantities: extracted.quantities,
    durations: tasks.map((t) => ({
      name: t.name,
      days: d(t.durationDays),
      mode: t.durationMode,
    })),
    hypotheses: extracted.hypotheses,
    quoteTotalSellHt: d(ctx.quote.totalSellHt),
    scopesKeptAsPhases: scopes,
  };
}
