import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { CCTP_MAX_REFERENCE_FILES } from "@/lib/skills/cctp-upload-config";
import { uploadCctpSkillFile } from "@/lib/skills/cctp-skill-storage";
import {
  combineExtractedBlocks,
  extractTextFromBuffer,
  isCctpFileAccepted,
} from "@/lib/skills/extract-upload-text";
import { generateCctpRedaction } from "@/lib/skills/cctp-redaction-generate";
import type { CctpDetailLevel, CctpProjectContext, CctpRedactionRequestBody } from "@/lib/skills/cctp-redaction-types";
import { persistCctpSession, type PersistCctpSessionInput } from "@/lib/skills/cctp-session-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type PendingFileRecord = {
  kind: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
  extractedText: string | null;
  buffer: Buffer;
};

function parseDetailLevel(v: unknown): CctpDetailLevel {
  if (v === "synthese" || v === "detaille") return v;
  return "standard";
}

function parseContext(raw: unknown): CctpProjectContext {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    projectType: typeof o.projectType === "string" ? o.projectType.trim() : "",
    lot: typeof o.lot === "string" ? o.lot.trim() : "",
    location: typeof o.location === "string" ? o.location.trim() : "",
    constraints: typeof o.constraints === "string" ? o.constraints.trim() : "",
    detailLevel: parseDetailLevel(o.detailLevel),
    availableDocuments: typeof o.availableDocuments === "string" ? o.availableDocuments.trim() : "",
  };
}

function parseNormReferences(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as unknown;
        return parseNormReferences(parsed);
      } catch {
        return [];
      }
    }
    return [];
  }
  return raw.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
}

async function processFile(
  file: File,
  kind: string,
  label: string,
  blocks: { label: string; fileName: string; text: string; warning?: string }[],
  pending: PendingFileRecord[],
  extractWarnings: string[],
) {
  if (!isCctpFileAccepted(file)) {
    extractWarnings.push(
      `${file.name} : fichier refusé (taille max 20 Mo, exécutables interdits).`,
    );
    return;
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { text, warning } = await extractTextFromBuffer(buffer, file.name, file.type);
  if (warning) extractWarnings.push(`${file.name} : ${warning}`);
  blocks.push({ label, fileName: file.name, text, warning });
  pending.push({
    kind,
    fileName: file.name,
    mimeType: file.type || null,
    fileSize: file.size,
    extractedText: text || null,
    buffer,
  });
}

async function processUploads(formData: FormData) {
  const extractWarnings: string[] = [];
  const pending: PendingFileRecord[] = [];
  const blocks: { label: string; fileName: string; text: string; warning?: string }[] = [];

  const existing = formData.get("existingCctp");
  if (existing instanceof File && existing.size > 0) {
    await processFile(existing, "existing_cctp", "CCTP existant", blocks, pending, extractWarnings);
  }

  const refs = formData.getAll("referenceDocs").filter((f): f is File => f instanceof File && f.size > 0);
  if (refs.length > CCTP_MAX_REFERENCE_FILES) {
    throw new Error(`Maximum ${CCTP_MAX_REFERENCE_FILES} documents de référence.`);
  }
  for (const file of refs) {
    await processFile(file, "reference", "Document transmis", blocks, pending, extractWarnings);
  }

  const extractedFromFiles = combineExtractedBlocks(blocks);
  return { extractedFromFiles: extractedFromFiles || undefined, extractWarnings, pending };
}

async function persistFilesWithStorage(
  userId: string,
  sessionId: string,
  pending: PendingFileRecord[],
) {
  const fileRecords: PersistCctpSessionInput["files"] = [];
  for (const p of pending) {
    const stored = await uploadCctpSkillFile({
      userId,
      sessionId,
      fileName: p.fileName,
      buffer: p.buffer,
      mimeType: p.mimeType ?? "application/octet-stream",
    });
    fileRecords.push({
      kind: p.kind,
      fileName: p.fileName,
      mimeType: p.mimeType,
      fileSize: p.fileSize,
      extractedText: p.extractedText,
      storagePath: stored?.storagePath ?? null,
      storageUrl: stored?.storageUrl ?? null,
    });
  }
  return fileRecords;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (!canAccessBeWorkSkills(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let reqText = "";
    let context: CctpProjectContext = parseContext(null);
    let normReferences: string[] = [];
    let extractedFromFiles: string | undefined;
    let extractWarnings: string[] = [];
    let pending: PendingFileRecord[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      reqText = typeof formData.get("request") === "string" ? String(formData.get("request")) : "";
      const contextRaw = formData.get("context");
      if (typeof contextRaw === "string") {
        try {
          context = parseContext(JSON.parse(contextRaw));
        } catch {
          context = parseContext(null);
        }
      }
      normReferences = parseNormReferences(formData.get("normReferences"));
      const uploads = await processUploads(formData);
      extractedFromFiles = uploads.extractedFromFiles;
      extractWarnings = uploads.extractWarnings;
      pending = uploads.pending;
    } else {
      const body = (await request.json().catch(() => ({}))) as Partial<CctpRedactionRequestBody>;
      reqText = typeof body.request === "string" ? body.request : "";
      context = parseContext(body.context);
      normReferences = parseNormReferences(body.normReferences);
    }

    const result = await generateCctpRedaction({
      request: reqText,
      context,
      extractedFromFiles,
      normReferences,
    });

    let sessionId: string | undefined;
    try {
      sessionId = await persistCctpSession({
        userId: session.user.id,
        request: reqText.trim(),
        context,
        normReferences,
        extractedContext: extractedFromFiles ?? null,
        resultMarkdown: result.markdown,
        usedLlm: result.usedLlm,
        notice: result.notice,
        files: [],
      });
      if (sessionId && pending.length > 0) {
        const sid = sessionId;
        const files = await persistFilesWithStorage(session.user.id, sid, pending);
        await prisma.skillCctpFile.createMany({
          data: files.map((f) => ({
            sessionId: sid,
            kind: f.kind,
            fileName: f.fileName,
            mimeType: f.mimeType,
            fileSize: f.fileSize,
            extractedText: f.extractedText,
            storagePath: f.storagePath,
            storageUrl: f.storageUrl,
          })),
        });
      }
    } catch (dbErr) {
      console.error("[skills/cctp] persist session", dbErr);
    }

    return NextResponse.json({
      ...result,
      sessionId,
      extractWarnings: extractWarnings.length ? extractWarnings : undefined,
    });
  } catch (e) {
    const err = e as { message?: string };
    console.error("[skills/cctp]", err);
    const message = err?.message ?? "Erreur lors de la génération.";
    const status =
      message.includes("obligatoire") || message.includes("Maximum") || message.includes("invalide")
        ? 400
        : 500;
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "La génération CCTP est momentanément indisponible. Réessayez dans quelques instants.",
      },
      { status },
    );
  }
}
