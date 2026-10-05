import { jsPDF } from "jspdf";
import { DEFAULT_BRAND, INK, MUTED, RULE, SLATE, tint } from "@/lib/commercial/pdf/colors";
import { fmtDate, pdfSafe } from "@/lib/commercial/pdf/format";

export type ProjectPdfMeta = {
  projectTitle: string;
  clientLabel?: string | null;
  siteAddress?: string | null;
  siteCity?: string | null;
  companyLabel?: string | null;
  editedAt?: Date;
  revisionLabel?: string | null;
};

export function createDoc(orientation: "portrait" | "landscape" = "portrait", format: "a4" | "a3" = "a4") {
  return new jsPDF({ unit: "mm", format, orientation });
}

export function ensureSpace(doc: jsPDF, y: number, need: number, margin = 16): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - 14) {
    doc.addPage();
    return margin;
  }
  return y;
}

export function drawDocHeader(doc: jsPDF, title: string, subtitle: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DEFAULT_BRAND);
  doc.rect(0, 0, w, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(pdfSafe(title), 14, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(pdfSafe(subtitle), 14, 17);
  doc.setTextColor(...INK);
}

export function drawDocFooter(doc: jsPDF, ref: string) {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.line(14, h - 10, w - 14, h - 10);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(ref), 14, h - 6);
    doc.text(`${i} / ${pageCount}`, w - 14, h - 6, { align: "right" });
  }
}

export function sectionTitle(doc: jsPDF, y: number, label: string): number {
  y = ensureSpace(doc, y, 12);
  const bg = tint(DEFAULT_BRAND, 0.92);
  doc.setFillColor(...bg);
  doc.roundedRect(12, y - 3.5, doc.internal.pageSize.getWidth() - 24, 7.5, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...DEFAULT_BRAND);
  doc.text(pdfSafe(label), 14, y + 1.5);
  doc.setTextColor(...INK);
  return y + 9;
}

export function kv(doc: jsPDF, y: number, label: string, value?: string | null): number {
  if (!value?.trim()) return y;
  y = ensureSpace(doc, y, 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(pdfSafe(label), 14, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE);
  const maxW = doc.internal.pageSize.getWidth() - 62;
  const wrapped = doc.splitTextToSize(pdfSafe(value), maxW) as string[];
  doc.text(wrapped, 48, y);
  return y + Math.max(5.5, wrapped.length * 4.2) + 0.8;
}

export function writeLines(doc: jsPDF, y: number, lines: string[], bullet = true): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  const maxW = doc.internal.pageSize.getWidth() - 32;
  for (const line of lines) {
    if (!line?.trim()) continue;
    const text = bullet ? `• ${line}` : line;
    const wrapped = doc.splitTextToSize(pdfSafe(text), maxW) as string[];
    for (const row of wrapped) {
      y = ensureSpace(doc, y, 5.5);
      doc.text(row, 16, y);
      y += 4.6;
    }
    y += 0.8;
  }
  return y + 1.5;
}

export function metaSubtitle(meta: ProjectPdfMeta): string {
  const bits = [
    meta.projectTitle,
    meta.clientLabel,
    [meta.siteAddress, meta.siteCity].filter(Boolean).join(", ") || null,
    meta.revisionLabel,
    `Édité le ${fmtDate(meta.editedAt ?? new Date())}`,
  ].filter(Boolean);
  return bits.join("  ·  ");
}

export function provenanceLabel(raw: string | null | undefined): string {
  const p = (raw ?? "").toUpperCase();
  if (p.includes("HYPOTH") || p === "HYPOTHESIS") return "Hypothèse — à confirmer";
  if (p.includes("MEASURE") || p.includes("RELEVE") || p === "PLAN") return "Mesure / relevé";
  if (p.includes("MANUAL") || p.includes("SAISIE")) return "Saisie manuelle";
  if (p.includes("CALC") || p.includes("FORMULE")) return "Calcul";
  if (p.includes("A_VERIFIER") || p.includes("VERIFY")) return "À vérifier";
  return raw?.trim() || "—";
}
