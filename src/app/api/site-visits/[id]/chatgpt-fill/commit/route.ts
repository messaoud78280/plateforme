/**
 * Commit remplissage visite depuis bework_site_survey_v1.
 * Preview obligatoire côté client ; fingerprint sources vérifié.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { loadCurrentVisitCreateSourcesFingerprint } from "@/lib/bework-context/adapt-visit-create";
import {
  buildSurveyApplyPayload,
  parseSurveyJsonRaw,
} from "@/lib/site-visits/survey-apply";
import { updateSiteVisit, upsertMeasurement } from "@/lib/site-visits/service";
import type { MeasureType } from "@/lib/site-visits/measurements";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canAccessSiteVisits(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  const { id: visitId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    raw?: string;
    sourcesFingerprint?: string;
    confirmProtected?: boolean;
  };
  const raw = typeof body.raw === "string" ? body.raw : "";
  if (!raw.trim()) {
    return NextResponse.json(
      { error: "Collez le JSON bework_site_survey_v1" },
      { status: 422 },
    );
  }

  const parsed = parseSurveyJsonRaw(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  try {
    const currentFp = await loadCurrentVisitCreateSourcesFingerprint({
      orgId,
      visitId,
    });
    const expectedFp =
      typeof body.sourcesFingerprint === "string"
        ? body.sourcesFingerprint.trim()
        : "";
    if (!expectedFp || expectedFp !== currentFp.fingerprint) {
      return NextResponse.json(
        {
          ok: false,
          code: "PREVIEW_STALE",
          error:
            "Les données de la visite ont changé. Copiez un nouveau contexte et recommencez.",
          sourcesFingerprint: currentFp.fingerprint,
        },
        { status: 409 },
      );
    }

    const visit = await prisma.siteVisit.findFirst({
      where: { id: visitId, organizationId: orgId },
      select: {
        subject: true,
        clientNeed: true,
        comments: true,
        lotsJson: true,
        zonesJson: true,
        findingsJson: true,
        proposedWorksJson: true,
        commercialJson: true,
        constraintsJson: true,
        prepJson: true,
        measurements: {
          select: {
            id: true,
            zone: true,
            label: true,
            unit: true,
            lengthM: true,
            widthM: true,
            heightM: true,
            quantityValue: true,
            computedQuantity: true,
            observation: true,
            lot: true,
          },
        },
      },
    });
    if (!visit) {
      return NextResponse.json({ error: "Visite introuvable" }, { status: 404 });
    }

    const confirmProtected = Boolean(body.confirmProtected);
    const payload = buildSurveyApplyPayload({
      survey: parsed.survey,
      confirmProtected,
      current: {
        subject: visit.subject,
        clientNeed: visit.clientNeed,
        comments: visit.comments,
        lots: parseStringList(visit.lotsJson),
        zones: parseStringList(visit.zonesJson),
        findings: visit.findingsJson,
        proposedWorks: visit.proposedWorksJson,
        commercial: visit.commercialJson,
        constraints: visit.constraintsJson,
        prep: visit.prepJson,
        measurements: visit.measurements.map((m) => ({
          id: m.id,
          zone: m.zone,
          label: m.label,
          unit: m.unit,
          lengthM: num(m.lengthM),
          widthM: num(m.widthM),
          heightM: num(m.heightM),
          quantityValue: num(m.quantityValue),
          computedQuantity: Number(m.computedQuantity),
          observation: m.observation,
          lot: m.lot,
        })),
      },
    });

    await updateSiteVisit({
      organizationId: orgId,
      visitId,
      actorUserId: session.user.id,
      data: {
        ...(payload.subject ? { subject: payload.subject } : {}),
        ...(payload.clientNeed !== undefined
          ? { clientNeed: payload.clientNeed }
          : {}),
        ...(payload.comments !== undefined ? { comments: payload.comments } : {}),
        ...(payload.lots ? { lots: payload.lots } : {}),
        ...(payload.zones ? { zones: payload.zones } : {}),
        ...(payload.findings ? { findings: payload.findings } : {}),
        ...(payload.proposedWorks
          ? { proposedWorks: payload.proposedWorks }
          : {}),
        ...(payload.commercial ? { commercial: payload.commercial } : {}),
        ...(payload.constraints ? { constraints: payload.constraints } : {}),
        ...(payload.prep ? { prep: payload.prep } : {}),
        surveyStage: "SYNTHESIS",
      },
    });

    let measurementsApplied = 0;
    for (const m of payload.measurements) {
      // Ne pas inventer une quantité absente
      if (
        m.quantityValue == null &&
        m.lengthM == null &&
        m.widthM == null &&
        m.heightM == null
      ) {
        continue;
      }
      await upsertMeasurement({
        organizationId: orgId,
        visitId,
        measurementId: m.id,
        data: {
          zone: m.zone,
          label: m.label,
          measureType: (m.measureType as MeasureType) || "FREE",
          unit: m.unit,
          lengthM: m.lengthM,
          widthM: m.widthM,
          heightM: m.heightM,
          quantityValue: m.quantityValue,
          observation: m.observation,
          lot: m.lot,
        },
      });
      measurementsApplied += 1;
    }

    return NextResponse.json({
      ok: true,
      visitId,
      measurementsApplied,
      confirmProtected,
    });
  } catch (e) {
    console.error("visit chatgpt-fill commit:", e);
    const err = e as { message?: string };
    return NextResponse.json(
      { error: err.message ?? "Application impossible" },
      { status: 500 },
    );
  }
}
