import { jsPDF } from "jspdf";
import { BEWORK_PDF, drawBeworkAccentLine } from "@/lib/be-work-brand-pdf";

/** Markdown léger → lignes texte pour PDF. */
export function markdownToPlainLines(markdown: string): string[] {
  const lines: string[] = [];
  for (const raw of markdown.split("\n")) {
    let line = raw.trimEnd();
    if (!line.trim()) {
      lines.push("");
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      line = line.replace(/^#{1,6}\s+/, "").toUpperCase();
    }
    line = line.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
    line = line.replace(/^[-*]\s+/, "• ");
    line = line.replace(/^>\s*/, "");
    if (line.startsWith("|") && line.endsWith("|")) continue;
    lines.push(line);
  }
  return lines;
}

export function buildCctpPdfBuffer(opts: {
  title: string;
  markdown: string;
  lot?: string;
}): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 18;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - 2 * margin;
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BEWORK_PDF.navy);
  doc.text(opts.title.slice(0, 80), margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BEWORK_PDF.muted);
  const sub = [opts.lot ? `Lot : ${opts.lot}` : null, `Généré le ${new Date().toLocaleString("fr-FR")}`]
    .filter(Boolean)
    .join(" · ");
  doc.text(sub, margin, y);
  y += 4;
  drawBeworkAccentLine(doc, y, margin, pageW);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BEWORK_PDF.ink);

  const lines = markdownToPlainLines(opts.markdown);
  for (const line of lines) {
    if (y > pageH - 22) {
      doc.addPage();
      y = 20;
    }
    if (!line) {
      y += 4;
      continue;
    }
    const isHeading = line === line.toUpperCase() && line.length < 90 && !line.startsWith("•");
    if (isHeading && line.length > 3) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      y += 2;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }
    const wrapped = doc.splitTextToSize(line, maxW) as string[];
    for (const w of wrapped) {
      if (y > pageH - 18) {
        doc.addPage();
        y = 20;
      }
      doc.text(w, margin, y);
      y += isHeading ? 6.5 : 5;
    }
    y += 1;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...BEWORK_PDF.muted);
    doc.text(`BeWork — Skill CCTP — ${p} / ${totalPages}`, pageW / 2, pageH - 10, { align: "center" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
