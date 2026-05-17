import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import {
  combineExtractedBlocks,
  extractTextFromBuffer,
  isCctpUploadAllowed,
} from "@/lib/skills/extract-upload-text";
import { generateCctpRedaction } from "@/lib/skills/cctp-redaction-generate";
import type { CctpDetailLevel, CctpProjectContext, CctpRedactionRequestBody } from "@/lib/skills/cctp-redaction-types";
import { persistCctpSession } from "@/lib/skills/cctp-session-service";

export const runtime = "nodejs";

const MAX_REFERENCE_FILES = 5;

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

async function processUploads(formData: FormData) {
  const extractWarnings: string[] = [];
  const fileRecords: {
    kind: string;
    fileName: string;
    mimeType: string | null;
    fileSize: number;
    extractedText: string | null;
  }[] = [];
  const blocks: { label: string; fileName: string; text: string; warning?: string }[] = [];

  const existing = formData.get("existingCctp");
  if (existing instanceof File && existing.size > 0) {
    if (!isCctpUploadAllowed(existing)) {
      throw new Error("Fichier CCTP existant invalide (taille ou format).");
    }
    const buffer = Buffer.from(await existing.arrayBuffer());
    const { text, warning } = await extractTextFromBuffer(buffer, existing.name, existing.type);
    if (warning) extractWarnings.push(`${existing.name} : ${warning}`);
    blocks.push({ label: "CCTP existant", fileName: existing.name, text, warning });
    fileRecords.push({
      kind: "existing_cctp",
      fileName: existing.name,
      mimeType: existing.type || null,
      fileSize: existing.size,
      extractedText: text || null,
    });
  }

  const refs = formData.getAll("referenceDocs").filter((f): f is File => f instanceof File && f.size > 0);
  if (refs.length > MAX_REFERENCE_FILES) {
    throw new Error(`Maximum ${MAX_REFERENCE_FILES} documents de référence.`);
  }
  for (const file of refs) {
    if (!isCctpUploadAllowed(file)) {
      extractWarnings.push(`${file.name} : format ou taille non accepté.`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, warning } = await extractTextFromBuffer(buffer, file.name, file.type);
    if (warning) extractWarnings.push(`${file.name} : ${warning}`);
    blocks.push({ label: "Document de référence", fileName: file.name, text, warning });
    fileRecords.push({
      kind: "reference",
      fileName: file.name,
      mimeType: file.type || null,
      fileSize: file.size,
      extractedText: text || null,
    });
  }

  const extractedFromFiles = combineExtractedBlocks(blocks);
  return { extractedFromFiles: extractedFromFiles || undefined, extractWarnings, fileRecords };
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
    let fileRecords: Awaited<ReturnType<typeof processUploads>>["fileRecords"] = [];

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
      fileRecords = uploads.fileRecords;
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
        files: fileRecords,
      });
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
