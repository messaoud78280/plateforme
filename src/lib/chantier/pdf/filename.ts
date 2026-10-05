/** Nommage déterministe des PDF chantier. */

export function sanitizePdfFilenamePart(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

export function projectPdfBasename(projectTitle: string): string {
  const base = sanitizePdfFilenamePart(projectTitle.trim() || "Chantier");
  return base || "Chantier";
}

export function buildSectionPdfFilename(opts: {
  projectTitle: string;
  sectionLabel: string;
  suffix?: string | null;
}): string {
  const parts = [
    projectPdfBasename(opts.projectTitle),
    sanitizePdfFilenamePart(opts.sectionLabel),
  ];
  if (opts.suffix?.trim()) {
    parts.push(sanitizePdfFilenamePart(opts.suffix.trim()));
  }
  return `${parts.join("_")}.pdf`;
}
