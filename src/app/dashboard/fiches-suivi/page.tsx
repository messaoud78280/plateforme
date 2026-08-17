import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { followUpSheetAccessWhere, resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { serializeFollowUpSheet } from "@/lib/follow-up/serialize";
import { FollowUpWorkspace } from "@/components/follow-up/FollowUpWorkspace";
import { BackLink } from "@/components/ui/BackLink";
import { ensureOrganizationForOwner } from "@/lib/organization/access";
import { ensureDefaultWorkflow } from "@/lib/workflow/service";
import { canEditFollowUpBoard } from "@/lib/follow-up/access";
import { loadAttentionForSheets, urgencyLabelFor } from "@/lib/follow-up/attention/batch";
import { URGENCY_LABELS } from "@/lib/follow-up/types";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";

export const dynamic = "force-dynamic";

export default async function FichesSuiviPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; view?: string; scope?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/fiches-suivi");

  assertDashboardHrefAllowed({
    href: "/dashboard/fiches-suivi",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const sp = await searchParams;
  const filter = sp.filter ?? null;
  const viewParam = sp.view;
  const initialView =
    viewParam === "liste"
      ? "liste"
      : viewParam === "tableau" || viewParam === "workflow"
        ? "workflow"
        : "attention";
  const initialScope = sp.scope === "mine" ? "mine" : "team";

  const accessWhere = await followUpSheetAccessWhere(session.user);
  const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
  const settings = await getFollowUpSettings(ownerUserId);
  const orgId = await ensureOrganizationForOwner(ownerUserId);

  let workflowSteps: {
    statusKey: string;
    label: string;
    colorKey: string;
    sortOrder: number;
    visibleOnBoard: boolean;
    delayHours: number | null;
    alertOrangeHours: number | null;
    alertRedHours: number | null;
    escalateHours: number | null;
  }[] = [];
  if (orgId) {
    const workflow = await ensureDefaultWorkflow(orgId);
    workflowSteps = workflow.steps
      .filter((s) => s.statusKey !== "ARCHIVE")
      .map((s) => ({
        statusKey: s.statusKey,
        label: s.label,
        colorKey: s.colorKey,
        sortOrder: s.sortOrder,
        visibleOnBoard: s.visibleOnBoard !== false,
        delayHours: s.delayHours,
        alertOrangeHours: s.alertOrangeHours,
        alertRedHours: s.alertRedHours,
        escalateHours: s.escalateHours,
      }));
  }

  const allSheets = await prisma.followUpSheet.findMany({
    where: {
      AND: [accessWhere, { status: { not: "ARCHIVE" } }],
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
    },
    orderBy: [{ nextActionAt: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  const serialized = allSheets.map((s) => serializeFollowUpSheet(s, settings.thresholds));

  const sheetIds = serialized.map((i) => i.id);
  const statusEnteredAt = new Map<string, string>();
  if (sheetIds.length > 0) {
    const statusEvents = await prisma.followUpTimelineEvent.findMany({
      where: { sheetId: { in: sheetIds }, kind: "statut" },
      select: { sheetId: true, occurredAt: true },
      orderBy: { occurredAt: "desc" },
    });
    for (const e of statusEvents) {
      if (!statusEnteredAt.has(e.sheetId)) {
        statusEnteredAt.set(e.sheetId, e.occurredAt.toISOString());
      }
    }
  }

  const withEntered = serialized.map((i) => ({
    ...i,
    statusEnteredAt: statusEnteredAt.get(i.id) ?? null,
    projectTitle: i.project?.title ?? null,
  }));

  const { byId: attentionMap } = await loadAttentionForSheets({
    sheets: withEntered.map((i) => ({
      id: i.id,
      status: i.status,
      title: i.title,
      nextActionAt: i.nextActionAt,
      nextActionDone: i.nextActionDone,
      urgencyOverride: i.urgencyOverride,
      statusEnteredAt: i.statusEnteredAt,
    })),
    organizationId: orgId,
    workflowSteps: workflowSteps.map((s) => ({
      statusKey: s.statusKey,
      label: s.label,
      delayHours: s.delayHours,
      alertOrangeHours: s.alertOrangeHours,
      alertRedHours: s.alertRedHours,
      escalateHours: s.escalateHours,
    })),
    thresholds: settings.thresholds,
  });

  const allItems = withEntered.map((i) => {
    const attention = attentionMap.get(i.id);
    if (!attention) return i;
    const level = attention.effectiveUrgency;
    return {
      ...i,
      urgency: level,
      urgencyLabel: URGENCY_LABELS[level] ?? urgencyLabelFor(level),
      attention,
    };
  });

  const occupiedStatuses = new Set<string>(allItems.map((i) => i.status));
  const kanbanColumns = workflowSteps
    .filter((s) => s.visibleOnBoard || occupiedStatuses.has(s.statusKey))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      statusKey: s.statusKey,
      label: s.label,
      colorKey: s.colorKey,
      sortOrder: s.sortOrder,
    }));

  return (
    <div className="space-y-2">
      <div className="px-4 pt-6 sm:px-6">
        <BackLink href="/dashboard">Tableau de bord</BackLink>
      </div>
      <FollowUpWorkspace
        sheets={allItems}
        columns={kanbanColumns}
        canEdit={canEditFollowUpBoard(session.user)}
        currentUserId={session.user.id}
        initialView={initialView}
        initialFilter={filter}
        initialScope={initialScope}
      />
    </div>
  );
}
