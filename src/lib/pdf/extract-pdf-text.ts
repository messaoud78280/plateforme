/**
 * Extraction texte PDF côté serveur (Node).
 * pdf-parse v2 exige un worker + (souvent) CanvasFactory hors navigateur ;
 * Next/webpack casse facilement la résolution sans serverExternalPackages.
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

      // getData() = worker inline (data URL) — plus fiable en serverless / bundle.
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

/** Extrait le texte brut d’un PDF. Lève en cas d’échec de lecture. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const worker = await ensurePdfWorker();
  const { PDFParse } = await import("pdf-parse");
  // Copie explicite : Buffer Node ≠ toujours un Uint8Array isolé pour pdf.js
  const data = Uint8Array.from(buffer);
  const parser = new PDFParse({
    data,
    ...(worker.CanvasFactory
      ? { CanvasFactory: worker.CanvasFactory as never }
      : {}),
  });
  try {
    const parsed = await parser.getText();
    return (parsed.text ?? "").trim();
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
