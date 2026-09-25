import type { jsPDF } from "jspdf";
import { DEMO_WATERMARK } from "@/lib/preparation/types";

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

/**
 * Filigrane devis de démonstration — visible sur chaque page, non contractuel.
 */
export function drawDemoWatermark(doc: jsPDF, pageW: number, pageH: number) {
  doc.setTextColor(248, 236, 220);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(DEMO_WATERMARK, pageW / 2, pageH / 2, {
    align: "center",
    angle: 28,
  });
  doc.setTextColor(180, 120, 40);
  doc.setFontSize(8);
  doc.text(DEMO_WATERMARK, pageW / 2, 8, { align: "center" });
}
