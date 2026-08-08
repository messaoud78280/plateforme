import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { projectWhereForClientUser } from "@/lib/organization/access";

const ACTIONS = ["photo", "termine", "reserve", "blocage"] as const;
type TerrainAction = (typeof ACTIONS)[number];

/**
 * Actions terrain démo (conducteur) — trace factuelle + alerte Direction.
 * Pas d’automatisation contractuelle : validation humaine requise.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isDemo) {
    return NextResponse.json({ error: "Réservé à la démonstration" }, { status: 403 });
  }
  const profile = session.user.permissionProfile;
  if (profile !== "CONDUCTEUR" && profile !== "CHEF_CHANTIER" && profile !== "DIRECTION") {
    return NextResponse.json({ error: "Réservé au profil terrain" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = ACTIONS.includes(body.action) ? (body.action as TerrainAction) : null;
  const note =
    typeof body.note === "string" && body.note.trim()
      ? body.note.trim().slice(0, 500)
      : null;
  const projectId = typeof body.projectId === "string" ? body.projectId : null;

  if (!action) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  const rootId = session.user.demoRootUserId ?? session.user.id;
  const projectWhere = await projectWhereForClientUser(session.user.id);

  let project: { id: string; title: string } | null = null;
  if (projectId) {
    project = await prisma.project.findFirst({
      where: { AND: [projectWhere, { id: projectId }] },
      select: { id: true, title: true },
    });
  } else {
    project = await prisma.project.findFirst({
      where: projectWhere,
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  const siteLabel = project?.title ?? "Chantier";
  const actor = session.user.name ?? "Conducteur";

  const labels: Record<TerrainAction, { title: string; level: "INFO" | "WARNING" | "URGENT"; msg: string }> = {
    photo: {
      title: `Photo terrain — ${siteLabel}`,
      level: "INFO",
      msg: `${actor} a signalé un ajout photo/document sur ${siteLabel}.${note ? ` Note : ${note}` : " À déposer dans Documents."}`,
    },
    termine: {
      title: `Tâche terminée — ${siteLabel}`,
      level: "INFO",
      msg: `${actor} a marqué une action comme terminée sur ${siteLabel}.${note ? ` ${note}` : ""}`,
    },
    reserve: {
      title: `Réserve signalée — ${siteLabel}`,
      level: "WARNING",
      msg: `${actor} a signalé une réserve sur ${siteLabel}.${note ? ` ${note}` : " Détail à préciser avant réception."}`,
    },
    blocage: {
      title: `Blocage chantier — ${siteLabel}`,
      level: "URGENT",
      msg: `${actor} signale un blocage sur ${siteLabel}.${note ? ` ${note}` : " Impact planning à évaluer."}`,
    },
  };

  const L = labels[action];

  try {
    await prisma.alert.create({
      data: {
        title: L.title,
        message: L.msg,
        level: L.level,
        clientId: rootId,
        actionUrl: project ? `/dashboard/projets/${project.id}` : "/dashboard/a-traiter",
      },
    });

    if (rootId !== session.user.id) {
      await createNotification({
        userId: rootId,
        type: "MESSAGE_RECEIVED",
        title: L.title,
        message: L.msg,
        actionUrl: project ? `/dashboard/projets/${project.id}` : "/dashboard/a-traiter",
      });
    }

    if (action === "termine" && project) {
      await prisma.task.create({
        data: {
          title: `Terrain — action terminée (${actor})`,
          description: note ?? `Signalement terrain sur ${siteLabel} — à valider.`,
          status: "COMPLETE",
          category: "Compte rendu chantier",
          clientId: rootId,
          projectId: project.id,
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      action,
      projectId: project?.id ?? null,
      redirect:
        action === "photo"
          ? "/dashboard/documents"
          : project
            ? `/dashboard/projets/${project.id}`
            : "/dashboard/a-traiter",
    });
  } catch (e) {
    console.error("terrain-action", e);
    return NextResponse.json({ error: "Erreur enregistrement terrain" }, { status: 500 });
  }
}
