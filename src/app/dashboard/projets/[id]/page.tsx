import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { after } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buildProjectPresentation } from "@/lib/chantier/party-labels";
import { withReturnTo } from "@/lib/navigation/safe-return-to";
import {
  ChantierHierarchyNav,
  chantierProjectsHref,
  workspaceHomeCrumb,
} from "@/components/chantier/ChantierHierarchyNav";
import { MessageForm } from "@/components/MessageForm";
import { ProjectAssignAgent } from "@/components/projects/ProjectAssignAgent";
import { ProjectPpspsSection } from "@/components/projects/ProjectPpspsSection";
import { ProjectReportsSection } from "@/components/projects/ProjectReportsSection";
import { SiteDocumentsEntryCard } from "@/components/site-documents/SiteDocumentsEntryCard";
import { ChantierCockpit } from "@/components/chantier/ChantierCockpit";
import { ChantierSharePanel } from "@/components/chantier/ChantierSharePanel";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { canAccessChantierProject, canDeleteChantierProject } from "@/lib/chantier-dossier/access";
import { projectMessageVisibilityWhere } from "@/lib/messaging/access";
import { isSharedVisibility, userHasProjectScope } from "@/lib/equipe-acces/project-access";
import { canManageEquipe, isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { ProjectMissionsSection, type ChantierMissionRow } from "@/components/projects/ProjectMissionsSection";
import { DeleteChantierButton } from "@/components/chantier/DeleteChantierButton";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import {
  syncProjectMissionDocuments,
  findOrphanMissionDocumentsForProject,
} from "@/lib/chantier-dossier/sync-mission-documents";
import { ChantierOrphanMissionBanner } from "@/components/chantier/ChantierOrphanMissionBanner";
import { ChantierStatusSelect } from "@/components/chantier/ChantierStatusSelect";
import { TaskStatus } from "@prisma/client";
import { ProjectMessagerieLinks } from "@/components/messagerie/MessagerieContextLinks";
import {
  chantierStatusDisplayLabel,
} from "@/lib/chantier/cockpit-ops";
import {
  ChantierOpsOverviewDeferred,
  ChantierOpsOverviewSkeleton,
} from "@/components/chantier/ChantierOpsOverviewDeferred";
import { projectTeamHref } from "@/lib/messagerie/resolve-conversation";
import {
  CHANTIER_MISSING_STATUSES,
} from "@/lib/chantier-dossier/constants";
import { ChantierContractuelPanel } from "@/components/chantier/ChantierContractuelPanel";
import { ChantierSubcontractorsPanel } from "@/components/chantier/ChantierSubcontractorsPanel";
import { canEditPilotageOperational } from "@/lib/pilotage/access";
import { isActionOpen, isVisaPending, isOverdue } from "@/lib/pilotage/calculations";
import { ProjectMateriauxSection } from "@/components/projects/ProjectMateriauxSection";
import { loadMaterialRequirementsForProject } from "@/lib/materiaux/load-for-project";
import { isInternalPurchaseOrderActor } from "@/lib/purchase-orders/access";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";
import {
  ProjectPreparationDeferred,
  ProjectPreparationSkeleton,
} from "@/components/chantier/ProjectPreparationDeferred";
import {
  ChantierDossierDeferred,
  ChantierDossierSkeleton,
} from "@/components/chantier/ChantierDossierDeferred";
import type { ChantierFolderWithFiles } from "@/components/chantier/ChantierDossierSection";
import {
  ProjectProfitabilityDeferred,
  ProjectProfitabilitySkeleton,
} from "@/components/chantier/ProjectProfitabilityDeferred";
import { ProjectSignature } from "@/components/chantier/project-signature/ProjectSignature";
import { ProjectStatusBadge } from "@/components/chantier/project-signature/ProjectStatusBadge";
import {
  projectSignatureRef,
  resolveCraftsFromScopes,
} from "@/lib/chantier/craft-signature";
import { CHANTIER_FILE_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
export default async function ProjetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tPage = Date.now();
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const actorProfile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { personType: true, permissionProfile: true },
  });
  // Fournisseur : pas de cockpit chantier interne
  if (
    actorProfile?.personType === "SUPPLIER" ||
    actorProfile?.permissionProfile === "FOURNISSEUR"
  ) {
    redirect("/dashboard");
  }

  const channelFilterEarly =
    session.user.role === "CLIENT"
      ? await (async () => {
          const { projectMessageChannelFilter } = await import("@/lib/messaging/access");
          return projectMessageChannelFilter(session.user.id, session.user.role);
        })()
      : null;

  const tShell = Date.now();
  const [project, actionsConsumed, chantierMissions, access] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            personType: true,
            role: true,
            accessStatus: true,
            monthlyActionsTotal: true,
            monthlyActionsUsed: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            personType: true,
            role: true,
            permissionProfile: true,
            accessStatus: true,
            jobTitle: true,
          },
        },
        organization: { select: { name: true } },
        messages: {
          where: {
            ...projectMessageVisibilityWhere(session.user.id),
            ...(channelFilterEarly
              ? { channel: { in: channelFilterEarly.channels } }
              : {}),
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            receiverId: true,
            channel: true,
            sender: { select: { id: true, name: true, role: true } },
            receiver: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        },
        documents: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            name: true,
            createdAt: true,
            mimeType: true,
            fileUrl: true,
          },
        },
        projectScopes: {
          where: { status: "ACTIVE" },
          select: { code: true, name: true, status: true, displayOrder: true },
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          take: 24,
        },
      },
    }),
    prisma.task.aggregate({
      where: { projectId: id, actionsUsed: { not: null } },
      _sum: { actionsUsed: true },
    }),
    prisma.task.findMany({
      where: { projectId: id },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        missionType: true,
        desiredDate: true,
        actionsUsed: true,
        estimatedActions: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    canAccessChantierProject(session.user, id),
  ]);

  if (!project) notFound();
  if (!access.ok) notFound();

  console.info(
    `[PROJECT PERF] shell project+missions+access: ${Date.now() - tShell}ms`,
  );

  const [clientExtAccess, followUpClient, clientChannel] = await Promise.all([
    prisma.projectAccess.findMany({
      where: {
        projectId: id,
        user: { personType: "CLIENT_EXT", accessStatus: "ACTIVE" },
      },
      select: { user: { select: { name: true, company: true } } },
      take: 5,
    }),
    prisma.followUpSheet.findFirst({
      where: { projectId: id, NOT: { status: "AVENANT" } },
      select: { clientName: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.projectChannel.findFirst({
      where: { projectId: id, type: "CLIENT" },
      select: {
        externalOrganization: { select: { name: true, tradeName: true } },
      },
    }),
  ]);

  const presentation = buildProjectPresentation({
    title: project.title,
    chantierStatusLabel: chantierStatusDisplayLabel(project.chantierStatus),
    client: project.client
      ? {
          id: project.client.id,
          name: project.client.name,
          company: project.client.company,
          personType: project.client.personType,
          role: project.client.role,
          accessStatus: project.client.accessStatus,
        }
      : null,
    assignedTo: project.assignedTo,
    internalManager: project.internalManager,
    hostOrganizationName: project.organization?.name ?? null,
    clientOrganizationName:
      clientChannel?.externalOrganization?.tradeName ||
      clientChannel?.externalOrganization?.name ||
      null,
    clientExtLabels: clientExtAccess.map(
      (a) => a.user.company?.trim() || a.user.name?.trim() || "",
    ),
    followUpClientName: followUpClient?.clientName ?? null,
  });

  // Écritures d’entretien : hors chemin critique (ne bloquent plus le 1er rendu)
  after(async () => {
    try {
      await ensureChantierFolders(id);
      await syncProjectMissionDocuments(id);
    } catch (e) {
      console.error("[ProjetDetail] after ensure/sync:", e);
    }
  });

  const isAgenceRole =
    session.user.role === "AGENCE" || session.user.role === "MANAGER";

  const orphanMissions = isAgenceRole
    ? await findOrphanMissionDocumentsForProject(id).catch(() => [])
    : [];

  const portalUser =
    session.user.role === "CLIENT"
      ? actorProfile
      : null;
  const isExternalViewer = isExternalPortalUser(portalUser?.personType);
  const projectScopeCtx = {
    id,
    clientId: project.clientId,
    organizationId: project.organizationId,
  };
  const canSeeDocuments =
    session.user.role !== "CLIENT" ||
    (await userHasProjectScope(session.user.id, projectScopeCtx, "documents"));
  const canSeeMessages =
    session.user.role !== "CLIENT" ||
    (await userHasProjectScope(session.user.id, projectScopeCtx, "messages"));

  const canSeeContractuel =
    !isExternalViewer &&
    actorProfile?.personType !== "CLIENT_EXT" &&
    actorProfile?.personType !== "SUPPLIER";

  const canSeeRentabilite =
    canSeeContractuel &&
    canAccessDashboardHref(
      "/dashboard/rentabilite",
      actorProfile?.personType ?? session.user.personType,
      actorProfile?.permissionProfile ?? session.user.permissionProfile,
    );

  const canSeeMateriaux =
    !isExternalViewer && isInternalPurchaseOrderActor(session.user);

  const tHeavy = Date.now();
  const [chantierFolders, missingCount, contractuelRaw, billingHint, materiauxRows] =
    await Promise.all([
      canSeeDocuments
        ? prisma.chantierFolder.findMany({
            where: { projectId: id },
            orderBy: { sortOrder: "asc" },
            include: {
              files: {
                orderBy: { createdAt: "desc" },
                take: 40,
                include: { addedBy: { select: { name: true } } },
              },
            },
          })
        : Promise.resolve([]),
      prisma.chantierFile.count({
        where: { projectId: id, status: { in: CHANTIER_MISSING_STATUSES } },
      }),
      // Summary légère — pas le détail contractuel complet
      canSeeContractuel
        ? prisma.worksitePilotage.findUnique({
            where: { projectId: id },
            select: {
              id: true,
              archivedAt: true,
              blockers: {
                where: { archivedAt: null, status: { in: ["Ouvert", "En cours"] } },
                select: { severity: true },
              },
              obligations: {
                where: { archivedAt: null, status: { notIn: ["Validée", "Non applicable"] } },
                select: { id: true },
              },
              plans: {
                where: { archivedAt: null },
                select: { status: true, visaDueDate: true },
              },
              doeItems: {
                where: { archivedAt: null },
                select: { status: true },
              },
              actions: {
                where: { archivedAt: null },
                select: { status: true, dueDate: true },
              },
            },
          })
        : Promise.resolve(null),
      !isExternalViewer
        ? import("@/lib/facturation/snapshot")
            .then(({ getProjectBillingHint }) =>
              getProjectBillingHint({
                user: {
                  id: session.user.id,
                  role: session.user.role,
                  personType: session.user.personType ?? null,
                },
                projectId: id,
              }),
            )
            .catch(() => null)
        : Promise.resolve(null),
      canSeeMateriaux && project.organizationId
        ? loadMaterialRequirementsForProject({
            organizationId: project.organizationId,
            projectId: id,
          }).catch((e) => {
            console.error("[ProjetDetail] materiaux:", e);
            return [];
          })
        : Promise.resolve([]),
    ]);
  console.info(
    `[PROJECT PERF] heavy parallel (folders/pilotage/…).: ${Date.now() - tHeavy}ms`,
  );

  const dossierFolders: ChantierFolderWithFiles[] = chantierFolders.map((folder) => ({
    id: folder.id,
    code: folder.code,
    label: folder.label,
    files: folder.files
      .filter((f) => {
        if (!isExternalViewer) return true;
        return isSharedVisibility(f.visibility);
      })
      .map((f) => ({
        id: f.id,
        name: f.name,
        fileUrl: f.fileUrl,
        mimeType: f.mimeType,
        documentType: f.documentType,
        status: f.status as keyof typeof CHANTIER_FILE_STATUS_LABELS,
        comment: f.comment,
        createdAt: f.createdAt.toISOString(),
        addedBy: f.addedBy
          ? { name: f.addedBy.name?.trim() || "—" }
          : null,
        visibility: f.visibility,
      })),
  }));

  const projectActionsUsed = actionsConsumed._sum.actionsUsed ?? 0;
  const clientTotal =
    project?.client && "monthlyActionsTotal" in project.client
      ? (project.client as { monthlyActionsTotal: number }).monthlyActionsTotal
      : 0;
  const clientUsed =
    project?.client && "monthlyActionsUsed" in project.client
      ? (project.client as { monthlyActionsUsed: number }).monthlyActionsUsed
      : 0;
  const clientRemaining = Math.max(0, clientTotal - clientUsed);

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isStaff = isAgence || session.user.role === "AGENT";
  const canEditDossier =
    isStaff ||
    project.clientId === session.user.id ||
    (session.user.role === "CLIENT" &&
      !isExternalViewer &&
      canManageEquipe(portalUser?.personType, portalUser?.permissionProfile));
  const canManageShare =
    isAgence ||
    project.clientId === session.user.id ||
    (session.user.role === "CLIENT" &&
      !isExternalViewer &&
      canManageEquipe(portalUser?.personType, portalUser?.permissionProfile));
  const canDeleteChantier = canDeleteChantierProject(session.user, project);

  let agents: { id: string; name: string; email: string }[] = [];
  if (isStaff) {
    agents = await prisma.user.findMany({
      where: { role: { in: ["AGENT", "AGENCE"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  }

  const missionsRows: ChantierMissionRow[] = chantierMissions.map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
    priority: m.priority,
    missionType: m.missionType,
    desiredDate: m.desiredDate ? m.desiredDate.toISOString() : null,
    actionsUsed: m.actionsUsed,
    estimatedActions: m.estimatedActions,
    assignedTo: m.assignedTo,
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const openTasks = chantierMissions.filter((t) => t.status !== TaskStatus.COMPLETE);
  const overdue = openTasks.filter((t) => t.desiredDate && t.desiredDate < today);
  const ordersPending = openTasks.filter(
    (t) =>
      (t.category ?? "").toLowerCase().includes("bon de commande") &&
      t.status === TaskStatus.A_VALIDER,
  );

  const attentionItems = [
    ...ordersPending.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: "Bon de commande à valider",
      href: `/dashboard/taches/${t.id}`,
      tone: "critical" as const,
    })),
    ...overdue.slice(0, 4).map((t) => ({
      id: `ov-${t.id}`,
      title: t.title,
      subtitle: "Échéance dépassée",
      href: `/dashboard/taches/${t.id}`,
      tone: "watch" as const,
    })),
    ...(missingCount > 0
      ? [
          {
            id: "missing-docs",
            title: `${missingCount} pièce${missingCount > 1 ? "s" : ""} manquante${missingCount > 1 ? "s" : ""}`,
            subtitle: "Classeur chantier",
            href: `/dashboard/projets/manquants?chantier=${encodeURIComponent(id)}`,
            tone: "watch" as const,
          },
        ]
      : []),
  ].slice(0, 8);

  const responsibleLabel = presentation.responsibleLabel;
  const craftSignatures = resolveCraftsFromScopes(project.projectScopes ?? []);
  const locationLabel = project.siteCity?.trim() || null;
  const secondaryFacts: { value: string; label: string }[] = [];
  if (project.signedQuoteAmount != null) {
    secondaryFacts.push({
      value: Number(project.signedQuoteAmount).toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
      label: "HT signé",
    });
  }
  if (project.plannedStartDate || project.dateSouhaitee) {
    secondaryFacts.push({
      value: new Date(
        project.plannedStartDate ?? project.dateSouhaitee!,
      ).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      label: "Début",
    });
  }

  const contextCard = (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        Contexte chantier
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-700">
        {project.siteAddress ? (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Adresse</p>
            <p>{project.siteAddress}</p>
          </div>
        ) : null}
        {project.plannedStartDate ? (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Démarrage</p>
            <p>{new Date(project.plannedStartDate).toLocaleDateString("fr-FR")}</p>
          </div>
        ) : project.dateSouhaitee ? (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Date souhaitée</p>
            <p>{new Date(project.dateSouhaitee).toLocaleDateString("fr-FR")}</p>
          </div>
        ) : null}
        {project.plannedEndDate ? (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Fin prévue</p>
            <p>{new Date(project.plannedEndDate).toLocaleDateString("fr-FR")}</p>
          </div>
        ) : project.deadline ? (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Deadline</p>
            <p>{new Date(project.deadline).toLocaleDateString("fr-FR")}</p>
          </div>
        ) : null}
        {project.signedQuoteAmount != null ? (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Devis signé</p>
            <p className="font-semibold">
              {Number(project.signedQuoteAmount).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              })}{" "}
              HT
            </p>
          </div>
        ) : null}
      </div>
      {project.notes ? (
        <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm text-slate-600">
          {project.notes}
        </p>
      ) : null}
      {isAgence ? (
        <p className="mt-3 text-xs text-slate-500">
          Actions BeWork : {projectActionsUsed} · Client {clientUsed}/{clientTotal} (restant{" "}
          {clientRemaining})
        </p>
      ) : null}
    </div>
  );

  const tachesPanel = (
    <ProjectMissionsSection
      projectId={id}
      projectTitle={project.title}
      clientId={project.clientId}
      clientName={project.client.name}
      missions={missionsRows}
      agents={agents.map((a) => ({ id: a.id, name: a.name }))}
      canCreate={isStaff}
    />
  );

  const documentsPanel = !canSeeDocuments ? (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
      Documents non inclus dans votre périmètre sur ce chantier. Demandez un accès « documents » au
      conducteur.
    </div>
  ) : (
    <div className="space-y-4">
      {isExternalViewer ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          Seules les pièces marquées comme partagées sont visibles. Les documents internes
          entreprise restent masqués.
        </p>
      ) : null}
      {!isExternalViewer ? <SiteDocumentsEntryCard projectId={project.id} /> : null}
      <ChantierOrphanMissionBanner projectId={id} orphans={orphanMissions} />
      <Suspense fallback={<ChantierDossierSkeleton />}>
        <ChantierDossierDeferred
          projectId={id}
          projectTitle={project.title}
          folders={dossierFolders}
          canEdit={canEditDossier}
          user={{
            id: session.user.id,
            role: session.user.role,
            personType: actorProfile?.personType ?? session.user.personType ?? null,
            permissionProfile:
              actorProfile?.permissionProfile ?? session.user.permissionProfile ?? null,
            name: session.user.name ?? null,
          }}
        />
      </Suspense>
      {!isExternalViewer && project.documents.length > 0 ? (
        <div className="rounded-xl surface-metallic-light p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Pièces jointes ({project.documents.length})
          </h2>
          <ul className="space-y-2">
            {project.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="truncate text-sm text-slate-800">{doc.name}</span>
                <a
                  href={`/api/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );

  const messagesPanel = !canSeeMessages ? (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
      Messagerie non incluse dans votre périmètre sur ce chantier.
    </div>
  ) : (
    <div className="rounded-xl surface-metallic-light p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Messages</h2>
      <p className="mb-3 text-xs text-slate-500">
        Pour les fils INTERNE / CLIENT / FOURNISSEUR, utilisez aussi Messagerie → onglet
        Chantiers.
      </p>
      <div className="space-y-4">
        {project.messages.length === 0 ? (
          <p className="text-slate-500">Aucun message pour le moment.</p>
        ) : (
          [...project.messages].reverse().map((msg) => {
            const isFromMe = msg.senderId === session.user?.id;
            return (
              <div
                key={msg.id}
                className={`rounded-lg p-4 ${isFromMe ? "ml-8 bg-blue-50" : "mr-8 bg-slate-100"}`}
              >
                <p className="text-sm font-medium text-slate-700">
                  {msg.sender.name} → {msg.receiver.name}
                  {"channel" in msg && msg.channel ? (
                    <span className="ml-2 text-xs text-slate-400">({String(msg.channel)})</span>
                  ) : null}
                </p>
                <p className="mt-1 text-slate-800">{msg.content}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(msg.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
            );
          })
        )}
      </div>
      <MessageForm
        projectId={project.id}
        clientId={project.clientId}
        client={project.client ? { id: project.client.id, name: project.client.name } : undefined}
        isAgence={isAgence}
        sessionUserId={session.user.id}
      />
    </div>
  );

  const partagePanel = canManageShare ? <ChantierSharePanel projectId={id} /> : null;

  const materiauxReadOnly = project.chantierStatus === "TERMINE";
  const materiauxPanel = canSeeMateriaux ? (
    <ProjectMateriauxSection
      projectId={id}
      projectTitle={project.title}
      initialRows={materiauxRows}
      canWrite={isStaff && !materiauxReadOnly}
    />
  ) : null;

  const organisationPanel = (
    <div className="space-y-4">
      <SiteDocumentsEntryCard projectId={project.id} />
      <ProjectAssignAgent
        projectId={project.id}
        assignedToId={project.assignedToId ?? null}
        assignedTo={project.assignedTo ?? null}
        agents={agents}
        isAgence={isAgence}
      />
      <ProjectReportsSection projectId={project.id} isAgence={isAgence} />
      {canAccessBeWorkSkills(session.user.role) ? (
        <ProjectPpspsSection projectId={project.id} projectTitle={project.title} />
      ) : null}
    </div>
  );

  const contractuelActive =
    contractuelRaw && !contractuelRaw.archivedAt ? contractuelRaw : null;
  const contractuelPanel = canSeeContractuel ? (
    <ChantierContractuelPanel
      projectId={project.id}
      projectTitle={project.title}
      canEdit={canEditPilotageOperational(session.user.role)}
      summary={
        contractuelActive
          ? {
              pilotageId: contractuelActive.id,
              openBlockers: contractuelActive.blockers.length,
              criticalBlockers: contractuelActive.blockers.filter(
                (b) => b.severity === "Critique",
              ).length,
              openObligations: contractuelActive.obligations.length,
              visasPending: contractuelActive.plans.filter(
                (pl) => isVisaPending(pl.status) || isOverdue(pl.visaDueDate, pl.status),
              ).length,
              doeIncomplete: contractuelActive.doeItems.filter(
                (d) => d.status !== "Conforme" && d.status !== "Non applicable",
              ).length,
              doeTotal: contractuelActive.doeItems.length,
              openActions: contractuelActive.actions.filter((a) => isActionOpen(a.status))
                .length,
            }
          : null
      }
    />
  ) : null;

  const rentabilitePanel =
    canSeeRentabilite && project.organizationId ? (
      <Suspense fallback={<ProjectProfitabilitySkeleton />}>
        <ProjectProfitabilityDeferred
          organizationId={project.organizationId}
          projectId={id}
        />
      </Suspense>
    ) : null;

  const sousTraitantsPanel = canSeeContractuel ? (
    <ChantierSubcontractorsPanel projectId={project.id} canEdit={isStaff} />
  ) : null;

  console.info(
    `[PROJECT PERF] total server before stream: ${Date.now() - tPage}ms project=${id}`,
  );

  return (
    <div className="space-y-5">
      <ChantierHierarchyNav
        backHref={chantierProjectsHref()}
        backLabel="Retour aux chantiers"
        crumbs={[
          workspaceHomeCrumb(),
          { label: "Chantiers", href: chantierProjectsHref() },
          { label: project.title },
        ]}
      />

      <ProjectSignature
        title={presentation.displayTitle}
        projectRef={projectSignatureRef(project.id)}
        clientLabel={presentation.clientLabel}
        locationLabel={locationLabel}
        responsibleLabel={responsibleLabel}
        crafts={craftSignatures}
        secondaryFacts={secondaryFacts}
        statusSlot={
          isStaff ? (
            <ChantierStatusSelect
              projectId={project.id}
              value={project.chantierStatus}
              canEdit
              className="bw-psig-status-select"
            />
          ) : (
            <ProjectStatusBadge
              status={project.chantierStatus}
              label={chantierStatusDisplayLabel(project.chantierStatus)}
              size="md"
            />
          )
        }
        teamHref={
          !isExternalViewer
            ? withReturnTo(projectTeamHref(project.id), `/dashboard/projets/${project.id}`)
            : null
        }
        agendaHref={`/dashboard/agenda?projectId=${encodeURIComponent(id)}`}
        overflowSlot={
          <details className="relative">
            <summary>•••</summary>
            <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {!isExternalViewer && isStaff ? (
                <Link
                  href="/dashboard/a-traiter"
                  className="block px-3.5 py-2 text-sm text-slate-800 hover:bg-slate-50"
                >
                  À traiter
                </Link>
              ) : null}
              {!isExternalViewer ? (
                <div className="border-b border-slate-100 px-2 py-2">
                  <ProjectMessagerieLinks projectId={project.id} />
                </div>
              ) : null}
              {missingCount > 0 ? (
                <Link
                  href={`/dashboard/projets/manquants?chantier=${encodeURIComponent(id)}`}
                  className="block px-3.5 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  {missingCount} pièce{missingCount > 1 ? "s" : ""} manquante
                  {missingCount > 1 ? "s" : ""}
                </Link>
              ) : null}
              {canDeleteChantier ? (
                <div className="px-2 py-1">
                  <DeleteChantierButton
                    projectId={id}
                    projectTitle={project.title}
                    redirectTo="/dashboard/projets"
                    label="Supprimer le chantier"
                    className="w-full px-2 py-2 text-left text-sm"
                  />
                </div>
              ) : null}
            </div>
          </details>
        }
      />

      {!isExternalViewer && project.organizationId ? (
        <Suspense fallback={<ProjectPreparationSkeleton />}>
          <ProjectPreparationDeferred
            organizationId={project.organizationId}
            projectId={id}
            canEdit={canEditDossier}
            hasResponsible={!!responsibleLabel}
            missingDocumentsCount={missingCount}
          />
        </Suspense>
      ) : null}

      <ChantierCockpit
        stats={[
          {
            label: "Tâches ouvertes",
            value: openTasks.length,
            tone: openTasks.length > 0 ? "watch" : "ok",
          },
          {
            label: "En retard",
            value: overdue.length,
            tone: overdue.length > 0 ? "critical" : "neutral",
          },
          {
            label: "BC à valider",
            value: ordersPending.length,
            tone: ordersPending.length > 0 ? "critical" : "neutral",
          },
          {
            label: "Pièces manquantes",
            value: missingCount,
            tone: missingCount > 0 ? "watch" : "ok",
            href:
              missingCount > 0
                ? `/dashboard/projets/manquants?chantier=${encodeURIComponent(id)}`
                : undefined,
          },
        ]}
        attentionItems={attentionItems}
        opsOverview={
          <Suspense fallback={<ChantierOpsOverviewSkeleton />}>
            <ChantierOpsOverviewDeferred
              projectId={id}
              projectTitle={project.title}
              externalViewer={isExternalViewer}
              billingHint={
                billingHint
                  ? {
                      label: billingHint.label,
                      count: billingHint.count,
                      href: billingHint.href,
                    }
                  : null
              }
            />
          </Suspense>
        }
        travauxExternalLinks={[
          {
            label: "Planning & suivi",
            href: `/dashboard/projets/${id}/suivi-planning`,
          },
        ]}
        documentsExternalLinks={[
          {
            label: "Documents chantier",
            href: `/dashboard/projets/${id}/documents-chantier`,
          },
        ]}
        hiddenTabs={canManageShare ? undefined : ["partage"]}
        panels={{
          overview: contextCard,
          taches: tachesPanel,
          materiaux: materiauxPanel,
          documents: documentsPanel,
          messages: messagesPanel,
          partage: partagePanel,
          "sous-traitants": sousTraitantsPanel,
          contractuel: contractuelPanel,
          rentabilite: rentabilitePanel,
          pilotage: organisationPanel,
        }}
      />
    </div>
  );
}
