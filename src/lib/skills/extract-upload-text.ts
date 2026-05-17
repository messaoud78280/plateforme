import {
  CCTP_EXTRACT_MAX_CHARS,
  formatFileSize,
  getCctpFileCategory,
  isCctpFileAccepted,
} from "@/lib/skills/cctp-upload-config";

export {
  CCTP_UPLOAD_MAX_BYTES,
  CCTP_MAX_REFERENCE_FILES,
  isCctpFileAccepted,
} from "@/lib/skills/cctp-upload-config";

/** @deprecated utilisez isCctpFileAccepted */
export const isCctpUploadAllowed = isCctpFileAccepted;

const TEXT_MIMES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/csv",
  "text/html",
  "application/json",
  "text/xml",
  "application/xml",
]);

const TEXT_EXT = /\.(txt|md|csv|html?|json|xml|rtf)$/i;

function truncateExtract(text: string): string {
  if (text.length <= CCTP_EXTRACT_MAX_CHARS) return text;
  return `${text.slice(0, CCTP_EXTRACT_MAX_CHARS)}\n\n… (extrait tronqué pour limite technique)`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripRtf(rtf: string): string {
  return rtf
    .replace(/\\[a-z]+\d* ?/gi, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function metadataOnlyBlock(fileName: string, mimeType: string, fileSize: number, reason: string): string {
  const cat = getCctpFileCategory(fileName, mimeType);
  return [
    `**Fichier transmis :** ${fileName}`,
    `**Type :** ${mimeType || "inconnu"} · **Catégorie :** ${cat} · **Taille :** ${formatFileSize(fileSize)}`,
    `**Note :** ${reason}`,
  ].join("\n");
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ text: string; warning?: string }> {
  const lower = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  const category = getCctpFileCategory(fileName, mimeType);

  if (TEXT_MIMES.has(lower) || TEXT_EXT.test(name)) {
    let raw = buffer.toString("utf-8").replace(/\u0000/g, "");
    if (name.endsWith(".html") || name.endsWith(".htm") || lower.includes("html")) {
      raw = stripHtml(raw);
    } else if (name.endsWith(".rtf")) {
      raw = stripRtf(raw);
    }
    const text = raw.trim();
    if (!text) {
      return { text: "", warning: "Fichier texte vide." };
    }
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
          text: metadataOnlyBlock(
            fileName,
            mimeType,
            buffer.length,
            "PDF scanné ou image — texte non extractible automatiquement. Décrivez le contenu dans votre demande.",
          ),
          warning: `${fileName} : PDF sans texte extractible.`,
        };
      }
      return { text: truncateExtract(text) };
    } catch {
      return {
        text: metadataOnlyBlock(fileName, mimeType, buffer.length, "Échec lecture PDF — fichier bien reçu."),
        warning: `${fileName} : impossible d'extraire le PDF.`,
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
        return { text: "", warning: `${fileName} : document Word vide.` };
      }
      return { text: truncateExtract(text) };
    } catch {
      return {
        text: metadataOnlyBlock(fileName, mimeType, buffer.length, "Word reçu — extraction impossible, précisez le contenu dans la demande."),
        warning: `${fileName} : lecture Word impossible.`,
      };
    }
  }

  if (name.endsWith(".doc") || lower === "application/msword") {
    return {
      text: metadataOnlyBlock(
        fileName,
        mimeType,
        buffer.length,
        "Format .doc ancien — convertissez en .docx ou PDF pour une analyse automatique, ou décrivez le contenu.",
      ),
      warning: `${fileName} : format .doc — conversion recommandée.`,
    };
  }

  if (
    /\.(xlsx?|ods)$/i.test(name) ||
    lower.includes("spreadsheet") ||
    lower.includes("excel")
  ) {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const parts: string[] = [];
      for (const sheetName of wb.SheetNames.slice(0, 8)) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "\t" });
        if (csv.trim()) parts.push(`#### Feuille : ${sheetName}\n\n${csv.trim()}`);
      }
      const text = parts.join("\n\n");
      if (!text) {
        return { text: "", warning: `${fileName} : tableur vide.` };
      }
      return { text: truncateExtract(text) };
    } catch {
      return {
        text: metadataOnlyBlock(fileName, mimeType, buffer.length, "Tableur reçu — extraction impossible."),
        warning: `${fileName} : lecture Excel impossible.`,
      };
    }
  }

  if (category === "image") {
    return {
      text: metadataOnlyBlock(
        fileName,
        mimeType,
        buffer.length,
        "Image / plan raster transmis — décrivez ce que l'assistant doit en tenir compte (niveaux, zones, matériaux…).",
      ),
    };
  }

  if (category === "cad") {
    return {
      text: metadataOnlyBlock(
        fileName,
        mimeType,
        buffer.length,
        "Fichier CAO / plan technique transmis — l'assistant ne lit pas le dessin ; indiquez lot, échelle et prescriptions à intégrer.",
      ),
    };
  }

  if (category === "archive") {
    return {
      text: metadataOnlyBlock(
        fileName,
        mimeType,
        buffer.length,
        "Archive transmise — décompressez et joignez les fichiers utiles (PDF, DOCX) pour analyse automatique.",
      ),
      warning: `${fileName} : archive — décompressez avant analyse détaillée.`,
    };
  }

  return {
    text: metadataOnlyBlock(
      fileName,
      mimeType,
      buffer.length,
      "Fichier transmis et enregistré — précisez dans votre demande comment l'utiliser pour le CCTP.",
    ),
  };
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
