/**
 * Adapters progressifs — dérivent des vues module depuis le snapshot canonique.
 * CTX-08 : adaptTakeoffForChatgptContext produit bework_chatgpt_context_v1
 * (chemin UI principal TAKEOFF). Les autres adapters restent diagnostiques.
 */
import {
  buildCanonicalResolution,
  buildChatgptContextSkeleton,
} from "@/lib/bework-patch/context";
import type { BeworkChatgptContextV1 } from "@/lib/bework-patch/types";
import type {
  ProjectContextQuote,
  ProjectContextSchedule,
  ProjectContextSnapshot,
  ProjectContextSource,
  ProjectContextTakeoff,
  ProjectContextVisit,
} from "./types";
import { computeVisitContextVersion } from "./visit-context-version";

/** Instructions compactes TAKEOFF — pas un prompt rédactionnel. */
export const TAKEOFF_CHATGPT_INSTRUCTIONS = [
  "Utiliser prioritairement les valeurs réellement présentes dans data.",
  "Distinguer provenance_kind : MEASURE | PLAN | CALCULATION | HYPOTHESIS | MANUAL | UNKNOWN.",
  "Ne jamais présenter une HYPOTHESIS ou UNKNOWN comme une mesure réelle.",
  "MANUAL, MEASURE, PLAN et validated_quantity sont des données protégées. Ne jamais les remplacer par HYPOTHESIS ou UNKNOWN.",
  "Une hypothèse est uniquement informative tant qu'elle n'est pas explicitement validée par l'utilisateur.",
  "Si une donnée manque, demander confirmation ou laisser la valeur indéterminée — ne pas inventer de dimension.",
  "Pour remplacer une donnée protégée : change_intent TECHNICAL_OVERRIDE + reason obligatoire + confirmation utilisateur.",
  "Ne pas inventer silencieusement une dimension ou quantité absente.",
  "Conserver la traçabilité (ids, codes, source_ref, provenance).",
  "Retourner exclusivement un bework_patch_v1 compatible preview BeWork.",
  "base_version du patch = target.version (= study.version).",
] as const;

export function getTakeoffFromContext(
  snapshot: ProjectContextSnapshot,
  studyId: string,
): ProjectContextTakeoff | null {
  return snapshot.takeoffs.find((t) => t.id === studyId) ?? null;
}

export function getQuoteFromContext(
  snapshot: ProjectContextSnapshot,
  quoteId: string,
): ProjectContextQuote | null {
  return snapshot.quotes.find((q) => q.id === quoteId) ?? null;
}

export function getScheduleFromContext(
  snapshot: ProjectContextSnapshot,
  planId: string,
): ProjectContextSchedule | null {
  return snapshot.schedules.find((s) => s.id === planId) ?? null;
}

export function getVisitFromContext(
  snapshot: ProjectContextSnapshot,
  visitId: string,
): ProjectContextVisit | null {
  return snapshot.visits.find((v) => v.id === visitId) ?? null;
}

/** Devis de référence d’un scope, s’il existe. */
export function getScopeReferenceQuote(
  snapshot: ProjectContextSnapshot,
  scopeId: string,
): ProjectContextQuote | null {
  const scope = snapshot.scopes.find((s) => s.id === scopeId);
  if (!scope?.referenceQuoteId) return null;
  return getQuoteFromContext(snapshot, scope.referenceQuoteId);
}

/** Tous les devis d’un scope (multi-devis). */
export function getQuotesForScope(
  snapshot: ProjectContextSnapshot,
  scopeId: string,
): ProjectContextQuote[] {
  return snapshot.quotes.filter((q) => q.scopeId === scopeId);
}

/** Métrés d’un scope. */
export function getTakeoffsForScope(
  snapshot: ProjectContextSnapshot,
  scopeId: string,
): ProjectContextTakeoff[] {
  return snapshot.takeoffs.filter((t) => t.scopeId === scopeId);
}

function mapSourceForChatgpt(s: ProjectContextSource) {
  return {
    id: s.id,
    display_title: s.displayTitle,
    filename: s.filename,
    plan_number: s.planNumber,
    title: s.title,
    revision: s.revision,
    scale: s.scale,
    page: s.page,
    legibility: s.legibility,
    note: s.note,
    study_id: s.studyId,
    scope_id: s.scopeId,
    chantier_file_id: s.chantierFileId,
    /** Référence GED — pas de binaire, pas d’URL signée. */
    ged: s.file
      ? {
          id: s.file.id,
          name: s.file.name,
          document_type: s.file.documentType,
          mime_type: s.file.mimeType,
          status: s.file.status,
          indice: s.file.indice,
          version_label: s.file.versionLabel,
          category: s.file.category,
          has_url: s.file.hasUrl,
          preview_href: s.file.previewHref,
        }
      : null,
  };
}

/**
 * Adapter TAKEOFF → bework_chatgpt_context_v1 (CTX-08).
 * Sélectionne uniquement le métré ciblé + org / projet / scope / sources liées.
 * N’embarque pas les lignes des autres lots ni les devis/planning complets.
 */
export function adaptTakeoffForChatgptContext(
  snapshot: ProjectContextSnapshot,
  studyId: string,
): BeworkChatgptContextV1 | null {
  const study = getTakeoffFromContext(snapshot, studyId);
  if (!study) return null;

  const scope = study.scopeId
    ? snapshot.scopes.find((s) => s.id === study.scopeId) ?? null
    : null;

  const sources =
    study.sources.length > 0
      ? study.sources
      : snapshot.sources.filter((s) => s.studyId === studyId);

  const studyLineCodes = new Set(study.lines.map((l) => l.code));

  const quoteLinks: Array<{
    study_line_code: string;
    quote_id: string;
    quote_line_id: string;
  }> = [];
  const quoteItems: NonNullable<
    BeworkChatgptContextV1["relationships"]["quote_items"]
  > = [];

  for (const quote of snapshot.quotes) {
    for (const section of quote.sections) {
      for (const line of section.lines) {
        if (!line.studyLineCode || !studyLineCodes.has(line.studyLineCode)) continue;
        quoteLinks.push({
          study_line_code: line.studyLineCode,
          quote_id: quote.id,
          quote_line_id: line.id,
        });
        quoteItems.push({
          quote_item_id: line.id,
          takeoff_link: {
            study_id: studyId,
            study_line_code: line.studyLineCode,
          },
          canonical_resolution: buildCanonicalResolution({
            studyId,
            takeoffLineCode: line.studyLineCode,
          }),
        });
      }
    }
  }

  const scheduleLinks: Array<{
    plan_id: string;
    task_id: string;
    study_line_code: string;
  }> = [];
  const scheduleTasks: NonNullable<
    BeworkChatgptContextV1["relationships"]["schedule_tasks"]
  > = [];

  for (const plan of snapshot.schedules) {
    if (plan.studyId !== studyId) continue;
    for (const task of plan.tasks) {
      const codes = task.takeoffLineCodes.filter((c) => studyLineCodes.has(c));
      for (const code of codes) {
        scheduleLinks.push({
          plan_id: plan.id,
          task_id: task.id,
          study_line_code: code,
        });
      }
      if (codes.length === 0) continue;
      scheduleTasks.push({
        plan_id: plan.id,
        task_id: task.id,
        step_code: task.stepCode ?? task.id,
        study_line_codes: codes,
      });
    }
  }

  const skeleton = buildChatgptContextSkeleton({
    section: "TAKEOFF",
    project: {
      id: snapshot.project.id,
      title: snapshot.project.title,
    },
    target: {
      entity_type: "PREP_STUDY",
      id: study.id,
      version: study.version,
      code: study.title,
    },
    data: {
      title: study.title,
      trade: study.trade,
      mode: study.mode,
      dossier_status: study.dossierStatus,
      scope_id: study.scopeId,
      source_format: study.sourceFormat,
      hypotheses: study.hypothesesJson ?? null,
      parameters: study.parameters.map((p) => ({
        id: p.id,
        key: p.key,
        label: p.label,
        value: p.value,
        unit: p.unit,
        formula: p.formula,
        provenance: p.provenance,
        provenance_kind: p.provenanceKind,
        note: p.note,
        source_ref: p.sourceRef ?? null,
        hypothesis_id: p.hypothesisId ?? null,
        protected:
          p.provenanceKind === "MANUAL" ||
          p.provenanceKind === "MEASURE" ||
          p.provenanceKind === "PLAN",
      })),
      lines: study.lines.map((l) => ({
        id: l.id,
        code: l.code,
        lot: l.lot,
        designation: l.designation,
        description: l.description ?? null,
        unit: l.unit,
        formula: l.formula,
        declared_quantity: l.declaredQuantity,
        computed_quantity: l.computedQuantity,
        validated_quantity: l.validatedQuantity,
        provenance: l.provenance,
        provenance_kind: l.provenanceKind,
        role: l.role,
        nature: l.nature ?? null,
        notes: l.notes ?? null,
        included_services: l.includedServices ?? [],
        technical_references: l.technicalReferences ?? [],
        execution_notes: l.executionNotes ?? null,
        quality_controls: l.qualityControls ?? [],
        technical_reservations: l.technicalReservations ?? [],
        source_ref: null as string | null,
        protected:
          l.validatedQuantity != null ||
          l.provenanceKind === "MANUAL" ||
          l.provenanceKind === "MEASURE" ||
          l.provenanceKind === "PLAN",
      })),
      sources: sources.map(mapSourceForChatgpt),
      quote_links: quoteLinks,
      schedule_links: scheduleLinks,
      counts: {
        parameters: study.parameters.length,
        lines: study.lines.length,
        sources: sources.length,
      },
      instructions: [...TAKEOFF_CHATGPT_INSTRUCTIONS],
      /** Scopes du projet (métadonnées uniquement — pas les lignes des autres lots). */
      project_scopes: snapshot.scopes.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        status: s.status,
        is_target: s.id === study.scopeId,
      })),
      canonical_source: "bework_project_context_v1",
    },
    quoteItems,
  });

  return {
    ...skeleton,
    organization: {
      id: snapshot.organization.id,
      name: snapshot.organization.name,
    },
    project: {
      id: snapshot.project.id,
      title: snapshot.project.title,
      description: snapshot.project.description,
      site_address: snapshot.project.siteAddress,
      site_city: snapshot.project.siteCity,
      status: snapshot.project.status,
      chantier_status: snapshot.project.chantierStatus,
    },
    scope: scope
      ? {
          id: scope.id,
          code: scope.code,
          name: scope.name,
          status: scope.status,
        }
      : null,
    target: {
      ...skeleton.target,
      base_version: study.version,
    },
    relationships: {
      ...skeleton.relationships,
      schedule_tasks: scheduleTasks,
      notes: [
        "Provenance : MEASURE/PLAN/CALCULATION/HYPOTHESIS/MANUAL/UNKNOWN mappés depuis les enums BeWork (RELEVE, HYPOTHESE, …). PLAN uniquement si littéral stocké — jamais déduit de la seule présence d’un plan.",
      ],
    },
  };
}

/**
 * Vue compacte QUOTE — ne remplace pas buildQuotePatchContextForChatgpt.
 */
export function adaptQuoteForChatgptContext(
  snapshot: ProjectContextSnapshot,
  quoteId: string,
): Record<string, unknown> | null {
  const quote = getQuoteFromContext(snapshot, quoteId);
  if (!quote) return null;
  return {
    source: "bework_project_context_v1",
    section: "QUOTE",
    type: "bework_quote_context_v1_from_canonical",
    project: {
      id: snapshot.project.id,
      title: snapshot.project.title,
    },
    target: {
      quote_number: quote.number,
      base_version: quote.versionNumber,
      subject: quote.subject,
      is_scope_reference: quote.isScopeReference,
      scope_id: quote.scopeId,
      transfer_study_version: quote.transfer?.studyVersion ?? null,
    },
    totals: {
      total_ht: quote.totalSellHt,
      total_ttc: quote.totalTtc,
    },
    sections: quote.sections.map((s) => ({
      section_id: s.id,
      title: s.title,
      items: s.lines.map((l) => ({
        item_id: l.id,
        designation: l.designation,
        quantity: l.quantity,
        unit: l.unit,
        unit_price_ht: l.unitSellHt,
        line_ht: l.lineSellHt,
        study_line_code: l.studyLineCode,
      })),
    })),
    versions: snapshot.versions,
  };
}

/** Instructions MODIFY VISIT — discussion avant patch. */
export const VISIT_MODIFY_INSTRUCTIONS = [
  "Mode MODIFY : visite existante. Analyse d’abord, pose des questions, puis JSON bework_patch_v1 seulement sur demande.",
  "Ne jamais inventer une dimension absente. PLAN ≠ PHOTO ≠ MEASURE.",
  "Ordre : MEASURE > MANUAL > PLAN > CALCULATION > HYPOTHESIS > UNKNOWN.",
  "Données manuelles / MEASURE déjà saisies : ne pas les remplacer silencieusement (TECHNICAL_OVERRIDE + motif si besoin).",
  "Visite = faits terrain ; ne pas produire un métré complet ici.",
  "base_version du patch = target.version.",
] as const;

/**
 * Adapter VISIT → bework_chatgpt_context_v1 (CTX-07) — MODIFY.
 * Version = empreinte déterministe de l’état exposé (pas hardcodé à 1).
 */
export function adaptVisitForChatgptContext(
  snapshot: ProjectContextSnapshot,
  visitId: string,
): BeworkChatgptContextV1 | null {
  const visit = getVisitFromContext(snapshot, visitId);
  if (!visit) return null;

  const version =
    visit.contextVersion ||
    computeVisitContextVersion({
      id: visit.id,
      subject: visit.subject,
      status: visit.status,
      clientName: visit.clientName,
      siteAddress: visit.siteAddress,
      clientNeed: visit.clientNeed,
      comments: visit.comments,
      measurements: visit.measurements,
      mediaRefs: visit.mediaRefs,
    });

  const planSources = snapshot.sources.filter((s) =>
    /plan/i.test(
      [s.displayTitle, s.filename, s.title, s.planNumber].filter(Boolean).join(" "),
    ),
  );

  const skeleton = buildChatgptContextSkeleton({
    section: "VISIT",
    project: {
      id: snapshot.project.id,
      title: snapshot.project.title,
    },
    target: {
      entity_type: "SITE_VISIT",
      id: visit.id,
      version,
      code: visit.subject,
    },
    data: {
      interaction_mode: "MODIFY",
      subject: visit.subject,
      status: visit.status,
      client_name: visit.clientName,
      site_address: visit.siteAddress,
      client_need: visit.clientNeed,
      comments: visit.comments,
      measurements: visit.measurements.map((m) => ({
        measurement_id: m.id,
        zone: m.zone,
        label: m.label,
        measure_type: m.measureType,
        unit: m.unit,
        length_m: m.lengthM,
        width_m: m.widthM,
        height_m: m.heightM,
        quantity_value: m.quantityValue,
        quantity: m.computedQuantity,
        lot: m.lot,
        observation: m.observation,
        provenance_kind: "MEASURE",
      })),
      media_refs: visit.mediaRefs.map((m) => ({
        id: m.id,
        name: m.name,
        kind: m.kind,
        category: m.category,
        observation: m.observation,
        has_url: m.hasUrl,
        provenance_kind: m.kind === "DOCUMENT" ? "PLAN" : "UNKNOWN",
      })),
      plan_sources: planSources.slice(0, 30).map((s) => ({
        id: s.id,
        label: s.displayTitle || s.filename || s.title,
        document_id: s.chantierFileId,
        source_ref: s.chantierFileId || s.id,
        provenance_kind: "PLAN",
      })),
      counts: {
        measurements: visit.measurements.length,
        media_refs: visit.mediaRefs.length,
        plan_sources: planSources.length,
      },
      instructions: [...VISIT_MODIFY_INSTRUCTIONS],
      canonical_source: "bework_project_context_v1",
      note: "Visite = faits / sources. Métré = ouvrages (étape suivante).",
      version_note:
        "target.version = empreinte déterministe (SHA-256→uint48) de l’état ChatGPT VISIT.",
    },
  });

  return {
    ...skeleton,
    organization: {
      id: snapshot.organization.id,
      name: snapshot.organization.name,
    },
    project: {
      id: snapshot.project.id,
      title: snapshot.project.title,
      description: snapshot.project.description,
      site_address: snapshot.project.siteAddress,
      site_city: snapshot.project.siteCity,
      status: snapshot.project.status,
      chantier_status: snapshot.project.chantierStatus,
    },
    target: {
      ...skeleton.target,
      base_version: version,
    },
  };
}

/**
 * Comparaison légère ancien/nouveau (diagnostic, pas de bascule prod).
 */
export function diffContextKeys(
  legacyKeys: string[],
  canonicalKeys: string[],
): { onlyLegacy: string[]; onlyCanonical: string[]; shared: string[] } {
  const L = new Set(legacyKeys);
  const C = new Set(canonicalKeys);
  return {
    onlyLegacy: legacyKeys.filter((k) => !C.has(k)),
    onlyCanonical: canonicalKeys.filter((k) => !L.has(k)),
    shared: legacyKeys.filter((k) => C.has(k)),
  };
}
