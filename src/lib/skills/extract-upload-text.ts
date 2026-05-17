/** Taille max par fichier (10 Mo) et caractères extraits cumulés par session. */
export const CCTP_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const CCTP_EXTRACT_MAX_CHARS = 80_000;

const TEXT_MIMES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/csv",
]);

const TEXT_EXT = /\.(txt|md|csv)$/i;

export function isCctpUploadAllowed(file: { name: string; type: string; size: number }): boolean {
  if (file.size > CCTP_UPLOAD_MAX_BYTES) return false;
  const t = file.type.toLowerCase();
  if (
    t === "application/pdf" ||
    t === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    t === "application/msword" ||
    TEXT_MIMES.has(t)
  ) {
    return true;
  }
  return TEXT_EXT.test(file.name);
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ text: string; warning?: string }> {
  const lower = mimeType.toLowerCase();
  const name = fileName.toLowerCase();

  if (TEXT_MIMES.has(lower) || TEXT_EXT.test(name)) {
    const text = buffer.toString("utf-8").replace(/\u0000/g, "").trim();
    return { text: truncateExtract(text) };
  }

  if (lower === "application/pdf" || name.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy().catch(() => undefined);
      const text = (parsed.text ?? "").trim();
      if (!text) {
        return {
          text: "",
          warning: "PDF sans texte extractible (scan ou image). Collez le contenu dans la demande.",
        };
      }
      return { text: truncateExtract(text) };
    } catch {
      return {
        text: "",
        warning: "Impossible d'extraire le texte du PDF. Collez le contenu ou utilisez un PDF texte.",
      };
    }
  }

  if (
    lower === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value ?? "").trim();
      if (!text) {
        return { text: "", warning: "Document Word vide ou non lisible." };
      }
      return { text: truncateExtract(text) };
    } catch {
      return {
        text: "",
        warning: "Impossible de lire le fichier Word. Enregistrez en .docx ou collez le texte.",
      };
    }
  }

  return {
    text: "",
    warning: "Format non pris en charge. Utilisez PDF, DOCX, TXT ou MD.",
  };
}

function truncateExtract(text: string): string {
  if (text.length <= CCTP_EXTRACT_MAX_CHARS) return text;
  return `${text.slice(0, CCTP_EXTRACT_MAX_CHARS)}\n\n… (extrait tronqué pour limite technique)`;
}

export function combineExtractedBlocks(
  blocks: { label: string; fileName: string; text: string; warning?: string }[],
): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.warning && !b.text) {
      parts.push(`### ${b.label} — ${b.fileName}\n> ${b.warning}`);
      continue;
    }
    if (!b.text) continue;
    parts.push(`### ${b.label} — ${b.fileName}\n\n${b.text}`);
  }
  return parts.join("\n\n---\n\n");
}
