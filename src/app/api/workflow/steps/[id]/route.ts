import { NextResponse } from "next/server";
import { requireEquipeAdmin } from "@/lib/equipe-acces/admin";
import { updateWorkflowStep } from "@/lib/workflow/service";
import { POSTIT_COLORS } from "@/lib/follow-up/types";

type Ctx = { params: Promise<{ id: string }> };

const COLOR_KEYS = new Set(Object.keys(POSTIT_COLORS));

/** PATCH — mettre à jour une étape (mode simple). */
export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));

  if (body.colorKey && !COLOR_KEYS.has(String(body.colorKey))) {
    return NextResponse.json({ error: "Couleur invalide" }, { status: 400 });
  }

  const numOrNull = (v: unknown) => {
    if (v === null || v === "") return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
    return undefined;
  };

  const updated = await updateWorkflowStep(id, gate.ctx.organizationId, {
    label: typeof body.label === "string" ? body.label.trim() : undefined,
    colorKey: typeof body.colorKey === "string" ? body.colorKey : undefined,
    description:
      body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description
          : undefined,
    defaultRole:
      body.defaultRole === null
        ? null
        : typeof body.defaultRole === "string"
          ? body.defaultRole
          : undefined,
    delayHours: numOrNull(body.delayHours),
    reminderHours: numOrNull(body.reminderHours),
    alertOrangeHours: numOrNull(body.alertOrangeHours),
    alertRedHours: numOrNull(body.alertRedHours),
    escalateHours: numOrNull(body.escalateHours),
    nextActionLabel:
      body.nextActionLabel === null
        ? null
        : typeof body.nextActionLabel === "string"
          ? body.nextActionLabel
          : undefined,
    nextActionDelayHours: numOrNull(body.nextActionDelayHours),
    visibleOnBoard: typeof body.visibleOnBoard === "boolean" ? body.visibleOnBoard : undefined,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
  }
  return NextResponse.json({ step: updated });
}
