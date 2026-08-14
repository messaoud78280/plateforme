import type { jsPDF } from "jspdf";

/**
 * Filigrane BROUILLON — sous le contenu, contraste bas.
 * Visible en regardant la page, sans gêner la lecture des montants.
 */
export function drawDraftWatermark(doc: jsPDF, pageW: number, pageH: number) {
  doc.setTextColor(242, 244, 247);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text("BROUILLON", pageW / 2, pageH / 2, {
    align: "center",
    angle: 28,
  });
}
