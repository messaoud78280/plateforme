/**
 * Commit Planning V2 — rejoue Preview serveur puis transaction atomique.
 * N’accepte pas un SchedulePlan arbitraire du navigateur.
 *
 * Auth : même périmètre que canModifyChantierProject.
 * Ne PAS refuser uniquement parce que role === "CLIENT"
 * (comptes org BeWork = role CLIENT + personType INTERNAL — bug ROCKMAN).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canModifyChantierProject } from "@/lib/chantier-dossier/access";
import { takeoffCreateCommitForbiddenReason } from "@/lib/chantier-dossier/takeoff-create-auth";
import { prisma } from "@/lib/prisma";
import { commitScheduleV2 } from "@/lib/schedule-domain/repository";
import {
  isPlanningV2CommitEnabled,
  isPlanningV2ServerEnabled,
  planningV2CommitDisabledResponse,
  planningV2DisabledResponse,
} from "@/lib/schedule-domain/server-flags";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  if (!isPlanningV2ServerEnabled()) return planningV2DisabledResponse();
  if (!isPlanningV2CommitEnabled()) return planningV2CommitDisabledResponse();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const access = await canModifyChantierProject(session.user, projectId);
  const denied = takeoffCreateCommitForbiddenReason({
    hasProjectWriteAccess: access.ok,
    role: session.user.role,
  });
  if (denied.forbidden) {
    return NextResponse.json(
      {
        ok: false,
        error: "Création du planning non autorisée",
        code: denied.code ?? "FORBIDDEN",
      },
      { status: 403 },
    );
  }
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    raw?: unknown;
    draftHash?: string;
    sourcesFingerprint?: string;
    studyId?: string;
    title?: string;
  };

  const result = await commitScheduleV2({
    orgId: project.organizationId,
    projectId,
    userId: session.user.id,
    studyId: typeof body.studyId === "string" ? body.studyId : null,
    raw: body.raw ?? "",
    draftHash: typeof body.draftHash === "string" ? body.draftHash : "",
    sourceFingerprint:
      typeof body.sourcesFingerprint === "string" ? body.sourcesFingerprint : "",
    title: typeof body.title === "string" ? body.title : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        code: result.code,
        issues: result.issues,
        planId: result.planId,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    planId: result.planId,
    studyId: result.studyId,
    href: result.href,
    action: result.action,
    draftHash: result.draftHash,
    taskCount: result.taskCount,
    dependencyCount: result.dependencyCount,
    takeoffLinkCount: result.takeoffLinkCount,
    baseDurationWorkingDays: result.baseDurationWorkingDays,
  });
}
