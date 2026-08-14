import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import { buildProjectPresentation } from "@/lib/chantier/party-labels";
import {
  contextBackLabelForHref,
  sanitizeInternalReturnTo,
  withReturnTo,
} from "@/lib/navigation/safe-return-to";
import { MessageForm } from "@/components/MessageForm";
import { ProjectAssignAgent } from "@/components/projects/ProjectAssignAgent";
import { ProjectPpspsSection } from "@/components/projects/ProjectPpspsSection";
import { ProjectReportsSection } from "@/components/projects/ProjectReportsSection";
import { ChantierDossierSection } from "@/components/chantier/ChantierDossierSection";
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
import { Badge } from "@/components/ui/Badge";
import { TaskStatus } from "@prisma/client";
import { ProjectMessagerieLinks } from "@/components/messagerie/MessagerieContextLinks";
import {
  chantierStatusDisplayLabel,
  loadChantierCockpitOps,
} from "@/lib/chantier/cockpit-ops";
import {
  ChantierOpsOverview,
  ChantierQuickActions,
} from "@/components/chantier/ChantierOpsOverview";
import { projectTeamHref } from "@/lib/messagerie/resolve-conversation";
import {
  CHANTIER_MISSING_STATUSES,
} from "@/lib/chantier-dossier/constants";
import { chantierStatusBadgeTone } from "@/lib/chantier-lifecycle";
import { ChantierContractuelPanel } from "@/components/chantier/ChantierContractuelPanel";
import { ChantierSubcontractorsPanel } from "@/components/chantier/ChantierSubcontractorsPanel";
import { ProjectProfitabilityPanel } from "@/components/chantier/ProjectProfitabilityPanel";
import { loadProjectProfitability } from "@/lib/chantier/project-profitability";
import { canEditPilotageOperational } from "@/lib/pilotage/access";
import { isActionOpen, isVisaPending, isOverdue } from "@/lib/pilotage/calculations";
import { ProjectMateriauxSection } from "@/components/projects/ProjectMateriauxSection";
import { loadMaterialRequirementsForProject } from "@/lib/materiaux/load-for-project";
import { isInternalPurchaseOrderActor } from "@/lib/purchase-orders/access";
import { canAccessCommercialModule } from "@/lib/commercial/access";
import { loadDocumentHub } from "@/lib/ged/document-hub";

export default async function ProjetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const { returnTo: returnToRaw } = await searchParams;

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

  const [project, actionsConsumed, chantierMissions] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
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
          include: { sender: true, receiver: true },
          orderBy: { createdAt: "desc" },
          take: 40,
        },
        documents: { orderBy: { createdAt: "desc" }, take: 30 },
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
  ]);

  if (!project) notFound();

  const access = await canAccessChantierProject(session.user, id);
  if (!access.ok) notFound();

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

  const safeReturnTo = sanitizeInternalReturnTo(returnToRaw, "/dashboard/projets");
  const backLabel = contextBackLabelForHref(safeReturnTo, "Retour aux chantiers");

  await ensureChantierFolders(id);

  const isAgenceRole =
    session.user.role === "AGENCE" || session.user.role === "MANAGER";

  let syncBanner: { synced: number } | null = null;
  try {
    const syncResult = await syncProjectMissionDocuments(id);
    if (syncResult.synced > 0) syncBanner = { synced: syncResult.synced };
  } catch (e) {
    console.error("[ProjetDetail] sync mission documents:", e);
  }

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
    canSeeContractuel && canAccessCommercialModule(session.user);

  const canSeeMateriaux =
    !isExternalViewer && isInternalPurchaseOrderActor(session.user);

  const [chantierFolders, missingCount, ops, contractuelRaw, billingHint, materiauxRows, profitability, chantierHub] =
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
      loadChantierCockpitOps({
        projectId: id,
        projectTitle: project.title,
        externalViewer: isExternalViewer,
      }).catch((e) => {
        console.error("[ProjetDetail] cockpit ops:", e);
        return null;
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
      canSeeRentabilite && project.organizationId
        ? loadProjectProfitability(project.organizationId, id).catch((e) => {
            console.error("[ProjetDetail] profitability:", e);
            return null;
          })
        : Promise.resolve(null),
      canSeeDocuments
        ? loadDocumentHub({
            user: {
              id: session.user.id,
              role: session.user.role,
              personType: actorProfile?.personType ?? session.user.personType ?? null,
              permissionProfile: actorProfile?.permissionProfile ?? null,
              name: session.user.name ?? null,
            },
            page: 1,
            projectId: id,
            view: "all",
            sort: "recent",
          }).catch((e) => {
            console.error("[ProjetDetail] GED hub:", e);
            return { items: [], classifyCount: 0, missingCount: 0, companies: [], total: 0, page: 1, pageSize: 50, groups: [] };
          })
        : Promise.resolve({ items: [], classifyCount: 0, missingCount: 0, companies: [], total: 0, page: 1, pageSize: 50, groups: [] }),
    ]);

  const dossierFolders = chantierFolders.map((folder) => ({
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
        status: f.status,
        comment: f.comment,
        createdAt: f.createdAt.toISOString(),
        addedBy: f.addedBy,
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
      {syncBanner ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {syncBanner.synced} pièce{syncBanner.synced > 1 ? "s" : ""} importée
          {syncBanner.synced > 1 ? "s" : ""} depuis les missions liées à ce chantier.
        </p>
      ) : null}
      <ChantierOrphanMissionBanner projectId={id} orphans={orphanMissions} />
      <div id="dossier-chantier">
        <ChantierDossierSection
          projectId={id}
          projectTitle={project.title}
          folders={dossierFolders}
          canEdit={canEditDossier}
          hubItems={chantierHub.items}
          classifyCount={chantierHub.classifyCount}
        />
      </div>
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
    canSeeRentabilite && profitability ? (
      <ProjectProfitabilityPanel initial={profitability} />
    ) : null;

  const sousTraitantsPanel = canSeeContractuel ? (
    <ChantierSubcontractorsPanel projectId={project.id} canEdit={isStaff} />
  ) : null;

  return (
    <div className="space-y-5">
      <ContextBackButton
        label={backLabel}
        fallbackHref="/dashboard/projets"
        returnTo={returnToRaw}
      />

      <header className="rounded-xl border border-slate-200/90 bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Chantier
            </p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
              {project.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              {presentation.clientLabel ? (
                <span className="font-medium text-slate-800">{presentation.clientLabel}</span>
              ) : null}
              {presentation.clientLabel ? <span className="text-slate-300">·</span> : null}
              {isStaff ? (
                <ChantierStatusSelect projectId={project.id} value={project.chantierStatus} canEdit />
              ) : (
                <Badge tone={chantierStatusBadgeTone(project.chantierStatus)}>
                  {chantierStatusDisplayLabel(project.chantierStatus)}
                </Badge>
              )}
              {responsibleLabel ? (
                <>
                  <span className="text-slate-300">·</span>
                  <span>
                    Responsable :{" "}
                    <strong className="font-semibold text-slate-900">{responsibleLabel}</strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">Responsable à définir</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isExternalViewer ? (
              <Link
                href={withReturnTo(
                  projectTeamHref(project.id),
                  `/dashboard/projets/${project.id}`,
                )}
                className="inline-flex min-h-10 items-center rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#152a45]"
              >
                Message équipe
              </Link>
            ) : null}
            <Link
              href={ops?.links.agenda ?? `/dashboard/agenda?projectId=${encodeURIComponent(id)}`}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1e3a5f] hover:bg-slate-50"
            >
              Agenda
            </Link>
            {ops && !isExternalViewer ? (
              <ChantierQuickActions ops={ops} canCreate={isStaff} />
            ) : null}
            <details className="relative">
              <summary className="list-none cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                •••
              </summary>
              <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
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
          </div>
        </div>
      </header>

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
          ops ? (
            <ChantierOpsOverview
              ops={ops}
              mode={isExternalViewer ? "external" : "internal"}
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
          ) : undefined
        }
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
