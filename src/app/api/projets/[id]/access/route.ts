import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import {
  ensureOrganizationForOwner,
  resolveClientTenant,
} from "@/lib/organization/access";
import {
  parseScopesJson,
  revokeProjectAccess,
  scopesForProfile,
  upsertSingleProjectAccess,
} from "@/lib/equipe-acces/project-access";
import type { ProjectAccessScopes } from "@/lib/equipe-acces/types";
import { logAccessAction } from "@/lib/equipe-acces/audit";
import { createNotification } from "@/lib/notifications";
import { canManageEquipe, isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";

type Ctx = { params: Promise<{ id: string }> };

async function assertCanManageShare(userId: string, role: string | undefined, projectId: string) {
  const access = await canAccessChantierProject({ id: userId, role }, projectId);
  if (!access.ok || !access.project) {
    return { ok: false as const, status: 404, error: "Chantier introuvable" };
  }

  if (role === "MANAGER" || role === "AGENCE") {
    return { ok: true as const, project: access.project };
  }

  if (role !== "CLIENT") {
    return { ok: false as const, status: 403, error: "Accès refusé" };
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { personType: true, permissionProfile: true },
  });
  if (isExternalPortalUser(me?.personType)) {
    return { ok: false as const, status: 403, error: "Réservé à l’équipe interne" };
  }

  const isOwner = access.project.clientId === userId;
  if (!isOwner && !canManageEquipe(me?.personType, me?.permissionProfile)) {
    return { ok: false as const, status: 403, error: "Réservé aux administrateurs" };
  }

  return { ok: true as const, project: access.project };
}

/** GET — accès accordés + candidats (membres org). */
export async function GET(_request: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await context.params;
  const gate = await assertCanManageShare(session.user.id, session.user.role, projectId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const accesses = await prisma.projectAccess.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            personType: true,
            permissionProfile: true,
            company: true,
            accessStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const tenant = await resolveClientTenant(gate.project.clientId);
    const orgId =
      gate.project.organizationId ??
      tenant.organizationId ??
      (await ensureOrganizationForOwner(gate.project.clientId));

    let candidates: {
      id: string;
      name: string;
      email: string;
      personType: string | null;
      permissionProfile: string | null;
      company: string | null;
    }[] = [];

    if (orgId) {
      const members = await prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              personType: true,
              permissionProfile: true,
              company: true,
              accessStatus: true,
            },
          },
        },
      });
      const invited = await prisma.user.findMany({
        where: {
          invitedById: gate.project.clientId,
          accessStatus: { in: ["ACTIVE", "INVITED"] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          personType: true,
          permissionProfile: true,
          company: true,
        },
      });

      const byId = new Map<string, (typeof candidates)[0]>();
      for (const m of members) {
        if (m.user.id === gate.project.clientId) continue;
        if (m.user.accessStatus === "DISABLED") continue;
        byId.set(m.user.id, m.user);
      }
      for (const u of invited) {
        if (u.id === gate.project.clientId) continue;
        byId.set(u.id, u);
      }
      candidates = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      accesses: accesses.map((a) => ({
        id: a.id,
        userId: a.userId,
        scopes: parseScopesJson(a.scopesJson),
        createdAt: a.createdAt,
        user: a.user,
      })),
      candidates,
      projectId,
    });
  } catch (e) {
    console.error("GET project access", e);
    return NextResponse.json({ error: "Erreur chargement accès" }, { status: 500 });
  }
}

/** POST — accorder / mettre à jour un accès. */
export async function POST(request: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await context.params;
  const gate = await assertCanManageShare(session.user.id, session.user.role, projectId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur requis" }, { status: 400 });
    }
    if (userId === gate.project.clientId) {
      return NextResponse.json(
        { error: "Le propriétaire a déjà accès à tout le chantier." },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        personType: true,
        permissionProfile: true,
        invitedById: true,
      },
    });
    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    let scopes: ProjectAccessScopes = scopesForProfile(target.permissionProfile);
    if (body.scopes && typeof body.scopes === "object") {
      scopes = {
        messages: body.scopes.messages !== false,
        documents: body.scopes.documents !== false,
        agenda: body.scopes.agenda !== false,
        deliveries: body.scopes.deliveries === true,
      };
    }

    await upsertSingleProjectAccess({
      projectId,
      userId,
      grantedById: session.user.id,
      scopes,
    });

    const orgId = gate.project.organizationId;
    await logAccessAction({
      organizationId: orgId,
      actorUserId: session.user.id,
      targetUserId: userId,
      action: "PROJECT_ACCESS_GRANTED",
      detail: JSON.stringify({ projectId, scopes }),
    });

    const projectTitle =
      (
        await prisma.project.findUnique({
          where: { id: projectId },
          select: { title: true },
        })
      )?.title ?? "Chantier";

    await createNotification({
      userId,
      type: "DOCUMENT_ADDED",
      title: "Accès chantier accordé",
      message: `Vous avez accès à « ${projectTitle} » (${[
        scopes.messages ? "messages" : null,
        scopes.documents ? "documents" : null,
        scopes.agenda ? "agenda" : null,
        scopes.deliveries ? "livraisons" : null,
      ]
        .filter(Boolean)
        .join(", ")}).`,
      actionUrl: `/dashboard/projets/${projectId}`,
    });

    try {
      await prisma.alert.create({
        data: {
          title: "Accès chantier",
          message: `Accès ouvert sur « ${projectTitle} ».`,
          level: "INFO",
          clientId: userId,
          actionUrl: `/dashboard/projets/${projectId}`,
        },
      });
    } catch {
      /* alert optionnel */
    }

    return NextResponse.json({ ok: true, scopes });
  } catch (e) {
    console.error("POST project access", e);
    return NextResponse.json({ error: "Erreur lors du partage" }, { status: 500 });
  }
}

/** DELETE — retirer l’accès (?userId=). */
export async function DELETE(request: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await context.params;
  const gate = await assertCanManageShare(session.user.id, session.user.role, projectId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  try {
    await revokeProjectAccess(projectId, userId);
    await logAccessAction({
      organizationId: gate.project.organizationId,
      actorUserId: session.user.id,
      targetUserId: userId,
      action: "PROJECT_ACCESS_REVOKED",
      detail: JSON.stringify({ projectId }),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE project access", e);
    return NextResponse.json({ error: "Erreur révocation" }, { status: 500 });
  }
}
