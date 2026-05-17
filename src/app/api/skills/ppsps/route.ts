import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import {
  combineExtractedBlocks,
  extractTextFromBuffer,
  isCctpFileAccepted,
} from "@/lib/skills/extract-upload-text";
import { generatePpspsAnalysis } from "@/lib/skills/ppsps-generate";
import { PPSPS_MAX_REFERENCE_FILES } from "@/lib/skills/ppsps-upload-config";
import {
  getPpspsSessionGenerationContext,
  persistPpspsSession,
  updatePpspsSessionAfterRefine,
  type PersistPpspsSessionInput,
} from "@/lib/skills/ppsps-session-service";
import { uploadPpspsSkillFile } from "@/lib/skills/ppsps-skill-storage";
import type { PpspsGenerationMode, PpspsSiteProfile } from "@/lib/skills/ppsps-generation-modes";
import { PPSPS_GENERATION_MODES, PPSPS_SITE_PROFILES } from "@/lib/skills/ppsps-generation-modes";
import { canUserAccessPpspsProject } from "@/lib/skills/ppsps-projects";
import type { PpspsCoactivity, PpspsDetailLevel, PpspsFormInput, PpspsOperationType, PpspsSiteInfo } from "@/lib/skills/ppsps-types";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const VALID_OPERATIONS = new Set<PpspsOperationType>([
  "construction_neuve",
  "renovation",
  "extension",
  "rehabilitation",
  "demolition_partielle",
  "travaux_exterieurs",
  "autre",
]);

const VALID_COACTIVITY = new Set<PpspsCoactivity>(["oui", "non", "a_confirmer"]);
const VALID_DETAIL = new Set<PpspsDetailLevel>(["synthetique", "standard", "detaille", "tres_detaille"]);
const VALID_GENERATION_MODES = new Set<PpspsGenerationMode>(PPSPS_GENERATION_MODES.map((m) => m.id));
const VALID_SITE_PROFILES = new Set<PpspsSiteProfile>(PPSPS_SITE_PROFILES.map((p) => p.id));

type PendingFileRecord = {
  kind: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
  extractedText: string | null;
  buffer: Buffer;
};

function parseSite(raw: unknown): PpspsSiteInfo {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const op =
    typeof o.operationType === "string" && VALID_OPERATIONS.has(o.operationType as PpspsOperationType)
      ? (o.operationType as PpspsOperationType)
      : "construction_neuve";
  const co =
    typeof o.coactivity === "string" && VALID_COACTIVITY.has(o.coactivity as PpspsCoactivity)
      ? (o.coactivity as PpspsCoactivity)
      : "a_confirmer";

  return {
    siteName: typeof o.siteName === "string" ? o.siteName.trim() : "",
    siteAddress: typeof o.siteAddress === "string" ? o.siteAddress.trim() : "",
    operationType: op,
    operationTypeOther: typeof o.operationTypeOther === "string" ? o.operationTypeOther.trim() : "",
    startDate: typeof o.startDate === "string" ? o.startDate.trim() : "",
    estimatedDuration: typeof o.estimatedDuration === "string" ? o.estimatedDuration.trim() : "",
    maxWorkers: typeof o.maxWorkers === "string" ? o.maxWorkers.trim() : "",
    coactivity: co,
    spsCoordinator: typeof o.spsCoordinator === "string" ? o.spsCoordinator.trim() : "",
    projectOwner: typeof o.projectOwner === "string" ? o.projectOwner.trim() : "",
    projectManager: typeof o.projectManager === "string" ? o.projectManager.trim() : "",
    safetyManager: typeof o.safetyManager === "string" ? o.safetyManager.trim() : "",
  };
}

function parsePpspsFormBody(raw: unknown): PpspsFormInput {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const siteRaw = o.site ?? o;
  const trades = Array.isArray(o.trades)
    ? o.trades.filter((t): t is string => typeof t === "string").map((t) => t.trim())
    : [];
  const selectedRiskTaskIds = Array.isArray(o.selectedRiskTaskIds)
    ? o.selectedRiskTaskIds.filter((id): id is string => typeof id === "string")
    : [];
  const detailLevel =
    typeof o.detailLevel === "string" && VALID_DETAIL.has(o.detailLevel as PpspsDetailLevel)
      ? (o.detailLevel as PpspsDetailLevel)
      : "standard";
  const generationMode =
    typeof o.generationMode === "string" && VALID_GENERATION_MODES.has(o.generationMode as PpspsGenerationMode)
      ? (o.generationMode as PpspsGenerationMode)
      : "analyse_risques";
  const projectId =
    typeof o.projectId === "string" && o.projectId.trim() ? o.projectId.trim() : null;
  const siteProfile =
    typeof o.siteProfile === "string" && VALID_SITE_PROFILES.has(o.siteProfile as PpspsSiteProfile)
      ? (o.siteProfile as PpspsSiteProfile)
      : null;
  const normReferences = Array.isArray(o.normReferences)
    ? o.normReferences.filter((id): id is string => typeof id === "string")
    : [];

  return {
    site: parseSite(siteRaw),
    trades,
    tradeOther: typeof o.tradeOther === "string" ? o.tradeOther.trim() : "",
    selectedRiskTaskIds,
    detailLevel,
    constraints: typeof o.constraints === "string" ? o.constraints.trim() : "",
    projectId,
    generationMode,
    siteProfile,
    normReferences,
    freeformInstruction: typeof o.freeformInstruction === "string" ? o.freeformInstruction.trim() : "",
    oppbtpSearchQuery: typeof o.oppbtpSearchQuery === "string" ? o.oppbtpSearchQuery.trim() : "",
  };
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
    extractWarnings.push(`${file.name} : fichier refusé (taille max 20 Mo, exécutables interdits).`);
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

  const existing = formData.get("existingPpsps");
  if (existing instanceof File && existing.size > 0) {
    await processFile(existing, "existing_ppsps", "PPSPS existant", blocks, pending, extractWarnings);
  }

  const refs = formData.getAll("referenceDocs").filter((f): f is File => f instanceof File && f.size > 0);
  if (refs.length > PPSPS_MAX_REFERENCE_FILES) {
    throw new Error(`Maximum ${PPSPS_MAX_REFERENCE_FILES} documents de référence.`);
  }
  for (const file of refs) {
    await processFile(file, "reference", "Document transmis", blocks, pending, extractWarnings);
  }

  const extractedFromFiles = combineExtractedBlocks(blocks);
  return { extractedFromFiles: extractedFromFiles || undefined, extractWarnings, pending };
}

async function persistFilesWithStorage(userId: string, sessionId: string, pending: PendingFileRecord[]) {
  const fileRecords: PersistPpspsSessionInput["files"] = [];
  for (const p of pending) {
    const stored = await uploadPpspsSkillFile({
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !canAccessBeWorkSkills(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    let form: PpspsFormInput = parsePpspsFormBody(null);
    let extractedFromFiles: string | undefined;
    let extractWarnings: string[] = [];
    let pending: PendingFileRecord[] = [];
    let refineSessionId: string | undefined;
    let refineInstruction: string | undefined;
    let includeOppbtpHints = true;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const formRaw = formData.get("form");
      if (typeof formRaw === "string") {
        try {
          form = parsePpspsFormBody(JSON.parse(formRaw));
        } catch {
          throw new Error("Formulaire invalide.");
        }
      }
      refineSessionId =
        typeof formData.get("refineSessionId") === "string" ? String(formData.get("refineSessionId")).trim() : undefined;
      refineInstruction =
        typeof formData.get("refineInstruction") === "string"
          ? String(formData.get("refineInstruction")).trim()
          : undefined;
      const opp = formData.get("includeOppbtpHints");
      if (opp === "false") includeOppbtpHints = false;

      const uploads = await processUploads(formData);
      extractedFromFiles = uploads.extractedFromFiles;
      extractWarnings = uploads.extractWarnings;
      pending = uploads.pending;
    } else {
      const body = await req.json().catch(() => null);
      const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
      form = parsePpspsFormBody(o);
      refineSessionId = typeof o.refineSessionId === "string" ? o.refineSessionId.trim() : undefined;
      refineInstruction = typeof o.refineInstruction === "string" ? o.refineInstruction.trim() : undefined;
      if (o.includeOppbtpHints === false) includeOppbtpHints = false;
    }

    const isRefine = Boolean(refineSessionId && refineInstruction);

    let loadedCtx: Awaited<ReturnType<typeof getPpspsSessionGenerationContext>> = null;
    if (isRefine && refineSessionId) {
      loadedCtx = await getPpspsSessionGenerationContext(session.user.id, refineSessionId);
      if (!loadedCtx?.resultMarkdown?.trim()) {
        throw new Error("Aucun résultat à affiner pour cette session.");
      }
      form = loadedCtx.form;
      extractedFromFiles = loadedCtx.extractedContext ?? extractedFromFiles;
    }

    if (!isRefine && !form.selectedRiskTaskIds.length) {
      return NextResponse.json(
        { error: "Sélectionnez au moins une tâche à risque avant de générer l'analyse." },
        { status: 400 },
      );
    }

    if (form.projectId) {
      const access = await canUserAccessPpspsProject(session.user.id, session.user.role, form.projectId);
      if (!access.ok) {
        return NextResponse.json({ error: "Projet chantier non autorisé ou introuvable." }, { status: 400 });
      }
    }

    const generationMode = form.generationMode ?? loadedCtx?.generationMode ?? "analyse_risques";

    const result = await generatePpspsAnalysis({
      ...form,
      generationMode,
      extractedFromFiles,
      includeOppbtpHints,
      refine: isRefine
        ? {
            previousMarkdown: loadedCtx!.resultMarkdown!,
            instruction: refineInstruction!,
          }
        : undefined,
    });

    let sessionId: string | undefined = isRefine ? refineSessionId : undefined;
    try {
      if (isRefine && refineSessionId) {
        await updatePpspsSessionAfterRefine(session.user.id, refineSessionId, {
          resultMarkdown: result.markdown,
          refineInstruction: refineInstruction!,
          usedLlm: result.usedLlm,
          notice: result.notice,
        });
      } else {
        sessionId = await persistPpspsSession({
          userId: session.user.id,
          form: { ...form, generationMode },
          projectId: form.projectId,
          generationMode,
          extractedContext: extractedFromFiles ?? null,
          resultMarkdown: result.markdown,
          usedLlm: result.usedLlm,
          notice: result.notice,
          files: [],
        });
        if (sessionId && pending.length > 0) {
          const sid = sessionId;
          const files = await persistFilesWithStorage(session.user.id, sid, pending);
          await prisma.skillPpspsFile.createMany({
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
      }
    } catch (dbErr) {
      console.error("[skills/ppsps] persist session", dbErr);
    }

    return NextResponse.json({
      ...result,
      sessionId,
      extractWarnings: extractWarnings.length ? extractWarnings : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur.";
    console.error("[skills/ppsps]", err);
    const status =
      message.includes("Sélectionnez") || message.includes("Maximum") || message.includes("invalide") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
