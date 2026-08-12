import type { jsPDF } from "jspdf";
import type { Rgb } from "@/lib/commercial/pdf/colors";

/**
 * Décoration vectorielle discrète (plan architectural abstrait).
 * Opacité visuelle ≈ 2–4 % via gris très clair — impression N&B safe.
 */
export function drawArchitecturalWatermark(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  brand: Rgb,
) {
  const ink: Rgb = [
    Math.round(brand[0] * 0.15 + 240 * 0.85),
    Math.round(brand[1] * 0.15 + 240 * 0.85),
    Math.round(brand[2] * 0.15 + 240 * 0.85),
  ];
  doc.setDrawColor(...ink);
  doc.setLineWidth(0.15);

  const ox = pageW - 58;
  const oy = 28;
  // Grille légère
  for (let i = 0; i < 5; i++) {
    doc.line(ox + i * 8, oy, ox + i * 8, oy + 36);
  }
  for (let j = 0; j < 4; j++) {
    doc.line(ox, oy + j * 9, ox + 32, oy + j * 9);
  }
  // Silhouette bâtiment abstraite
  doc.setLineWidth(0.25);
  doc.line(ox + 4, oy + 34, ox + 4, oy + 12);
  doc.line(ox + 4, oy + 12, ox + 14, oy + 6);
  doc.line(ox + 14, oy + 6, ox + 14, oy + 34);
  doc.line(ox + 14, oy + 18, ox + 26, oy + 18);
  doc.line(ox + 26, oy + 18, ox + 26, oy + 34);
  doc.line(ox + 4, oy + 34, ox + 26, oy + 34);

  // Trait bas de page discret
  doc.setLineWidth(0.2);
  doc.line(18, pageH - 16, pageW - 18, pageH - 16);
}

/** Filigrane BROUILLON — lisibilité préservée. */
export function drawDraftWatermark(doc: jsPDF, pageW: number, pageH: number) {
  doc.setTextColor(235, 238, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(54);
  doc.text("BROUILLON", pageW / 2, pageH / 2, {
    align: "center",
    angle: 32,
  });
}
