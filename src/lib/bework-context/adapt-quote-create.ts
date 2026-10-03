/**
 * Contexte ChatGPT CREATE devis — PrepStudy CURRENT → bework_quote_bundle_v1.
 * Lecture seule pour le contexte. Commit via createQuote + PrepQuoteTransfer/Link.
 * Aucun métier hardcodé. Aucune quantité technique inventée.
 */
import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { BEWORK_CONTEXT_FORMAT, BEWORK_CONTEXT_SCHEMA_VERSION } from "@/lib/bework-patch/types";
import { BEWORK_QUOTE_BUNDLE_FORMAT } from "@/lib/commercial/chatgpt-bundle/types";
import type { BeworkQuoteBundleV1 } from "@/lib/commercial/chatgpt-bundle/types";
import { parseBeworkQuoteBundle } from "@/lib/commercial/chatgpt-bundle/parse";
import {
  buildBundleImportPreview,
  commitBundleIntoQuote,
  type BundleImportPreview,
  type BundleImportSelection,
} from "@/lib/commercial/chatgpt-bundle/commit";
import { createQuote } from "@/lib/commercial/quotes";
import { getPrepStudyView, PrepError } from "@/lib/preparation/service";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { displayUnit } from "@/lib/preparation/units";
import { isPrepLineTransferable } from "@/lib/preparation/quote-bridge/description";

export const QUOTE_CREATE_INSTRUCTIONS = [
  "Tu es un copilote commercial chantier BTP. Tu proposes ; le professionnel décide.",
  "Mode CREATE : aucun devis CommercialQuote n’existe encore pour ce chantier.",
  "Analyse d’abord le métré (quantités, provenances, notes) et le projet/client.",
  "Discute avant de produire le JSON : prestations, regroupements, prix, marge, TVA, exclusions, conditions.",
  "Ne jamais inventer une quantité technique différente du métré sans accord explicite du professionnel.",
  "validated_quantity du métré est prioritaire lorsqu’elle existe.",
  "Un prix proposé par toi n’est pas contractuel tant que le professionnel ne l’a pas validé.",
  "Marque chaque PU avec price_provenance : USER | LIBRARY | HISTORICAL | AI_PROPOSAL | MARKET_REFERENCE | UNKNOWN.",
  "Pour chaque ligne issue du métré, renseigne source_prep_line_code avec le code métré.",
  "Si un prix manque : unit_price_ht = 0 et signale « À confirmer » dans description/warnings.",
  "Quand les choix sont validés, produis UNIQUEMENT un JSON bework_quote_bundle_v1.",
  "Ne crée pas de planning automatiquement.",
  "N’impose aucun corps d’état préfabriqué hors sources fournies.",
] as const;

export type BeworkQuoteCreateContextV1 = {
  type: typeof BEWORK_CONTEXT_FORMAT;
  schema_version: typeof BEWORK_CONTEXT_SCHEMA_VERSION;
  section: "QUOTE";
  interaction_mode: "CREATE";
  expected_output: typeof BEWORK_QUOTE_BUNDLE_FORMAT;
  organization: { id: string; name: string };
  project: {
    id: string;
    title: string;
    description: string | null;
    site_address: string | null;
    site_city: string | null;
    status: string | null;
    chantier_status: string | null;
    client: { name: string | null; company: string | null } | null;
  };
  takeoff: {
    study_id: string;
    version: number;
    title: string;
    scope: { id: string; name: string; code: string | null } | null;
    lines: Array<{
      code: string;
      designation: string;
      description: string | null;
      unit: string;
      lot: string | null;
      role: string | null;
      provenance: string | null;
      validated_quantity: number | null;
      computed_quantity: number | null;
      declared_quantity: number | null;
      quantity_for_quote: number | null;
      quantity_status: string;
      notes: string | null;
      transferable: boolean;
    }>;
    params: Array<{
      key: string;
      label: string;
      value: number | null;
      unit: string;
      provenance: string | null;
    }>;
    hypotheses: unknown[];
    checks: unknown[];
  };
  visit_summary: {
    id: string;
    subject: string | null;
    client_need: string | null;
    constraints: unknown;
  } | null;
  sources_fingerprint: string;
  data: {
    quote: null;
    note: string;
  };
  instructions: string[];
  target: {
    entity_type: "COMMERCIAL_QUOTE";
    id: null;
    version: 0;
    base_version: 0;
    create_from_study_id: string;
    create_on_project_id: string;
  };
};

export type QuoteCreateQuantityDrift = {
  sourcePrepLineCode: string;
  designation: string;
  metreQuantity: number;
  quoteQuantity: number;
  delta: number;
  requiresExplicitAccept: boolean;
};

export type QuoteCreatePreviewResult = {
  ok: true;
  bundleFingerprint: string;
  sourcesFingerprint: string;
  studyId: string;
  studyVersion: number;
  preview: BundleImportPreview;
  quantityDrifts: QuoteCreateQuantityDrift[];
  priceSummary: {
    withPrice: number;
    zeroPrice: number;
    aiProposal: number;
    linkedToMetre: number;
  };
  warnings: string[];
};

function resolveQuoteQty(input: {
  validatedQuantity: number | null;
  computed: number | null;
  declaredQuantity: number | null;
  transferable: boolean;
  error: string | null;
}): { qty: number | null; status: string } {
  if (!input.transferable) {
    return { qty: null, status: "Indicateur technique — non chiffrable" };
  }
  if (input.error) return { qty: null, status: `Erreur calcul : ${input.error}` };
  if (input.validatedQuantity != null) {
    return { qty: input.validatedQuantity, status: "Quantité validée" };
  }
  if (input.computed != null) {
    return { qty: input.computed, status: "Quantité calculée" };
  }
  if (input.declaredQuantity != null) {
    return { qty: input.declaredQuantity, status: "Quantité déclarée" };
  }
  return { qty: null, status: "Quantité absente — à confirmer" };
}

/** Empreinte métré pour PREVIEW_STALE. */
export function computeQuoteCreateSourcesFingerprint(input: {
  projectId: string;
  studyId: string;
  studyVersion: number;
  studyUpdatedAt: Date | string;
  lineCodes: string[];
}): string {
  const payload = {
    projectId: input.projectId,
    studyId: input.studyId,
    studyVersion: input.studyVersion,
    studyUpdatedAt:
      input.studyUpdatedAt instanceof Date
        ? input.studyUpdatedAt.toISOString()
        : String(input.studyUpdatedAt),
    lines: [...input.lineCodes].sort(),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function loadCurrentQuoteCreateSourcesFingerprint(input: {
  orgId: string;
  projectId: string;
  studyId?: string | null;
}): Promise<{ fingerprint: string; studyId: string; studyVersion: number }> {
  const study = await prisma.prepStudy.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      archivedAt: null,
      ...(input.studyId ? { id: input.studyId } : {}),
    },
    select: {
      id: true,
      version: true,
      updatedAt: true,
      lines: { select: { code: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!study) {
    throw Object.assign(new Error("Aucun métré sur ce chantier"), {
      code: "STUDY_REQUIRED",
      status: 422,
    });
  }
  return {
    fingerprint: computeQuoteCreateSourcesFingerprint({
      projectId: input.projectId,
      studyId: study.id,
      studyVersion: study.version,
      studyUpdatedAt: study.updatedAt,
      lineCodes: study.lines.map((l) => l.code),
    }),
    studyId: study.id,
    studyVersion: study.version,
  };
}

/**
 * Construit le contexte CREATE devis — multi-tenant strict.
 */
export async function buildQuoteCreateContext(input: {
  orgId: string;
  projectId: string;
  studyId?: string | null;
}): Promise<BeworkQuoteCreateContextV1> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: {
      id: true,
      title: true,
      description: true,
      siteAddress: true,
      siteCity: true,
      status: true,
      chantierStatus: true,
      organization: { select: { id: true, name: true } },
      client: { select: { name: true, company: true } },
    },
  });
  if (!project?.organization) {
    throw Object.assign(new Error("Chantier introuvable dans votre organisation"), {
      code: "PROJECT_NOT_FOUND",
      status: 404,
    });
  }

  const existingQuote = await prisma.commercialQuote.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
    },
    select: { id: true, number: true, status: true },
    orderBy: { updatedAt: "desc" },
  });
  if (existingQuote) {
    throw Object.assign(
      new Error(
        `Un devis existe déjà (${existingQuote.number}). Utilisez « Modifier avec ChatGPT ».`,
      ),
      {
        code: "QUOTE_ALREADY_EXISTS",
        status: 409,
        quoteId: existingQuote.id,
      },
    );
  }

  const studyRow = await prisma.prepStudy.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      archivedAt: null,
      ...(input.studyId ? { id: input.studyId } : {}),
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!studyRow) {
    throw Object.assign(
      new Error("Préparez d’abord le métré avant le devis."),
      { code: "STUDY_REQUIRED", status: 422 },
    );
  }

  const study = await getPrepStudyView(input.orgId, studyRow.id);
  if (!study) {
    throw Object.assign(new Error("Métré introuvable"), {
      code: "STUDY_NOT_FOUND",
      status: 404,
    });
  }
  if (study.project.id !== input.projectId) {
    throw Object.assign(new Error("Ce métré appartient à un autre chantier"), {
      code: "PROJECT_MISMATCH",
      status: 403,
    });
  }

  const engine = computeStudy({ params: study.params, lines: study.lines });
  const lines = study.lines.map((line) => {
    const node = engine.nodes.get(line.code);
    const transferable = isPrepLineTransferable(line.role);
    const resolved = resolveQuoteQty({
      validatedQuantity: line.validatedQuantity,
      computed: node?.value ?? null,
      declaredQuantity: line.declaredQuantity,
      transferable,
      error: node?.error ?? null,
    });
    return {
      code: line.code,
      designation: line.designation,
      description: line.description,
      unit: displayUnit(line.unit) || line.unit,
      lot: line.lot,
      role: line.role,
      provenance: line.provenance,
      validated_quantity: line.validatedQuantity,
      computed_quantity: node?.value ?? null,
      declared_quantity: line.declaredQuantity,
      quantity_for_quote: resolved.qty,
      quantity_status: resolved.status,
      notes: line.notes,
      transferable,
    };
  });

  const fingerprint = computeQuoteCreateSourcesFingerprint({
    projectId: input.projectId,
    studyId: study.id,
    studyVersion: study.version,
    studyUpdatedAt: study.updatedAt,
    lineCodes: study.lines.map((l) => l.code),
  });

  const visit = await prisma.siteVisit.findFirst({
    where: { organizationId: input.orgId, projectId: input.projectId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      clientNeed: true,
      constraintsJson: true,
    },
  });

  return {
    type: BEWORK_CONTEXT_FORMAT,
    schema_version: BEWORK_CONTEXT_SCHEMA_VERSION,
    section: "QUOTE",
    interaction_mode: "CREATE",
    expected_output: BEWORK_QUOTE_BUNDLE_FORMAT,
    organization: {
      id: project.organization.id,
      name: project.organization.name,
    },
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      site_address: project.siteAddress,
      site_city: project.siteCity,
      status: project.status,
      chantier_status: project.chantierStatus,
      client: project.client
        ? { name: project.client.name, company: project.client.company }
        : null,
    },
    takeoff: {
      study_id: study.id,
      version: study.version,
      title: study.title,
      scope: study.scope,
      lines,
      params: study.params.map((p) => ({
        key: p.key,
        label: p.label,
        value: p.value,
        unit: displayUnit(p.unit) || p.unit,
        provenance: p.provenance,
      })),
      hypotheses: study.hypotheses,
      checks: study.checks,
    },
    visit_summary: visit
      ? {
          id: visit.id,
          subject: visit.subject,
          client_need: visit.clientNeed,
          constraints: visit.constraintsJson,
        }
      : null,
    sources_fingerprint: fingerprint,
    data: {
      quote: null,
      note:
        "Discutez d’abord du chiffrage avec le professionnel. Puis produisez bework_quote_bundle_v1.",
    },
    instructions: [...QUOTE_CREATE_INSTRUCTIONS],
    target: {
      entity_type: "COMMERCIAL_QUOTE",
      id: null,
      version: 0,
      base_version: 0,
      create_from_study_id: study.id,
      create_on_project_id: input.projectId,
    },
  };
}

function analyseQuantityDrifts(
  bundle: BeworkQuoteBundleV1,
  metreByCode: Map<string, number>,
): QuoteCreateQuantityDrift[] {
  const drifts: QuoteCreateQuantityDrift[] = [];
  for (const sec of bundle.sections) {
    for (const item of sec.items) {
      const code = item.sourcePrepLineCode?.trim();
      if (!code) continue;
      const metreQty = metreByCode.get(code);
      if (metreQty == null) continue;
      const delta = Math.round((item.quantity - metreQty) * 1e6) / 1e6;
      if (Math.abs(delta) < 0.01) continue;
      drifts.push({
        sourcePrepLineCode: code,
        designation: item.designation,
        metreQuantity: metreQty,
        quoteQuantity: item.quantity,
        delta,
        requiresExplicitAccept: true,
      });
    }
  }
  return drifts;
}

export async function previewQuoteCreateFromBundle(input: {
  orgId: string;
  projectId: string;
  raw: string;
  sourcesFingerprint: string;
  studyId?: string | null;
  acceptQuantityDrifts?: boolean;
}): Promise<QuoteCreatePreviewResult> {
  const current = await loadCurrentQuoteCreateSourcesFingerprint({
    orgId: input.orgId,
    projectId: input.projectId,
    studyId: input.studyId,
  });
  if (input.sourcesFingerprint && input.sourcesFingerprint !== current.fingerprint) {
    throw Object.assign(
      new Error(
        "Les données du chantier ont changé. Analysez de nouveau la proposition.",
      ),
      {
        code: "PREVIEW_STALE",
        status: 409,
        sourcesFingerprint: current.fingerprint,
      },
    );
  }

  const parsed = parseBeworkQuoteBundle(input.raw);
  if (!parsed.ok) {
    throw Object.assign(
      new Error(parsed.errors[0]?.message ?? "JSON bework_quote_bundle_v1 invalide"),
      { code: "PARSE_ERROR", status: 422, issues: parsed.errors },
    );
  }

  const study = await getPrepStudyView(input.orgId, current.studyId);
  if (!study) throw new PrepError("Métré introuvable", 404);

  const engine = computeStudy({ params: study.params, lines: study.lines });
  const metreByCode = new Map<string, number>();
  for (const line of study.lines) {
    if (!isPrepLineTransferable(line.role)) continue;
    const node = engine.nodes.get(line.code);
    const resolved = resolveQuoteQty({
      validatedQuantity: line.validatedQuantity,
      computed: node?.value ?? null,
      declaredQuantity: line.declaredQuantity,
      transferable: true,
      error: node?.error ?? null,
    });
    if (resolved.qty != null) metreByCode.set(line.code, resolved.qty);
  }

  const quantityDrifts = analyseQuantityDrifts(parsed.bundle, metreByCode);
  const preview = await buildBundleImportPreview({
    orgId: input.orgId,
    quoteId: null,
    bundle: parsed.bundle,
    fingerprint: parsed.fingerprint,
    parseWarnings: parsed.warnings.map((w) => w.message),
  });

  // Idempotence org : même fingerprint déjà lié via PrepQuoteTransfer
  const prior = await prisma.prepQuoteTransfer.findUnique({
    where: {
      organizationId_idempotencyKey: {
        organizationId: input.orgId,
        idempotencyKey: `chatgpt-quote-create:${parsed.fingerprint}`,
      },
    },
    include: { quote: { select: { id: true, number: true, subject: true } } },
  });
  if (prior) {
    preview.alreadyImported = true;
    preview.warnings = [
      ...preview.warnings,
      `Ce JSON a déjà créé le devis ${prior.quote.number}.`,
    ];
  }

  const warnings = [...preview.warnings];
  if (quantityDrifts.length) {
    warnings.push(
      `${quantityDrifts.length} écart(s) de quantité métré → devis — confirmation explicite requise.`,
    );
  }

  let withPrice = 0;
  let zeroPrice = 0;
  let aiProposal = 0;
  let linkedToMetre = 0;
  for (const sec of parsed.bundle.sections) {
    for (const item of sec.items) {
      if (item.unitPriceHt > 0) withPrice += 1;
      else zeroPrice += 1;
      if (item.priceProvenance === "AI_PROPOSAL") aiProposal += 1;
      if (item.sourcePrepLineCode?.trim()) linkedToMetre += 1;
    }
  }

  return {
    ok: true,
    bundleFingerprint: parsed.fingerprint,
    sourcesFingerprint: current.fingerprint,
    studyId: current.studyId,
    studyVersion: current.studyVersion,
    preview,
    quantityDrifts,
    priceSummary: { withPrice, zeroPrice, aiProposal, linkedToMetre },
    warnings,
  };
}

const defaultSelection = (projectId: string): BundleImportSelection => ({
  importClient: true,
  importSite: true,
  importPricing: true,
  importAdvice: true,
  importReservations: true,
  importInternalNotes: true,
  importWorkStages: false,
  importMediaManifest: false,
  pricingMode: "REPLACE",
  clientExternalOrgId: null,
  createClientIfMissing: true,
  primaryEmailOverride: null,
  projectId,
  forceDuplicate: true,
});

/**
 * Commit atomique CREATE devis depuis métré + bundle ChatGPT.
 */
export async function commitQuoteCreateFromBundle(input: {
  orgId: string;
  projectId: string;
  userId: string;
  raw: string;
  sourcesFingerprint: string;
  studyId?: string | null;
  acceptQuantityDrifts?: boolean;
  allowDuplicate?: boolean;
}): Promise<{
  ok: true;
  quoteId: string;
  quoteNumber: string;
  transferId: string;
  href: string;
  action: "created" | "idempotent";
}> {
  const preview = await previewQuoteCreateFromBundle({
    orgId: input.orgId,
    projectId: input.projectId,
    raw: input.raw,
    sourcesFingerprint: input.sourcesFingerprint,
    studyId: input.studyId,
    acceptQuantityDrifts: input.acceptQuantityDrifts,
  });

  if (preview.quantityDrifts.length && !input.acceptQuantityDrifts) {
    throw Object.assign(
      new Error(
        "Des quantités s’écartent du métré. Cochez « Accepter les écarts de quantité » pour confirmer.",
      ),
      {
        code: "QUANTITY_DRIFT",
        status: 422,
        quantityDrifts: preview.quantityDrifts,
      },
    );
  }

  const idempotencyKey = `chatgpt-quote-create:${preview.bundleFingerprint}`;
  const existing = await prisma.prepQuoteTransfer.findUnique({
    where: {
      organizationId_idempotencyKey: {
        organizationId: input.orgId,
        idempotencyKey,
      },
    },
    include: { quote: { select: { id: true, number: true } } },
  });
  if (existing && !input.allowDuplicate) {
    return {
      ok: true,
      quoteId: existing.quoteId,
      quoteNumber: existing.quote.number,
      transferId: existing.id,
      href: `/dashboard/devis-facturation/devis/${existing.quoteId}`,
      action: "idempotent",
    };
  }
  if (existing && input.allowDuplicate) {
    // Nouvelle clé pour forcer une copie distincte
  }

  const parsed = parseBeworkQuoteBundle(input.raw);
  if (!parsed.ok) {
    throw Object.assign(new Error("JSON invalide"), { status: 422 });
  }

  const study = await getPrepStudyView(input.orgId, preview.studyId);
  if (!study) throw new PrepError("Métré introuvable", 404);

  // Re-check pas de devis projet (sauf allowDuplicate)
  if (!input.allowDuplicate) {
    const other = await prisma.commercialQuote.findFirst({
      where: { organizationId: input.orgId, projectId: input.projectId },
      select: { id: true, number: true },
    });
    if (other) {
      throw Object.assign(
        new Error(`Un devis existe déjà (${other.number}). Utilisez « Modifier avec ChatGPT ».`),
        { code: "QUOTE_ALREADY_EXISTS", status: 409, quoteId: other.id },
      );
    }
  }

  const key =
    existing && input.allowDuplicate
      ? `${idempotencyKey}:copy:${Date.now()}`
      : idempotencyKey;

  const subject =
    parsed.bundle.quote.title?.trim() ||
    `Devis depuis métré — ${study.title}`.slice(0, 500);

  const quote = await createQuote({
    orgId: input.orgId,
    userId: input.userId,
    subject,
    projectId: input.projectId,
    clientExternalOrgId: null,
    sourcePrepStudyId: study.id,
    skipDefaultSection: true,
    clientNotes: `Créé depuis le métré « ${study.title} » (v${study.version}) via ChatGPT — DRAFT à valider.`,
    internalNotes: [
      `CREATE devis ChatGPT`,
      `Étude : ${study.id}`,
      `Version métré : ${study.version}`,
      `bundleHash:${parsed.fingerprint}`,
    ].join("\n"),
  });

  try {
    const committed = await commitBundleIntoQuote({
      orgId: input.orgId,
      userId: input.userId,
      quoteId: quote.id,
      bundle: parsed.bundle,
      fingerprint: parsed.fingerprint,
      selection: defaultSelection(input.projectId),
    });

    // Relire lignes créées pour PrepQuoteLink
    const version = await prisma.commercialQuoteVersion.findFirst({
      where: { id: quote.currentVersionId ?? undefined, quoteId: quote.id },
      include: { lines: { orderBy: { sortOrder: "asc" } } },
    });
    if (!version) {
      throw new Error("Version devis absente après commit");
    }

    const engine = computeStudy({ params: study.params, lines: study.lines });
    const linksData: Array<{
      studyLineCode: string;
      quoteLineId: string;
      qty: number;
      unit: string;
      designation: string;
      description: string | null;
    }> = [];

    for (const qLine of version.lines) {
      const code = qLine.reference?.trim();
      if (!code) continue;
      const prep = study.lines.find((l) => l.code === code);
      if (!prep) continue;
      const node = engine.nodes.get(code);
      const resolved = resolveQuoteQty({
        validatedQuantity: prep.validatedQuantity,
        computed: node?.value ?? null,
        declaredQuantity: prep.declaredQuantity,
        transferable: isPrepLineTransferable(prep.role),
        error: node?.error ?? null,
      });
      linksData.push({
        studyLineCode: code,
        quoteLineId: qLine.id,
        qty: resolved.qty ?? d(qLine.quantity),
        unit: prep.unit,
        designation: prep.designation,
        description: prep.description,
      });
    }

    const transfer = await prisma.prepQuoteTransfer.create({
      data: {
        organizationId: input.orgId,
        studyId: study.id,
        quoteId: quote.id,
        idempotencyKey: key,
        studyVersion: study.version,
        isDemonstration: study.mode === "DEMONSTRATION",
        createdById: input.userId,
        summaryJson: {
          source: "chatgpt_quote_create",
          bundleFingerprint: parsed.fingerprint,
          lineCount: version.lines.length,
          linkedCount: linksData.length,
          createdLineIds: committed.createdLineIds,
        },
        links: {
          create: linksData.map((l) => ({
            organizationId: input.orgId,
            studyId: study.id,
            studyLineCode: l.studyLineCode,
            quoteId: quote.id,
            quoteLineId: l.quoteLineId,
            quantityAtTransfer: l.qty,
            unitAtTransfer: l.unit,
            designationAtTransfer: l.designation,
            descriptionAtTransfer: l.description,
          })),
        },
      },
    });

    await prisma.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: "TRANSFER_TO_QUOTE",
        detailJson: {
          quoteId: quote.id,
          quoteNumber: quote.number,
          transferId: transfer.id,
          source: "chatgpt_quote_create",
          lineCount: linksData.length,
        },
        actorUserId: input.userId,
      },
    });

    return {
      ok: true,
      quoteId: quote.id,
      quoteNumber: quote.number,
      transferId: transfer.id,
      href: `/dashboard/devis-facturation/devis/${quote.id}`,
      action: "created",
    };
  } catch (e) {
    // Rollback devis partiel
    try {
      await prisma.commercialQuote.delete({ where: { id: quote.id } });
    } catch {
      /* best effort */
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await prisma.prepQuoteTransfer.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: input.orgId,
            idempotencyKey: key,
          },
        },
        include: { quote: { select: { id: true, number: true } } },
      });
      if (again) {
        return {
          ok: true,
          quoteId: again.quoteId,
          quoteNumber: again.quote.number,
          transferId: again.id,
          href: `/dashboard/devis-facturation/devis/${again.quoteId}`,
          action: "idempotent",
        };
      }
    }
    throw e;
  }
}
