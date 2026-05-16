/**
 * Couleurs & styles PDF alignés sur la charte BeWork (globals.css + module Devis).
 * Réf. : #1e3a5f (navy Devis), accent #2563eb / #1d4ed8, fond #f8fafc, panneaux #eff6ff.
 */
export const BEWORK_PDF = {
  /** Navy principal (boutons Devis, titres forts) */
  navy: [30, 58, 95] as [number, number, number],
  navyDark: [21, 42, 69] as [number, number, number],
  navyInk: [15, 39, 68] as [number, number, number],
  /** Accent bleu acier (site, liens, grille blueprint) */
  accent: [37, 99, 235] as [number, number, number],
  accentDark: [29, 78, 216] as [number, number, number],
  /** Textes */
  ink: [30, 41, 59] as [number, number, number],
  slate: [51, 65, 85] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  /** Fonds & bordures (cartes surface-metallic-*) */
  paper: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  panelBlue: [239, 246, 255] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  borderAccent: [191, 219, 254] as [number, number, number],
  /** Grille blueprint (très légère) */
  gridMajor: [37, 99, 235] as [number, number, number],
  gridMinor: [148, 163, 184] as [number, number, number],
} as const;

/** Trait d’accent sous l’en-tête (effet card-frame / plan). */
export function drawBeworkAccentLine(doc: import("jspdf").jsPDF, y: number, margin: number, pageW: number) {
  const w = pageW - 2 * margin;
  const steps = 24;
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const alpha = t < 0.35 ? t / 0.35 : t > 0.65 ? (1 - t) / 0.35 : 1;
    const r = Math.round(BEWORK_PDF.accentDark[0] * alpha + 255 * (1 - alpha));
    const g = Math.round(BEWORK_PDF.accentDark[1] * alpha + 255 * (1 - alpha));
    const b = Math.round(BEWORK_PDF.accentDark[2] * alpha + 255 * (1 - alpha));
    doc.setFillColor(r, g, b);
    doc.rect(margin + i * stepW, y, stepW + 0.2, 0.6, "F");
  }
}

/** Grille millimétrée discrète (fond page, esprit blueprint). */
export function drawBeworkBlueprintGrid(
  doc: import("jspdf").jsPDF,
  pageW: number,
  pageH: number,
  margin: number,
) {
  doc.setDrawColor(BEWORK_PDF.gridMajor[0], BEWORK_PDF.gridMajor[1], BEWORK_PDF.gridMajor[2]);
  doc.setLineWidth(0.04);
  const major = 10;
  for (let x = margin; x <= pageW - margin; x += major) {
    doc.line(x, margin, x, pageH - margin);
  }
  for (let y = margin; y <= pageH - margin; y += major) {
    doc.line(margin, y, pageW - margin, y);
  }
  doc.setDrawColor(BEWORK_PDF.gridMinor[0], BEWORK_PDF.gridMinor[1], BEWORK_PDF.gridMinor[2]);
  doc.setLineWidth(0.02);
  const minor = 2.5;
  for (let x = margin; x <= pageW - margin; x += minor) {
    doc.line(x, margin, x, pageH - margin);
  }
  for (let y = margin; y <= pageH - margin; y += minor) {
    doc.line(margin, y, pageW - margin, y);
  }
}
