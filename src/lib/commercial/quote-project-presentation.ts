/**
 * Présentation projet PDF — notes structurées + visuels work_stages / media_manifest.
 */
import type { BundleMediaItem } from "@/lib/commercial/chatgpt-bundle/types";
import {
  hasProjectPresentation,
  parseClientNotes,
  type ParsedClientNotes,
  type ParsedWorkStage,
} from "@/lib/commercial/client-notes-structure";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  DOCUMENTS_BUCKET,
  downloadStorageObject,
} from "@/lib/storage/supabase-object";

export type QuotePdfStageVisual = {
  order: string;
  title: string;
  description: string | null;
  mediaType: BundleMediaItem["type"] | null;
  disclaimer: string | null;
  /** data:image/...;base64,... pour jsPDF */
  imageDataUrl: string | null;
  imageFormat: "PNG" | "JPEG" | null;
};

export type QuotePdfProjectPresentation = {
  intro: string | null;
  adviceParagraphs: string[];
  stages: QuotePdfStageVisual[];
  reserves: string[];
};

const MANIFEST_RE =
  /<!--bework_media_manifest-->([\s\S]*?)<!--\/bework_media_manifest-->/;

const DEFAULT_AI_DISCLAIMER =
  "Illustration non contractuelle — aperçu indicatif du principe d'intervention.";

export function parseMediaManifestFromInternalNotes(
  notes: string | null | undefined,
): BundleMediaItem[] {
  const raw = notes ?? "";
  const m = raw.match(MANIFEST_RE);
  if (!m?.[1]) return [];
  try {
    const parsed = JSON.parse(m[1]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is BundleMediaItem =>
        Boolean(x && typeof x === "object" && typeof (x as BundleMediaItem).key === "string"),
    );
  } catch {
    return [];
  }
}

export function upsertMediaStorageKeyInInternalNotes(
  notes: string | null | undefined,
  key: string,
  storageKey: string,
  fileName?: string | null,
): string {
  const base = notes ?? "";
  const manifest = parseMediaManifestFromInternalNotes(base);
  if (!manifest.length) {
    const item: BundleMediaItem = {
      key,
      label: key,
      type: "ai_preview",
      clientVisible: true,
      disclaimer: DEFAULT_AI_DISCLAIMER,
      storageKey,
      fileName: fileName ?? null,
    };
    const block = `<!--bework_media_manifest-->${JSON.stringify([item])}<!--/bework_media_manifest-->`;
    return base.trim() ? `${base.trim()}\n\n${block}` : block;
  }
  const next = manifest.map((m) =>
    m.key === key ? { ...m, storageKey, fileName: fileName ?? m.fileName } : m,
  );
  if (!next.some((m) => m.key === key)) {
    next.push({
      key,
      label: key,
      type: "ai_preview",
      clientVisible: true,
      disclaimer: DEFAULT_AI_DISCLAIMER,
      storageKey,
      fileName: fileName ?? null,
    });
  }
  const json = JSON.stringify(next);
  if (MANIFEST_RE.test(base)) {
    return base.replace(
      MANIFEST_RE,
      `<!--bework_media_manifest-->${json}<!--/bework_media_manifest-->`,
    );
  }
  return `${base.trim()}\n\n<!--bework_media_manifest-->${json}<!--/bework_media_manifest-->`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function loadImageDataUrl(
  storageKey: string,
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) return null;
  try {
    const downloaded = await withTimeout(
      downloadStorageObject(supabase, DOCUMENTS_BUCKET, storageKey),
      6000,
    );
    if (!downloaded) return null;
    const buf = Buffer.from(await downloaded.blob.arrayBuffer());
    if (!buf.length) return null;
    const lower = storageKey.toLowerCase();
    const isJpeg = lower.endsWith(".jpg") || lower.endsWith(".jpeg");
    const mime = isJpeg ? "image/jpeg" : "image/png";
    const format: "PNG" | "JPEG" = isJpeg ? "JPEG" : "PNG";
    return {
      dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
      format,
    };
  } catch {
    return null;
  }
}

async function resolveStorageKeyForMedia(
  orgId: string,
  quoteId: string,
  item: BundleMediaItem,
): Promise<string | null> {
  if (item.storageKey?.trim()) return item.storageKey.trim();
  // Pas de storageKey : une seule liste courte du dossier (évite N appels qui bloquent).
  const supabase = createServiceRoleClient();
  if (!supabase) return null;
  const folder = `commercial/${orgId}/quotes/${quoteId}/chatgpt-media`;
  try {
    const listed = await withTimeout(
      supabase.storage.from(DOCUMENTS_BUCKET).list(folder, { limit: 50 }),
      4000,
    );
    const data = listed?.data ?? [];
    const hit = data.find(
      (f) => f.name === item.key || f.name.startsWith(`${item.key}.`),
    );
    if (hit) return `${folder}/${hit.name}`;
  } catch {
    /* ignore */
  }
  return null;
}

function guessMediaKeyFromStage(stage: ParsedWorkStage, manifest: BundleMediaItem[]): string | null {
  if (stage.mediaKey) return stage.mediaKey;
  const byOrder = manifest.find((m) => {
    const label = `${m.label} ${m.key}`.toLowerCase();
    return (
      label.includes(`étape ${Number(stage.order)}`) ||
      label.includes(`etape ${Number(stage.order)}`) ||
      label.includes(`stage_${Number(stage.order)}`) ||
      m.key.includes(String(Number(stage.order)))
    );
  });
  if (byOrder) return byOrder.key;
  const idx = Number(stage.order) - 1;
  if (idx >= 0 && idx < manifest.length) return manifest[idx].key;
  return null;
}

export async function buildProjectPresentationForPdf(opts: {
  orgId: string;
  quoteId: string;
  clientNotes: string | null | undefined;
  internalNotes?: string | null;
}): Promise<QuotePdfProjectPresentation | null> {
  const parsed: ParsedClientNotes = parseClientNotes(opts.clientNotes);
  if (!hasProjectPresentation(parsed)) return null;

  const manifest = parseMediaManifestFromInternalNotes(opts.internalNotes).filter(
    (m) => m.clientVisible !== false,
  );

  // Une seule liste dossier pour toutes les étapes (évite N appels storage).
  let folderIndex: Map<string, string> | null = null;
  const ensureFolderIndex = async () => {
    if (folderIndex) return folderIndex;
    folderIndex = new Map();
    if (!manifest.some((m) => !m.storageKey?.trim())) return folderIndex;
    const supabase = createServiceRoleClient();
    if (!supabase) return folderIndex;
    const folder = `commercial/${opts.orgId}/quotes/${opts.quoteId}/chatgpt-media`;
    const listed = await withTimeout(
      supabase.storage.from(DOCUMENTS_BUCKET).list(folder, { limit: 50 }),
      4000,
    );
    for (const f of listed?.data ?? []) {
      folderIndex.set(f.name, `${folder}/${f.name}`);
      const base = f.name.replace(/\.[^.]+$/, "");
      if (!folderIndex.has(base)) folderIndex.set(base, `${folder}/${f.name}`);
    }
    return folderIndex;
  };

  const stages: QuotePdfStageVisual[] = [];
  for (const stage of parsed.stages) {
    const mediaKey = guessMediaKeyFromStage(stage, manifest);
    const media = mediaKey
      ? manifest.find((m) => m.key === mediaKey) ?? null
      : null;
    let imageDataUrl: string | null = null;
    let imageFormat: "PNG" | "JPEG" | null = null;
    if (media) {
      let storageKey = media.storageKey?.trim() || null;
      if (!storageKey) {
        const idx = await ensureFolderIndex();
        storageKey =
          idx.get(media.key) ||
          [...idx.entries()].find(([name]) => name.startsWith(`${media.key}.`))?.[1] ||
          null;
      }
      if (storageKey) {
        const img = await loadImageDataUrl(storageKey);
        if (img) {
          imageDataUrl = img.dataUrl;
          imageFormat = img.format;
        }
      }
    }
    const mediaType = media?.type ?? null;
    const disclaimer =
      mediaType === "ai_preview"
        ? media?.disclaimer?.trim() || DEFAULT_AI_DISCLAIMER
        : media?.disclaimer?.trim() || null;

    stages.push({
      order: stage.order,
      title: stage.title,
      description: stage.description,
      mediaType,
      disclaimer,
      imageDataUrl,
      imageFormat,
    });
  }

  return {
    intro: parsed.intro,
    adviceParagraphs: parsed.adviceParagraphs,
    stages,
    reserves: parsed.reserves,
  };
}

export async function resolveLogoDataUrl(
  logoPath: string | null | undefined,
): Promise<string | null> {
  const raw = logoPath?.trim();
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const res = await withTimeout(
        fetch(raw, { signal: AbortSignal.timeout(5000) }).then(async (r) => {
          if (!r.ok) return null;
          const buf = Buffer.from(await r.arrayBuffer());
          const ct = r.headers.get("content-type") || "image/png";
          const mime =
            ct.includes("jpeg") || ct.includes("jpg") ? "image/jpeg" : "image/png";
          return `data:${mime};base64,${buf.toString("base64")}`;
        }),
        6000,
      );
      return res;
    } catch {
      return null;
    }
  }
  // Chemin local : tryDrawLogo gère déjà
  return null;
}
