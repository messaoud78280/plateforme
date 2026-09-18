/**
 * PDF Comptes rendus & PPSPS — jsPDF, sans IA.
 */
import { jsPDF } from "jspdf";
import { DEFAULT_BRAND, INK, MUTED, RULE, SLATE, tint } from "@/lib/commercial/pdf/colors";
import { fmtDate, pdfSafe } from "@/lib/commercial/pdf/format";
import type { PpspsPayload, SiteReportPayload } from "@/lib/site-documents/types";

type Meta = {
  projectTitle: string;
  siteAddress?: string | null;
  clientLabel?: string | null;
  companyLabel?: string | null;
  number: string;
  status: string;
};

function ensureSpace(doc: jsPDF, y: number, need: number, margin = 18): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - 16) {
    doc.addPage();
    return margin;
  }
  return y;
}

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DEFAULT_BRAND);
  doc.rect(0, 0, w, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(pdfSafe(title), 16, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(pdfSafe(subtitle), 16, 20);
  doc.setTextColor(...INK);
}

function drawFooter(doc: jsPDF, ref: string) {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.line(16, h - 12, w - 16, h - 12);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(ref), 16, h - 7);
    doc.text(`${i} / ${pageCount}`, w - 16, h - 7, { align: "right" });
  }
}

function sectionTitle(doc: jsPDF, y: number, label: string): number {
  y = ensureSpace(doc, y, 14);
  const bg = tint(DEFAULT_BRAND, 0.9);
  doc.setFillColor(...bg);
  doc.roundedRect(14, y - 4, doc.internal.pageSize.getWidth() - 28, 8, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DEFAULT_BRAND);
  doc.text(pdfSafe(label), 16, y + 1.5);
  doc.setTextColor(...INK);
  return y + 10;
}

function writeLines(doc: jsPDF, y: number, lines: string[], bullet = true): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE);
  const maxW = doc.internal.pageSize.getWidth() - 36;
  for (const line of lines) {
    const text = bullet ? `• ${line}` : line;
    const wrapped = doc.splitTextToSize(pdfSafe(text), maxW) as string[];
    for (const row of wrapped) {
      y = ensureSpace(doc, y, 6);
      doc.text(row, 18, y);
      y += 5;
    }
    y += 1;
  }
  return y + 2;
}

function kv(doc: jsPDF, y: number, label: string, value?: string | null): number {
  if (!value?.trim()) return y;
  y = ensureSpace(doc, y, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(pdfSafe(label), 16, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE);
  const wrapped = doc.splitTextToSize(pdfSafe(value), doc.internal.pageSize.getWidth() - 70) as string[];
  doc.text(wrapped, 52, y);
  return y + Math.max(6, wrapped.length * 4.5) + 1;
}

export function generateSiteReportPdf(input: {
  meta: Meta;
  payload: SiteReportPayload;
}): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { meta, payload } = input;
  drawHeader(
    doc,
    "COMPTE RENDU DE CHANTIER",
    `${meta.number}  ·  ${payload.date ? fmtDate(new Date(payload.date)) : fmtDate(new Date())}`,
  );

  let y = 36;
  y = kv(doc, y, "Chantier", meta.projectTitle);
  y = kv(doc, y, "Adresse", meta.siteAddress);
  y = kv(doc, y, "Client", meta.clientLabel);
  y = kv(doc, y, "Entreprise", meta.companyLabel);
  y = kv(doc, y, "Rédacteur", payload.author ?? meta.companyLabel);
  y = kv(doc, y, "Météo", payload.weather);
  y = kv(doc, y, "Heure", payload.time);
  if (payload.summary) {
    y = sectionTitle(doc, y + 2, "Synthèse");
    y = writeLines(doc, y, [payload.summary], false);
  }
  if (payload.participants.length) {
    y = sectionTitle(doc, y, "Participants");
    y = writeLines(
      doc,
      y,
      payload.participants.map(
        (p) =>
          [p.name, p.company, p.role].filter(Boolean).join(" — "),
      ),
    );
  }
  if (payload.workCompleted.length) {
    y = sectionTitle(doc, y, "Travaux réalisés");
    y = writeLines(doc, y, payload.workCompleted);
  }
  if (payload.workInProgress.length) {
    y = sectionTitle(doc, y, "Travaux en cours");
    y = writeLines(doc, y, payload.workInProgress);
  }
  if (payload.progressPercent != null) {
    y = kv(doc, y, "Avancement", `${payload.progressPercent} %`);
  }
  if (payload.observations.length) {
    y = sectionTitle(doc, y, "Observations");
    y = writeLines(doc, y, payload.observations);
  }
  if (payload.issues.length) {
    y = sectionTitle(doc, y, "Problèmes rencontrés");
    y = writeLines(doc, y, payload.issues);
  }
  if (payload.constraints.length) {
    y = sectionTitle(doc, y, "Contraintes");
    y = writeLines(doc, y, payload.constraints);
  }
  if (payload.delayNote) {
    y = kv(doc, y, "Retard", payload.delayNote);
  }
  if (payload.decisions.length) {
    y = sectionTitle(doc, y, "Décisions");
    y = writeLines(doc, y, payload.decisions);
  }
  if (payload.clientRequests.length || payload.clientValidations.length) {
    y = sectionTitle(doc, y, "Demandes / validations client");
    y = writeLines(doc, y, [
      ...payload.clientValidations.map((x) => `Validation : ${x}`),
      ...payload.clientRequests,
      ...payload.requestedChanges.map((x) => `Modification : ${x}`),
    ]);
  }
  if (payload.safetyObservations.length || payload.safetyAnomaly || payload.correctiveActions.length) {
    y = sectionTitle(doc, y, "Sécurité");
    y = writeLines(doc, y, [
      ...payload.safetyObservations,
      ...(payload.safetyAnomaly ? [`Anomalie : ${payload.safetyAnomaly}`] : []),
      ...payload.correctiveActions.map((x) => `Correctif : ${x}`),
    ]);
  }
  if (payload.plannedWorks.length || payload.nextSteps.length) {
    y = sectionTitle(doc, y, "Prochaines étapes");
    y = writeLines(doc, y, [
      ...payload.plannedWorks,
      ...payload.nextSteps.map((s) =>
        [s.action, s.responsible, s.dueDate].filter(Boolean).join(" — "),
      ),
    ]);
  }
  if (payload.reservations.length) {
    y = sectionTitle(doc, y, "Réserves");
    y = writeLines(doc, y, payload.reservations);
  }
  if (payload.nextMeeting || payload.additionalNotes) {
    y = sectionTitle(doc, y, "Autres");
    if (payload.nextMeeting) y = kv(doc, y, "Prochaine visite", payload.nextMeeting);
    if (payload.additionalNotes) y = writeLines(doc, y, [payload.additionalNotes], false);
  }

  drawFooter(doc, `${meta.projectTitle} · ${meta.number}`);
  return new Uint8Array(doc.output("arraybuffer"));
}

export function generatePpspsPdf(input: {
  meta: Meta;
  payload: PpspsPayload;
}): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { meta, payload } = input;
  const w = doc.internal.pageSize.getWidth();

  // Page de garde
  doc.setFillColor(...DEFAULT_BRAND);
  doc.rect(0, 0, w, 297, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("PPSPS", 16, 60);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Plan Particulier de Sécurité", 16, 72);
  doc.text("et de Protection de la Santé", 16, 80);
  doc.setFontSize(11);
  doc.text(pdfSafe(meta.projectTitle), 16, 110);
  if (meta.siteAddress) doc.text(pdfSafe(meta.siteAddress), 16, 118);
  if (meta.companyLabel) doc.text(pdfSafe(meta.companyLabel), 16, 126);
  doc.text(pdfSafe(`${meta.number} · ${payload.versionLabel || "Version 1"}`), 16, 140);
  doc.text(fmtDate(new Date()), 16, 148);
  doc.setFontSize(8);
  doc.text(
    "Document préparé à partir des informations renseignées dans BeWork.\nIl doit être vérifié, complété et validé par le responsable compétent avant diffusion.",
    16,
    250,
  );

  doc.addPage();
  drawHeader(doc, "PPSPS", `${meta.number} · ${payload.versionLabel || ""}`);
  let y = 36;

  y = sectionTitle(doc, y, "Informations générales");
  y = kv(doc, y, "Chantier", payload.project.name || meta.projectTitle);
  y = kv(doc, y, "Adresse", payload.project.address || meta.siteAddress);
  y = kv(doc, y, "Entreprise", payload.company.name || meta.companyLabel);
  y = kv(doc, y, "Responsable", payload.company.responsible);
  y = kv(doc, y, "Effectif", payload.project.workforce);
  y = kv(doc, y, "Période", [payload.project.plannedStart, payload.project.plannedEnd].filter(Boolean).join(" → "));

  if (payload.participants.length) {
    y = sectionTitle(doc, y, "Intervenants");
    y = writeLines(
      doc,
      y,
      payload.participants.map((p) =>
        [p.company, p.responsible, p.role, p.phone].filter(Boolean).join(" — "),
      ),
    );
  }
  if (payload.workDescription.length || payload.workMethods.length || payload.workPhases.length) {
    y = sectionTitle(doc, y, "Description des travaux");
    y = writeLines(doc, y, [
      ...payload.workDescription,
      ...payload.workMethods.map((m) => `Méthode : ${m}`),
      ...payload.workPhases.map((p) => `Phase : ${p}`),
    ]);
  }
  if (payload.equipment.length) {
    y = sectionTitle(doc, y, "Matériel / engins");
    y = writeLines(doc, y, payload.equipment);
  }
  if (payload.risks.length) {
    y = sectionTitle(doc, y, "Risques et prévention");
    for (const r of payload.risks) {
      y = writeLines(
        doc,
        y,
        [
          [
            r.category ? `[${r.category}] ` : "",
            r.activity,
            r.hazard ? `— Danger : ${r.hazard}` : "",
            r.personsExposed ? `— Exposés : ${r.personsExposed}` : "",
          ]
            .join(" ")
            .trim(),
          r.prevention ? `Prévention : ${r.prevention}` : "",
        ].filter(Boolean),
        true,
      );
    }
  }
  if (payload.ppe.length) {
    y = sectionTitle(doc, y, "EPI");
    y = writeLines(doc, y, payload.ppe);
  }
  {
    const org = payload.siteOrganization;
    const lines = [
      org.access && `Accès : ${org.access}`,
      org.circulation && `Circulation : ${org.circulation}`,
      org.storage && `Stockage : ${org.storage}`,
      org.delivery && `Livraison : ${org.delivery}`,
      org.marking && `Balisage : ${org.marking}`,
      org.workZone && `Zone de travail : ${org.workZone}`,
      org.sanitation && `Sanitaires : ${org.sanitation}`,
      org.waste && `Déchets : ${org.waste}`,
    ].filter(Boolean) as string[];
    if (lines.length) {
      y = sectionTitle(doc, y, "Organisation du chantier");
      y = writeLines(doc, y, lines);
    }
  }
  {
    const e = payload.emergency;
    const lines = [
      e.procedure && `Procédure : ${e.procedure}`,
      e.assemblyPoint && `Rassemblement : ${e.assemblyPoint}`,
      e.firstAid && `Secours : ${e.firstAid}`,
      e.kit && `Trousse : ${e.kit}`,
      e.responsible && `Responsable : ${e.responsible}`,
    ].filter(Boolean) as string[];
    if (lines.length) {
      y = sectionTitle(doc, y, "Secours");
      y = writeLines(doc, y, lines);
    }
  }
  if (payload.coactivity.length) {
    y = sectionTitle(doc, y, "Coactivité");
    y = writeLines(doc, y, payload.coactivity);
  }
  if (payload.environment.length || payload.additionalNotes.length) {
    y = sectionTitle(doc, y, "Remarques");
    y = writeLines(doc, y, [...payload.environment, ...payload.additionalNotes]);
  }

  y = ensureSpace(doc, y, 20);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    "Document à vérifier et valider par le responsable compétent avant diffusion.",
    16,
    y + 6,
  );

  drawFooter(doc, `${meta.projectTitle} · ${meta.number}`);
  return new Uint8Array(doc.output("arraybuffer"));
}
