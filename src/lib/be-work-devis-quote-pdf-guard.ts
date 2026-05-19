import type { QuoteProject } from "@prisma/client";
import {
  parsePresentationSettings,
  validateOfficialPdfIssuer,
  type QuotePdfMode,
} from "@/lib/be-work-devis-pdf-presentation";

export function assertCanGenerateQuotePdf(
  project: QuoteProject,
  presentationSettings: unknown,
  modeOverride?: QuotePdfMode | null,
): { ok: true; mode: QuotePdfMode } | { ok: false; error: string } {
  const settings = parsePresentationSettings(presentationSettings);
  const mode = modeOverride ?? settings.pdfMode;
  if (mode === "official" && settings.showIssuerOnPdf && settings.layoutStyle === "classic") {
    const check = validateOfficialPdfIssuer(project);
    if (!check.ok) return { ok: false, error: check.message };
  }
  return { ok: true, mode };
}
