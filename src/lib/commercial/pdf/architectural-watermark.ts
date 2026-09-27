import type { jsPDF } from "jspdf";
import { DEMO_WATERMARK } from "@/lib/preparation/types";

/**
 * Filigrane BROUILLON — sous le contenu, contraste bas.
 * Visible en regardant la page, sans gêner la lecture des montants.
 */
export function drawDraftWatermark(doc: jsPDF, pageW: number, pageH: number) {
  doc.setTextColor(244, 246, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("BROUILLON", pageW / 2, pageH / 2, {
    align: "center",
    angle: 28,
  });
}

/**
 * Filigrane devis de démonstration — très léger, lisibilité prioritaire.
 * Le badge d’en-tête porte l’information principale.
 */
export function drawDemoWatermark(doc: jsPDF, pageW: number, pageH: number) {
  doc.setTextColor(250, 246, 240);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(DEMO_WATERMARK, pageW / 2, pageH / 2, {
    align: "center",
    angle: 28,
  });
}
