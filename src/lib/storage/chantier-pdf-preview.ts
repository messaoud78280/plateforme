import { promisify } from "util";
import type { SupabaseClient } from "@supabase/supabase-js";
import libre from "libreoffice-convert";
import {
  DOCUMENTS_BUCKET,
  downloadStorageObject,
  extractStoragePathFromUrl,
} from "@/lib/storage/supabase-object";

const convertLibreAsync = promisify(libre.convert);

const MAX_CONVERT_BYTES = 25 * 1024 * 1024;

const LIBREOFFICE_EXT = new Set([
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".xls",
  ".xlsx",
  ".ods",
  ".csv",
  ".ppt",
  ".pptx",
  ".odp",
]);

const CONVERTAPI_EXT = new Set([".numbers", ".pages", ".key"]);

export function chantierPreviewPdfPath(projectId: string, fileId: string): string {
  return `chantiers/${projectId}/_previews/${fileId}.pdf`;
}

export function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function isDirectPreviewable(mime: string | null | undefined, name: string): boolean {
  const ext = fileExtension(name);
  const m = (mime ?? "").toLowerCase();
  if (m.includes("pdf") || ext === ".pdf") return true;
  if (m.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(name)) return true;
  if (m.startsWith("text/") || /\.(txt|csv)$/i.test(name)) return true;
  return false;
}

export function needsPdfConversion(mime: string | null | undefined, name: string): boolean {
  if (isDirectPreviewable(mime, name)) return false;
  const ext = fileExtension(name);
  return LIBREOFFICE_EXT.has(ext) || CONVERTAPI_EXT.has(ext) || isOfficeMime(mime);
}

function isOfficeMime(mime: string | null | undefined): boolean {
  const m = (mime ?? "").toLowerCase();
  return /(word|excel|powerpoint|officedocument|msword|spreadsheet|presentation|iwork|vnd\.apple)/.test(m);
}

async function convertWithLibreOffice(buffer: Buffer, ext: string): Promise<Buffer> {
  const out = await convertLibreAsync(buffer, ".pdf", ext);
  return Buffer.from(out);
}

async function convertWithConvertApi(buffer: Buffer, fileName: string, ext: string): Promise<Buffer | null> {
  const secret = process.env.CONVERTAPI_SECRET?.trim();
  if (!secret) return null;

  const from = ext.replace(/^\./, "");
  const form = new FormData();
  form.append("File", new Blob([new Uint8Array(buffer)]), fileName);

  const res = await fetch(`https://v2.convertapi.com/convert/${from}/to/pdf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    body: form,
  });

  if (!res.ok) {
    console.error("ConvertAPI:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const json = (await res.json()) as { Files?: { Url?: string }[] };
  const pdfUrl = json.Files?.[0]?.Url;
  if (!pdfUrl) return null;

  const pdfRes = await fetch(pdfUrl);
  if (!pdfRes.ok) return null;
  return Buffer.from(await pdfRes.arrayBuffer());
}

async function convertBufferToPdf(
  buffer: Buffer,
  fileName: string,
  mime: string | null | undefined
): Promise<Buffer | null> {
  const ext = fileExtension(fileName);

  if (LIBREOFFICE_EXT.has(ext) || (isOfficeMime(mime) && !CONVERTAPI_EXT.has(ext))) {
    try {
      return await convertWithLibreOffice(buffer, ext || ".docx");
    } catch (e) {
      console.error("LibreOffice conversion:", e);
    }
  }

  if (CONVERTAPI_EXT.has(ext) || /iwork|vnd\.apple/.test((mime ?? "").toLowerCase())) {
    const pdf = await convertWithConvertApi(buffer, fileName, ext || ".numbers");
    if (pdf) return pdf;
  }

  return null;
}

export async function ensureChantierPdfPreview(params: {
  supabase: SupabaseClient;
  projectId: string;
  fileId: string;
  fileUrl: string;
  name: string;
  mimeType: string | null | undefined;
  fileSize?: number | null;
}): Promise<{ pdf: Buffer; cached: boolean } | null> {
  const { supabase, projectId, fileId, fileUrl, name, mimeType, fileSize } = params;

  if (!needsPdfConversion(mimeType, name)) return null;
  if (fileSize != null && fileSize > MAX_CONVERT_BYTES) return null;

  const previewPath = chantierPreviewPdfPath(projectId, fileId);

  const { data: existing } = await supabase.storage.from(DOCUMENTS_BUCKET).download(previewPath);
  if (existing) {
    return { pdf: Buffer.from(await existing.arrayBuffer()), cached: true };
  }

  const sourcePath = extractStoragePathFromUrl(fileUrl, DOCUMENTS_BUCKET);
  if (!sourcePath) return null;

  const downloaded = await downloadStorageObject(supabase, DOCUMENTS_BUCKET, sourcePath);
  if (!downloaded) return null;

  const sourceBuf = Buffer.from(await downloaded.blob.arrayBuffer());
  if (sourceBuf.length > MAX_CONVERT_BYTES) return null;

  const pdf = await convertBufferToPdf(sourceBuf, name, mimeType);
  if (!pdf) return null;

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(previewPath, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) {
    console.error("Upload preview PDF:", uploadError.message);
  }

  return { pdf, cached: false };
}

export async function deleteChantierPdfPreview(
  supabase: SupabaseClient,
  projectId: string,
  fileId: string
): Promise<void> {
  const previewPath = chantierPreviewPdfPath(projectId, fileId);
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([previewPath]);
}
