import { fmtDate, fmtQty, pdfSafe } from "@/lib/commercial/pdf/format";
import { RULE, SLATE, WASH_GRAY } from "@/lib/commercial/pdf/colors";
import {
  createDoc,
  drawDocFooter,
  drawDocHeader,
  ensureSpace,
  kv,
  metaSubtitle,
  provenanceLabel,
  sectionTitle,
  type ProjectPdfMeta,
} from "@/lib/chantier/pdf/shared";

export type TakeoffPdfLine = {
  code: string;
  lot: string;
  designation: string;
  quantity: number | null;
  unit: string;
  provenance: string | null;
  notes?: string | null;
};

export function generateTakeoffPdf(input: {
  meta: ProjectPdfMeta;
  versionLabel: string;
  statusLabel?: string | null;
  lines: TakeoffPdfLine[];
}): Uint8Array {
  const doc = createDoc("portrait", "a4");
  drawDocHeader(doc, "MÉTRÉ DE CHANTIER", metaSubtitle(input.meta));
  let y = 30;
  y = kv(doc, y, "Chantier", input.meta.projectTitle);
  y = kv(doc, y, "Client", input.meta.clientLabel);
  y = kv(
    doc,
    y,
    "Adresse",
    [input.meta.siteAddress, input.meta.siteCity].filter(Boolean).join(", "),
  );
  y = kv(doc, y, "Version", input.versionLabel);
  y = kv(doc, y, "Statut", input.statusLabel);
  y = kv(doc, y, "Édition", fmtDate(input.meta.editedAt ?? new Date()));
  y += 2;

  y = sectionTitle(doc, y, "Lignes de métré");
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE);

  const pageW = doc.internal.pageSize.getWidth();
  const cols = {
    code: 14,
    lot: 32,
    des: 58,
    qty: pageW - 78,
    unit: pageW - 52,
    prov: pageW - 38,
  };

  const drawTableHeader = (yy: number) => {
    doc.setFillColor(...WASH_GRAY);
    doc.rect(12, yy - 3.5, pageW - 24, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Code", cols.code, yy);
    doc.text("Lot", cols.lot, yy);
    doc.text("Désignation", cols.des, yy);
    doc.text("Qté", cols.qty, yy, { align: "right" });
    doc.text("U", cols.unit, yy);
    doc.text("Provenance", cols.prov, yy);
    return yy + 6;
  };

  y = drawTableHeader(y);
  doc.setFont("helvetica", "normal");

  for (const line of input.lines) {
    const desLines = doc.splitTextToSize(pdfSafe(line.designation), 48) as string[];
    const prov = provenanceLabel(line.provenance);
    const provLines = doc.splitTextToSize(pdfSafe(prov), 34) as string[];
    const rowH = Math.max(6, desLines.length * 3.8, provLines.length * 3.8) + 1.5;
    if (y + rowH > doc.internal.pageSize.getHeight() - 16) {
      doc.addPage();
      y = 16;
      y = drawTableHeader(y);
      doc.setFont("helvetica", "normal");
    }
    doc.setDrawColor(...RULE);
    doc.line(12, y + rowH - 1, pageW - 12, y + rowH - 1);
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(pdfSafe(line.code), cols.code, y + 2.5);
    doc.text(pdfSafe(line.lot || "—"), cols.lot, y + 2.5);
    doc.text(desLines, cols.des, y + 2.5);
    doc.text(
      line.quantity == null ? "—" : fmtQty(line.quantity),
      cols.qty,
      y + 2.5,
      { align: "right" },
    );
    doc.text(pdfSafe(line.unit || "—"), cols.unit, y + 2.5);
    doc.text(provLines, cols.prov, y + 2.5);
    y += rowH;
  }

  const hypotheses = input.lines.filter((l) =>
    (l.provenance ?? "").toUpperCase().includes("HYPOTH"),
  );
  if (hypotheses.length > 0) {
    y = ensureSpace(doc, y + 4, 16);
    y = sectionTitle(doc, y, "Attention — hypothèses");
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE);
    doc.text(
      pdfSafe(
        `${hypotheses.length} ligne(s) marquée(s) comme hypothèse — ne pas traiter comme mesure certaine.`,
      ),
      14,
      y,
    );
  }

  drawDocFooter(doc, `${input.meta.projectTitle} · Métré ${input.versionLabel}`);
  return new Uint8Array(doc.output("arraybuffer"));
}
