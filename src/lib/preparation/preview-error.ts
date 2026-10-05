/**
 * Formatage des erreurs de prévisualisation import métré (UI + API).
 * Pure — aucune I/O.
 */
import type { PrepIssue } from "@/lib/preparation/types";

export function summarizePrepPreviewFailure(input: {
  error?: string | null;
  issues?: PrepIssue[] | null;
  code?: string | null;
}): { title: string; lines: string[]; details: string } {
  const issues = Array.isArray(input.issues) ? input.issues : [];
  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity !== "error");
  const primary = errors.length ? errors : issues;

  const title =
    (typeof input.error === "string" && input.error.trim()) ||
    (primary.length
      ? `Prévisualisation impossible — ${primary.length} erreur${primary.length > 1 ? "s" : ""}`
      : "Prévisualisation impossible");

  const lines = primary.slice(0, 5).map((i) => {
    const path = i.path?.trim() ? `Champ : ${i.path}` : "Champ : —";
    return `${path}\n${i.message}`;
  });

  const more =
    primary.length > 5
      ? `\n… et ${primary.length - 5} autre(s) — Voir les détails.`
      : "";

  const detailBlocks = [
    ...errors.map((i) => `[error] ${i.path}: ${i.message}`),
    ...warns.slice(0, 10).map((i) => `[warn] ${i.path}: ${i.message}`),
  ];
  if (input.code) detailBlocks.unshift(`code: ${input.code}`);

  return {
    title,
    lines,
    details: [title, ...lines, more.trim(), "", ...detailBlocks]
      .filter(Boolean)
      .join("\n"),
  };
}
