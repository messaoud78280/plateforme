import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { getPrepStudyView, PrepError, savePrepStudyEdits } from "@/lib/preparation/service";
import type { PrepLineTextFields, PrepTechnicalReference } from "@/lib/preparation/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    if (!study) return NextResponse.json({ error: "Étude introuvable" }, { status: 404 });
    return NextResponse.json({ study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}

function editList<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function readTexts(v: unknown): PrepLineTextFields | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const texts: PrepLineTextFields = {};
  if (typeof o.designation === "string") texts.designation = o.designation;
  if ("description" in o || "technical_description" in o) {
    texts.description =
      typeof o.description === "string"
        ? o.description
        : typeof o.technical_description === "string"
          ? o.technical_description
          : null;
  }
  if ("executionNotes" in o || "execution_notes" in o) {
    const n = o.executionNotes ?? o.execution_notes;
    texts.executionNotes = typeof n === "string" ? n : null;
  }
  if (Array.isArray(o.includedServices) || Array.isArray(o.included_services)) {
    texts.includedServices = (Array.isArray(o.includedServices) ? o.includedServices : o.included_services) as string[];
  }
  if (Array.isArray(o.qualityControls) || Array.isArray(o.quality_controls)) {
    texts.qualityControls = (Array.isArray(o.qualityControls) ? o.qualityControls : o.quality_controls) as string[];
  }
  if (Array.isArray(o.technicalReservations) || Array.isArray(o.technical_reservations)) {
    texts.technicalReservations = (
      Array.isArray(o.technicalReservations) ? o.technicalReservations : o.technical_reservations
    ) as string[];
  }
  if (Array.isArray(o.technicalReferences) || Array.isArray(o.technical_references)) {
    texts.technicalReferences = (
      Array.isArray(o.technicalReferences) ? o.technicalReferences : o.technical_references
    ) as PrepTechnicalReference[];
  }
  return Object.keys(texts).length ? texts : undefined;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    if (typeof body.expectedVersion !== "number") throw new PrepError("Version attendue manquante");
    const params = editList<Record<string, unknown>>(body.params).map((p) => ({
      key: String(p.key ?? ""),
      value: typeof p.value === "number" ? p.value : null,
      restore: p.restore === true,
    }));
    const lines = editList<Record<string, unknown>>(body.lines).map((l) => ({
      code: String(l.code ?? ""),
      quantity: typeof l.quantity === "number" ? l.quantity : undefined,
      restore: l.restore === true,
      texts: readTexts(l.texts),
    }));
    const result = await savePrepStudyEdits({
      orgId: guard.ctx.orgId,
      userId: guard.ctx.userId,
      studyId: id,
      expectedVersion: body.expectedVersion,
      params,
      lines,
    });
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    return NextResponse.json({ ...result, study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
