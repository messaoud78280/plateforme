/**
 * Extraction PDF structurée pour import devis (texte + séparateurs de cellules).
 */
type PdfWorkerModule = {
  CanvasFactory?: unknown;
  getData?: () => string;
  getPath?: () => string;
};

let workerReady: Promise<PdfWorkerModule> | null = null;

async function ensurePdfWorker(): Promise<PdfWorkerModule> {
  if (!workerReady) {
    workerReady = (async () => {
      const worker = (await import("pdf-parse/worker")) as PdfWorkerModule;
      const { PDFParse } = await import("pdf-parse");

      if (typeof worker.getData === "function") {
        PDFParse.setWorker(worker.getData());
      } else if (typeof worker.getPath === "function") {
        const { pathToFileURL } = await import("node:url");
        const path = worker.getPath();
        const src =
          path.startsWith("data:") || path.startsWith("file:")
            ? path
            : pathToFileURL(path).href;
        PDFParse.setWorker(src);
      }

      return worker;
    })();
  }
  return workerReady;
}

export type ExtractedPdfDocument = {
  text: string;
  pages: Array<{ num: number; text: string }>;
};

async function createParser(buffer: Buffer) {
  const worker = await ensurePdfWorker();
  const { PDFParse } = await import("pdf-parse");
  const data = Uint8Array.from(buffer);
  return new PDFParse({
    data,
    ...(worker.CanvasFactory
      ? { CanvasFactory: worker.CanvasFactory as never }
      : {}),
  });
}

/** Texte brut (compat skills / usages simples). */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const doc = await extractPdfDocument(buffer);
  return doc.text;
}

/**
 * Texte avec séparateurs de colonnes (tab) et marqueurs de page —
 * adapté aux devis tabulaires multipages (Henrri, etc.).
 */
export async function extractPdfDocument(
  buffer: Buffer,
): Promise<ExtractedPdfDocument> {
  const parser = await createParser(buffer);
  try {
    const parsed = await parser.getText({
      lineEnforce: true,
      cellSeparator: "\t",
      cellThreshold: 6,
      pageJoiner: "\n<<<PAGE>>>\n",
    });
    const pages = (parsed.pages ?? []).map((p) => ({
      num: p.num,
      text: (p.text ?? "").trim(),
    }));
    const text = (parsed.text ?? "").trim();
    return { text, pages };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
