import type { jsPDF } from "jspdf";

/**
 * Logo PDF — ratio conservé, bornes max.
 * Retourne la hauteur occupée (mm) ou 0.
 */
export function tryDrawLogo(
  doc: jsPDF,
  logoPath: string | null | undefined,
  x: number,
  y: number,
  maxW = 42,
  maxH = 16,
): number {
  if (!logoPath?.trim()) return 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const raw = logoPath.trim();
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
      return 0;
    }
    const p = raw.startsWith("/")
      ? path.join(process.cwd(), "public", raw.replace(/^\//, ""))
      : path.join(process.cwd(), raw);
    if (!fs.existsSync(p)) return 0;
    const data = fs.readFileSync(p);
    const lower = p.toLowerCase();
    const ext = lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? "JPEG" : "PNG";
    const mime = ext === "JPEG" ? "jpeg" : "png";
    // Dimensions cibles bornées (pas d’étirement : jsPDF scale uniform via w/h)
    let w = maxW;
    let h = maxH * 0.75;
    // Heuristique : logos carrés → plus haut, horizontaux → plus larges
    if (lower.includes("square") || lower.includes("icon")) {
      w = Math.min(maxW, maxH);
      h = w;
    } else {
      w = maxW;
      h = Math.min(maxH, maxW * 0.38);
    }
    doc.addImage(
      `data:image/${mime};base64,${data.toString("base64")}`,
      ext,
      x,
      y,
      w,
      h,
    );
    return h + 2;
  } catch {
    return 0;
  }
}
