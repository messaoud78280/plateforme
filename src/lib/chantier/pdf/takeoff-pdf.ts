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

/** Largeurs colonnes (mm) — empêche le lot de déborder sur la désignation. */
function takeoffColumns(pageW: number) {
  const right = pageW - 12;
  const code = { x: 14, w: 18 };
  const lot = { x: 33, w: 30 };
  const des = { x: 65, w: 0 };
  const unit = { x: right - 46, w: 10 };
  const qty = { x: unit.x - 3 }; // align right juste avant U
  const prov = { x: unit.x + unit.w + 1, w: right - (unit.x + unit.w + 1) };
  des.w = qty.x - 14 - des.x; // réserve ~14 mm pour la quantité
  return { code, lot, des, qty, unit, prov };
}

export function generateTakeoffPdf(input: {
  meta: ProjectPdfMeta;
  versionLabel: string;
  statusLabel?: string | null;
  lines: TakeoffPdfLine[];
}): Uint8Array {
  const doc = createDoc("portrait", "a4");
  const headerBottom = drawDocHeader(
    doc,
    "MÉTRÉ DE CHANTIER",
    metaSubtitle(input.meta),
  );
  let y = headerBottom + 8;
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
  const cols = takeoffColumns(pageW);
  const lineH = 3.6;

  const drawTableHeader = (yy: number) => {
    doc.setFillColor(...WASH_GRAY);
    doc.rect(12, yy - 3.5, pageW - 24, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text("Code", cols.code.x, yy);
    doc.text("Lot", cols.lot.x, yy);
    doc.text("Désignation", cols.des.x, yy);
    doc.text("Qté", cols.qty.x, yy, { align: "right" });
    doc.text("U", cols.unit.x, yy);
    doc.text("Provenance", cols.prov.x, yy);
    return yy + 6;
  };

  y = drawTableHeader(y);
  doc.setFont("helvetica", "normal");

  for (const line of input.lines) {
    const codeLines = doc.splitTextToSize(
      pdfSafe(line.code || "—"),
      cols.code.w,
    ) as string[];
    const lotLines = doc.splitTextToSize(
      pdfSafe(line.lot || "—"),
      cols.lot.w,
    ) as string[];
    const desLines = doc.splitTextToSize(
      pdfSafe(line.designation || "—"),
      cols.des.w,
    ) as string[];
    const prov = provenanceLabel(line.provenance);
    const provLines = doc.splitTextToSize(
      pdfSafe(prov),
      cols.prov.w,
    ) as string[];
    const rowH =
      Math.max(
        6,
        codeLines.length * lineH,
        lotLines.length * lineH,
        desLines.length * lineH,
        provLines.length * lineH,
      ) + 1.8;

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
    const textY = y + 2.5;
    doc.text(codeLines, cols.code.x, textY);
    doc.text(lotLines, cols.lot.x, textY);
    doc.text(desLines, cols.des.x, textY);
    doc.text(
      line.quantity == null ? "—" : fmtQty(line.quantity),
      cols.qty.x,
      textY,
      { align: "right" },
    );
    doc.text(pdfSafe(line.unit || "—"), cols.unit.x, textY);
    doc.text(provLines, cols.prov.x, textY);
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
    const note = doc.splitTextToSize(
      pdfSafe(
        `${hypotheses.length} ligne(s) marquée(s) comme hypothèse — ne pas traiter comme mesure certaine.`,
      ),
      pageW - 28,
    ) as string[];
    doc.text(note, 14, y);
  }

  drawDocFooter(doc, `${input.meta.projectTitle} · Métré ${input.versionLabel}`);
  return new Uint8Array(doc.output("arraybuffer"));
}
