import { fmtDate, pdfSafe } from "@/lib/commercial/pdf/format";
import {
  createDoc,
  drawDocFooter,
  drawDocHeader,
  kv,
  metaSubtitle,
  sectionTitle,
  writeLines,
  type ProjectPdfMeta,
} from "@/lib/chantier/pdf/shared";

export function generateFollowUpPdf(input: {
  meta: ProjectPdfMeta;
  sheetTitle: string;
  statusLabel?: string | null;
  progressPercent?: number | null;
  interventions?: string[];
  teams?: string[];
  observations?: string[];
  reservations?: string[];
  blockers?: string[];
  decisions?: string[];
  nextActions?: string[];
}): Uint8Array {
  const doc = createDoc("portrait", "a4");
  const headerBottom = drawDocHeader(
    doc,
    "SUIVI CHANTIER",
    metaSubtitle(input.meta),
  );
  let y = headerBottom + 8;
  y = kv(doc, y, "Chantier", input.meta.projectTitle);
  y = kv(doc, y, "Fiche", input.sheetTitle);
  y = kv(doc, y, "Client", input.meta.clientLabel);
  y = kv(
    doc,
    y,
    "Adresse",
    [input.meta.siteAddress, input.meta.siteCity].filter(Boolean).join(", "),
  );
  y = kv(doc, y, "Statut", input.statusLabel);
  y = kv(
    doc,
    y,
    "Avancement",
    input.progressPercent != null ? `${input.progressPercent} %` : null,
  );
  y = kv(doc, y, "Date", fmtDate(input.meta.editedAt ?? new Date()));
  y += 2;

  if (input.teams?.length) {
    y = sectionTitle(doc, y, "Équipes");
    y = writeLines(doc, y, input.teams);
  }
  if (input.interventions?.length) {
    y = sectionTitle(doc, y, "Interventions");
    y = writeLines(doc, y, input.interventions);
  }
  if (input.observations?.length) {
    y = sectionTitle(doc, y, "Observations");
    y = writeLines(doc, y, input.observations);
  }
  if (input.blockers?.length) {
    y = sectionTitle(doc, y, "Points bloquants");
    y = writeLines(doc, y, input.blockers);
  }
  if (input.reservations?.length) {
    y = sectionTitle(doc, y, "Réserves");
    y = writeLines(doc, y, input.reservations);
  }
  if (input.decisions?.length) {
    y = sectionTitle(doc, y, "Décisions");
    y = writeLines(doc, y, input.decisions);
  }
  if (input.nextActions?.length) {
    y = sectionTitle(doc, y, "Prochaines actions");
    y = writeLines(doc, y, input.nextActions);
  }

  if (
    !input.interventions?.length &&
    !input.observations?.length &&
    !input.blockers?.length &&
    !input.nextActions?.length
  ) {
    y = sectionTitle(doc, y, "État");
    y = writeLines(doc, y, [
      "Aucun détail structuré disponible pour l’instant — fiche ouverte pour suivi.",
    ]);
  }

  drawDocFooter(doc, `${pdfSafe(input.meta.projectTitle)} · Suivi`);
  return new Uint8Array(doc.output("arraybuffer"));
}
