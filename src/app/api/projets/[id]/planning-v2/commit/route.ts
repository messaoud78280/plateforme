/**
 * Commit Planning V2 — rejoue Preview serveur puis transaction atomique.
 * N’accepte pas un SchedulePlan arbitraire du navigateur.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
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
  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (session.user.role === "CLIENT") {
    return NextResponse.json({ error: "Modification non autorisée" }, { status: 403 });
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
