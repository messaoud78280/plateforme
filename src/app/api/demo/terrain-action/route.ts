import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { applyTerrainTravauxTermines } from "@/lib/demo-environment/coherence-victor-hugo";

const ACTIONS = ["photo", "termine", "reserve", "blocage"] as const;
type TerrainAction = (typeof ACTIONS)[number];

/**
 * Actions terrain démo (conducteur) — branchées sur la fiche OS quand pertinent.
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
      where: {
        AND: [
          projectWhere,
          {
            OR: [
              { title: { contains: "Les Lilas" } },
              { title: { contains: "Victor Hugo" } },
            ],
          },
        ],
      },
      select: { id: true, title: true },
    });
    if (!project) {
      project = await prisma.project.findFirst({
        where: projectWhere,
        select: { id: true, title: true },
        orderBy: { updatedAt: "desc" },
      });
    }
  }

  const siteLabel = project?.title ?? "Chantier";
  const actor = session.user.name ?? "Conducteur";

  try {
    if (action === "termine" && project) {
      const result = await applyTerrainTravauxTermines({
        rootUserId: rootId,
        projectId: project.id,
        actorUserId: session.user.id,
        actorName: actor,
        note: note || "Terrasse terminée. RAS.",
      });

      const sheetUrl = result.sheetId
        ? `/dashboard/fiches-suivi/${result.sheetId}`
        : `/dashboard/projets/${project.id}`;

      await prisma.alert.create({
        data: {
          title: `Travaux terminés — ${siteLabel}`,
          message: `${actor} : ${note || "Terrasse terminée. RAS."} Prochaine action : préparer la facturation.`,
          level: "INFO",
          clientId: rootId,
          actionUrl: sheetUrl,
        },
      });

      await createNotification({
        userId: rootId,
        type: "TASK_COMPLETED",
        title: "Travaux terminés — à facturer",
        message: `${siteLabel} — prochaine action : préparer la facturation.`,
        actionUrl: sheetUrl,
      });

      return NextResponse.json({
        ok: true,
        action,
        projectId: project.id,
        sheetId: result.sheetId,
        redirect: sheetUrl,
      });
    }

    if (action === "termine") {
      return NextResponse.json({ error: "Chantier introuvable pour clôture terrain" }, { status: 404 });
    }

    const labels = {
      photo: {
        title: `Photo terrain — ${siteLabel}`,
        level: "INFO" as const,
        msg: `${actor} a signalé un ajout photo/document sur ${siteLabel}.${note ? ` Note : ${note}` : " À déposer dans Documents."}`,
      },
      reserve: {
        title: `Réserve signalée — ${siteLabel}`,
        level: "WARNING" as const,
        msg: `${actor} a signalé une réserve sur ${siteLabel}.${note ? ` ${note}` : " Détail à préciser avant réception."}`,
      },
      blocage: {
        title: `Blocage chantier — ${siteLabel}`,
        level: "URGENT" as const,
        msg: `${actor} signale un blocage sur ${siteLabel}.${note ? ` ${note}` : " Impact planning à évaluer."}`,
      },
    };

    const L = labels[action];
    const actionUrl = project ? `/dashboard/projets/${project.id}` : "/dashboard/a-traiter";

    await prisma.alert.create({
      data: {
        title: L.title,
        message: L.msg,
        level: L.level,
        clientId: rootId,
        actionUrl,
      },
    });

    if (rootId !== session.user.id) {
      await createNotification({
        userId: rootId,
        type: "MESSAGE_RECEIVED",
        title: L.title,
        message: L.msg,
        actionUrl,
      });
    }

    if (project && (action === "reserve" || action === "blocage")) {
      const sheet = await prisma.followUpSheet.findFirst({
        where: {
          projectId: project.id,
          OR: [{ osNumber: "4587" }, { title: { contains: "Les Lilas" } }],
          NOT: { status: "AVENANT" },
        },
        select: { id: true },
      });
      if (sheet) {
        const { appendFollowUpTimeline } = await import("@/lib/follow-up/timeline");
        await appendFollowUpTimeline({
          sheetId: sheet.id,
          authorId: session.user.id,
          kind: "terrain",
          label: L.title,
          detail: L.msg,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      action,
      projectId: project?.id ?? null,
      redirect: action === "photo" ? "/dashboard/documents" : actionUrl,
    });
  } catch (e) {
    console.error("terrain-action", e);
    return NextResponse.json({ error: "Erreur enregistrement terrain" }, { status: 500 });
  }
}
