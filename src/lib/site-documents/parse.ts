import { asString, stripCodeFences } from "@/lib/commercial/chatgpt-bundle/normalize";
import {
  BEWORK_PPSPS_FORMAT,
  BEWORK_SITE_REPORT_FORMAT,
  emptyPpspsPayload,
  emptySiteReportPayload,
  type PpspsPayload,
  type PpspsRisk,
  type SiteReportNextStep,
  type SiteReportParticipant,
  type SiteReportPayload,
} from "@/lib/site-documents/types";

export type ParseIssue = { path: string; message: string };

function asStringList(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    const s = raw.trim();
    return s ? [s] : [];
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => asString(x))
    .filter((x): x is string => Boolean(x));
}

function asParticipants(raw: unknown): SiteReportParticipant[] {
  if (!Array.isArray(raw)) return [];
  const out: SiteReportParticipant[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const o = p as Record<string, unknown>;
    const name = asString(o.name ?? o.nom);
    if (!name) continue;
    out.push({
      name,
      company: asString(o.company ?? o.societe ?? o.society),
      role: asString(o.role ?? o.fonction ?? o.function),
    });
  }
  return out;
}

function asNextSteps(raw: unknown): SiteReportNextStep[] {
  if (!Array.isArray(raw)) return [];
  const out: SiteReportNextStep[] = [];
  for (const s of raw) {
    if (typeof s === "string") {
      const action = s.trim();
      if (action) out.push({ action });
      continue;
    }
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const action = asString(o.action ?? o.travaux ?? o.task ?? o.label);
    if (!action) continue;
    out.push({
      action,
      responsible: asString(o.responsible ?? o.responsable ?? o.owner),
      dueDate: asString(o.due_date ?? o.dueDate ?? o.echeance ?? o.deadline),
    });
  }
  return out;
}

export function parseSiteReportJson(
  rawInput: unknown,
):
  | { ok: true; format: typeof BEWORK_SITE_REPORT_FORMAT; report: SiteReportPayload; importId: string }
  | { ok: false; errors: ParseIssue[] } {
  const errors: ParseIssue[] = [];
  let raw: unknown = rawInput;
  if (typeof rawInput === "string") {
    try {
      raw = JSON.parse(stripCodeFences(rawInput));
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            path: "",
            message: `JSON invalide${e instanceof Error ? ` : ${e.message}` : ""}`,
          },
        ],
      };
    }
  }
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: [{ path: "", message: "Le JSON doit être un objet" }] };
  }
  const root = raw as Record<string, unknown>;
  const format = asString(root.format ?? root.type);
  if (format !== BEWORK_SITE_REPORT_FORMAT) {
    return {
      ok: false,
      errors: [
        {
          path: "format",
          message: `format attendu : ${BEWORK_SITE_REPORT_FORMAT}`,
        },
      ],
    };
  }
  const reportRaw = (root.report ?? root.data ?? root) as Record<string, unknown>;
  if (!reportRaw || typeof reportRaw !== "object") {
    return { ok: false, errors: [{ path: "report", message: "Objet report requis" }] };
  }

  const progressRaw = reportRaw.progress_percent ?? reportRaw.progressPercent;
  let progressPercent: number | null = null;
  if (progressRaw != null && progressRaw !== "") {
    const n = typeof progressRaw === "number" ? progressRaw : Number(String(progressRaw).replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      errors.push({ path: "report.progress_percent", message: "Pourcentage invalide (0–100)" });
    } else {
      progressPercent = n;
    }
  }

  const report = emptySiteReportPayload({
    title: asString(reportRaw.title ?? reportRaw.titre) ?? "",
    reportNumber: asString(reportRaw.report_number ?? reportRaw.reportNumber ?? reportRaw.number) ?? "",
    date: asString(reportRaw.date) ?? new Date().toISOString().slice(0, 10),
    time: asString(reportRaw.time ?? reportRaw.heure),
    weather: asString(reportRaw.weather ?? reportRaw.meteo),
    author: asString(reportRaw.author ?? reportRaw.redacteur ?? reportRaw.rédacteur),
    summary: asString(reportRaw.summary ?? reportRaw.synthese ?? reportRaw.résumé),
    participants: asParticipants(reportRaw.participants),
    workCompleted: asStringList(
      reportRaw.work_completed ?? reportRaw.workCompleted ?? reportRaw.travaux_realises,
    ),
    workInProgress: asStringList(
      reportRaw.work_in_progress ?? reportRaw.workInProgress ?? reportRaw.travaux_en_cours,
    ),
    progressPercent,
    observations: asStringList(reportRaw.observations),
    issues: asStringList(reportRaw.issues ?? reportRaw.problems ?? reportRaw.problemes),
    constraints: asStringList(reportRaw.constraints ?? reportRaw.contraintes),
    delayNote: asString(reportRaw.delay_note ?? reportRaw.delayNote ?? reportRaw.retard),
    decisions: asStringList(reportRaw.decisions),
    clientValidations: asStringList(
      reportRaw.client_validations ?? reportRaw.clientValidations ?? reportRaw.validation_client,
    ),
    clientRequests: asStringList(
      reportRaw.client_requests ?? reportRaw.clientRequests ?? reportRaw.demandes_client,
    ),
    requestedChanges: asStringList(
      reportRaw.requested_changes ?? reportRaw.requestedChanges ?? reportRaw.modifications,
    ),
    safetyObservations: asStringList(
      reportRaw.safety_observations ?? reportRaw.safetyObservations ?? reportRaw.securite,
    ),
    safetyAnomaly: asString(reportRaw.safety_anomaly ?? reportRaw.safetyAnomaly ?? reportRaw.anomalie),
    correctiveActions: asStringList(
      reportRaw.corrective_actions ?? reportRaw.correctiveActions ?? reportRaw.mesures_correctives,
    ),
    nextSteps: asNextSteps(reportRaw.next_steps ?? reportRaw.nextSteps ?? reportRaw.actions),
    plannedWorks: asStringList(
      reportRaw.planned_works ?? reportRaw.plannedWorks ?? reportRaw.travaux_prevus,
    ),
    reservations: asStringList(reportRaw.reservations ?? reportRaw.reserves),
    additionalNotes: asString(
      reportRaw.additional_notes ?? reportRaw.additionalNotes ?? reportRaw.remarques,
    ),
    nextMeeting: asString(
      reportRaw.next_meeting ?? reportRaw.nextMeeting ?? reportRaw.prochaine_visite,
    ),
  });

  if (errors.length) return { ok: false, errors };

  const importId =
    asString(root.import_id ?? root.importId ?? root.id) ??
    `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return { ok: true, format: BEWORK_SITE_REPORT_FORMAT, report, importId };
}

function asPpspsRisks(raw: unknown): PpspsRisk[] {
  if (!Array.isArray(raw)) return [];
  const out: PpspsRisk[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const activity = asString(o.activity ?? o.activite) ?? "";
    const hazard = asString(o.hazard ?? o.danger) ?? "";
    const prevention = asString(o.prevention ?? o.mesure) ?? "";
    if (!activity && !hazard && !prevention) continue;
    out.push({
      activity,
      hazard,
      personsExposed: asString(o.persons_exposed ?? o.personsExposed ?? o.exposes),
      level: asString(o.level ?? o.niveau),
      prevention,
      category: asString(o.category ?? o.categorie),
    });
  }
  return out;
}

function asPpspsParticipants(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const company = asString(o.company ?? o.entreprise ?? o.name);
      if (!company) return null;
      return {
        company,
        responsible: asString(o.responsible ?? o.responsable),
        role: asString(o.role ?? o.fonction),
        phone: asString(o.phone ?? o.telephone),
        email: asString(o.email),
      };
    })
    .filter(Boolean) as PpspsPayload["participants"];
}

function asObj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

export function parsePpspsJson(
  rawInput: unknown,
):
  | { ok: true; format: typeof BEWORK_PPSPS_FORMAT; ppsps: PpspsPayload; importId: string }
  | { ok: false; errors: ParseIssue[] } {
  let raw: unknown = rawInput;
  if (typeof rawInput === "string") {
    try {
      raw = JSON.parse(stripCodeFences(rawInput));
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            path: "",
            message: `JSON invalide${e instanceof Error ? ` : ${e.message}` : ""}`,
          },
        ],
      };
    }
  }
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: [{ path: "", message: "Le JSON doit être un objet" }] };
  }
  const root = raw as Record<string, unknown>;
  const format = asString(root.format ?? root.type);
  if (format !== BEWORK_PPSPS_FORMAT) {
    return {
      ok: false,
      errors: [{ path: "format", message: `format attendu : ${BEWORK_PPSPS_FORMAT}` }],
    };
  }
  const p = asObj(root.ppsps ?? root.data ?? root);
  const project = asObj(p.project ?? p.chantier);
  const company = asObj(p.company ?? p.entreprise);
  const siteOrg = asObj(p.site_organization ?? p.siteOrganization ?? p.organisation);
  const emergency = asObj(p.emergency ?? p.secours);

  const ppsps = emptyPpspsPayload({
    title: asString(p.title ?? p.titre) ?? "PPSPS",
    versionLabel: asString(p.version_label ?? p.versionLabel ?? p.version),
    project: {
      name: asString(project.name ?? project.nom),
      address: asString(project.address ?? project.adresse),
      plannedStart: asString(project.planned_start ?? project.plannedStart ?? project.debut),
      plannedEnd: asString(project.planned_end ?? project.plannedEnd ?? project.fin),
      workforce: asString(project.workforce ?? project.effectif),
      contact: asString(project.contact ?? project.coordonnees),
    },
    company: {
      name: asString(company.name ?? company.nom),
      responsible: asString(company.responsible ?? company.responsable),
      phone: asString(company.phone ?? company.telephone),
      email: asString(company.email),
    },
    participants: asPpspsParticipants(p.participants ?? p.intervenants),
    workDescription: asStringList(
      p.work_description ?? p.workDescription ?? p.description_travaux,
    ),
    workMethods: asStringList(p.work_methods ?? p.workMethods ?? p.methodes),
    workPhases: asStringList(p.work_phases ?? p.workPhases ?? p.phases),
    equipment: asStringList(p.equipment ?? p.materiel ?? p.engins),
    risks: asPpspsRisks(p.risks ?? p.risques),
    ppe: asStringList(p.ppe ?? p.epi),
    siteOrganization: {
      access: asString(siteOrg.access ?? siteOrg.acces),
      circulation: asString(siteOrg.circulation),
      storage: asString(siteOrg.storage ?? siteOrg.stockage),
      delivery: asString(siteOrg.delivery ?? siteOrg.livraison),
      marking: asString(siteOrg.marking ?? siteOrg.balisage),
      workZone: asString(siteOrg.work_zone ?? siteOrg.workZone ?? siteOrg.zone_travail),
      sanitation: asString(siteOrg.sanitation ?? siteOrg.sanitaires),
      waste: asString(siteOrg.waste ?? siteOrg.dechets),
    },
    emergency: {
      procedure: asString(emergency.procedure),
      assemblyPoint: asString(
        emergency.assembly_point ?? emergency.assemblyPoint ?? emergency.rassemblement,
      ),
      firstAid: asString(emergency.first_aid ?? emergency.firstAid ?? emergency.secours),
      kit: asString(emergency.kit ?? emergency.trousse),
      responsible: asString(emergency.responsible ?? emergency.responsable),
    },
    coactivity: asStringList(p.coactivity ?? p.coactivite),
    environment: asStringList(p.environment ?? p.environnement),
    additionalNotes: asStringList(
      p.additional_notes ?? p.additionalNotes ?? p.remarques,
    ),
  });

  const importId =
    asString(root.import_id ?? root.importId ?? root.id) ??
    `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return { ok: true, format: BEWORK_PPSPS_FORMAT, ppsps, importId };
}

/** Fusion sémantique : les champs fournis par ChatGPT remplacent ; le reste est préservé. */
export function mergeSiteReport(
  current: SiteReportPayload,
  incoming: SiteReportPayload,
): SiteReportPayload {
  const pickArr = <T,>(next: T[], prev: T[]) => (next.length ? next : prev);
  const pickStr = (next: string | null | undefined, prev: string | null | undefined) =>
    next != null && String(next).trim() !== "" ? next : prev;

  return {
    title: pickStr(incoming.title, current.title) ?? current.title,
    reportNumber: pickStr(incoming.reportNumber, current.reportNumber) ?? current.reportNumber,
    date: pickStr(incoming.date, current.date) ?? current.date,
    time: pickStr(incoming.time, current.time) ?? null,
    weather: pickStr(incoming.weather, current.weather) ?? null,
    author: pickStr(incoming.author, current.author) ?? null,
    summary: pickStr(incoming.summary, current.summary) ?? null,
    participants: pickArr(incoming.participants, current.participants),
    workCompleted: pickArr(incoming.workCompleted, current.workCompleted),
    workInProgress: pickArr(incoming.workInProgress, current.workInProgress),
    progressPercent:
      incoming.progressPercent != null ? incoming.progressPercent : current.progressPercent,
    observations: pickArr(incoming.observations, current.observations),
    issues: pickArr(incoming.issues, current.issues),
    constraints: pickArr(incoming.constraints, current.constraints),
    delayNote: pickStr(incoming.delayNote, current.delayNote) ?? null,
    decisions: pickArr(incoming.decisions, current.decisions),
    clientValidations: pickArr(incoming.clientValidations, current.clientValidations),
    clientRequests: pickArr(incoming.clientRequests, current.clientRequests),
    requestedChanges: pickArr(incoming.requestedChanges, current.requestedChanges),
    safetyObservations: pickArr(incoming.safetyObservations, current.safetyObservations),
    safetyAnomaly: pickStr(incoming.safetyAnomaly, current.safetyAnomaly) ?? null,
    correctiveActions: pickArr(incoming.correctiveActions, current.correctiveActions),
    nextSteps: pickArr(incoming.nextSteps, current.nextSteps),
    plannedWorks: pickArr(incoming.plannedWorks, current.plannedWorks),
    reservations: pickArr(incoming.reservations, current.reservations),
    additionalNotes: pickStr(incoming.additionalNotes, current.additionalNotes) ?? null,
    nextMeeting: pickStr(incoming.nextMeeting, current.nextMeeting) ?? null,
  };
}

export function mergePpsps(current: PpspsPayload, incoming: PpspsPayload): PpspsPayload {
  const pickArr = <T,>(next: T[], prev: T[]) => (next.length ? next : prev);
  const pickStr = (next: string | null | undefined, prev: string | null | undefined) =>
    next != null && String(next).trim() !== "" ? next : prev;
  const mergeObj = <T extends Record<string, unknown>>(a: T, b: T): T => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) {
      if (v != null && String(v).trim() !== "") (out as Record<string, unknown>)[k] = v;
    }
    return out;
  };

  return {
    title: pickStr(incoming.title, current.title) ?? current.title,
    versionLabel: pickStr(incoming.versionLabel, current.versionLabel) ?? null,
    project: mergeObj(current.project as Record<string, unknown>, incoming.project as Record<string, unknown>) as PpspsPayload["project"],
    company: mergeObj(current.company as Record<string, unknown>, incoming.company as Record<string, unknown>) as PpspsPayload["company"],
    participants: pickArr(incoming.participants, current.participants),
    workDescription: pickArr(incoming.workDescription, current.workDescription),
    workMethods: pickArr(incoming.workMethods, current.workMethods),
    workPhases: pickArr(incoming.workPhases, current.workPhases),
    equipment: pickArr(incoming.equipment, current.equipment),
    risks: pickArr(incoming.risks, current.risks),
    ppe: pickArr(incoming.ppe, current.ppe),
    siteOrganization: mergeObj(
      current.siteOrganization as Record<string, unknown>,
      incoming.siteOrganization as Record<string, unknown>,
    ) as PpspsPayload["siteOrganization"],
    emergency: mergeObj(
      current.emergency as Record<string, unknown>,
      incoming.emergency as Record<string, unknown>,
    ) as PpspsPayload["emergency"],
    coactivity: pickArr(incoming.coactivity, current.coactivity),
    environment: pickArr(incoming.environment, current.environment),
    additionalNotes: pickArr(incoming.additionalNotes, current.additionalNotes),
  };
}
