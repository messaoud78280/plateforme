import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { FollowUpSheetStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  followUpSheetAccessWhere,
  resolveFollowUpOwnerUserId,
} from "@/lib/follow-up/access";
import { colorKeyForStatus, DEFAULT_REMINDER_OFFSETS_HOURS } from "@/lib/follow-up/types";
import { serializeFollowUpSheet } from "@/lib/follow-up/serialize";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { isBeworkStaff } from "@/lib/authz";

const VALID_STATUS = new Set<string>([
  "NOUVEAU",
  "A_ANALYSER",
  "A_PLANIFIER",
  "PLANIFIE",
  "COMMANDE_FOURNISSEUR",
  "COMMANDE_PASSEE",
  "ATTENTE_FOURNISSEUR",
  "INTERVENTION_PREVUE",
  "EN_COURS",
  "TRAVAUX_TERMINES",
  "CR_A_RECUPERER",
  "AVENANT",
  "A_FACTURER",
  "FACTURE",
  "ATTENTE_REGLEMENT",
  "TERMINE",
  "ARCHIVE",
]);

/** GET /api/follow-up — liste des fiches */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const filter = searchParams.get("filter"); // overdue | today | week | urgent

  try {
    const accessWhere = await followUpSheetAccessWhere(session.user);
    const settings = await getFollowUpSettings(
      await resolveFollowUpOwnerUserId(session.user.id),
    );
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);
    const endWeek = new Date(startToday);
    endWeek.setDate(endWeek.getDate() + (7 - endWeek.getDay() || 7));

    const sheets = await prisma.followUpSheet.findMany({
      where: {
        AND: [
          accessWhere,
          ...(status && VALID_STATUS.has(status)
            ? [{ status: status as FollowUpSheetStatus }]
            : [{ status: { not: "ARCHIVE" as const } }]),
          ...(q
            ? [
                {
                  OR: [
                    { title: { contains: q, mode: "insensitive" as const } },
                    { clientName: { contains: q, mode: "insensitive" as const } },
                    { osNumber: { contains: q, mode: "insensitive" as const } },
                    { orderNumber: { contains: q, mode: "insensitive" as const } },
                    { nextAction: { contains: q, mode: "insensitive" as const } },
                  ],
                },
              ]
            : []),
          ...(filter === "overdue"
            ? [{ nextActionDone: false, nextActionAt: { lt: now } }]
            : []),
          ...(filter === "today"
            ? [
                {
                  nextActionDone: false,
                  nextActionAt: { gte: startToday, lte: endToday },
                },
              ]
            : []),
          ...(filter === "week"
            ? [
                {
                  nextActionDone: false,
                  nextActionAt: { gte: startToday, lte: endWeek },
                },
              ]
            : []),
        ],
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
      },
      orderBy: [{ nextActionAt: "asc" }, { updatedAt: "desc" }],
      take: 200,
    });

    let items = sheets.map((s) => serializeFollowUpSheet(s, settings.thresholds));
    if (filter === "urgent") {
      items = items.filter((i) =>
        ["IMPORTANT", "URGENT", "CRITIQUE"].includes(i.urgency),
      );
    }

    const counts = {
      total: items.length,
      critique: items.filter((i) => i.urgency === "CRITIQUE").length,
      urgent: items.filter((i) => i.urgency === "URGENT" || i.urgency === "CRITIQUE").length,
      today: items.filter((i) => {
        if (!i.nextActionAt || i.nextActionDone) return false;
        const d = new Date(i.nextActionAt);
        return d >= startToday && d <= endToday;
      }).length,
      overdue: items.filter((i) => i.delayLabel != null).length,
      aPlanifier: items.filter((i) => i.status === "A_PLANIFIER" || i.status === "NOUVEAU").length,
      aFacturer: items.filter((i) => i.status === "A_FACTURER" || i.status === "TRAVAUX_TERMINES")
        .length,
      avenant: items.filter((i) => i.status === "AVENANT").length,
    };

    return NextResponse.json({ items, counts });
  } catch (e) {
    console.error("GET /api/follow-up", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** POST /api/follow-up — création ultra-simple */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title ?? body.clientName ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Indiquez au moins le chantier / client" }, { status: 400 });
    }

    const ownerUserId = isBeworkStaff(session.user)
      ? String(body.ownerUserId || session.user.id)
      : await resolveFollowUpOwnerUserId(session.user.id);

    const status =
      body.status && VALID_STATUS.has(String(body.status))
        ? (String(body.status) as FollowUpSheetStatus)
        : "NOUVEAU";

    const nextActionAt = body.nextActionAt ? new Date(String(body.nextActionAt)) : null;
    const receivedAt = body.receivedAt ? new Date(String(body.receivedAt)) : new Date();

    const org = await prisma.organization.findUnique({
      where: { ownerUserId },
      select: { id: true },
    });

    const sheet = await prisma.followUpSheet.create({
      data: {
        ownerUserId,
        createdById: session.user.id,
        organizationId: org?.id,
        projectId: body.projectId ? String(body.projectId) : undefined,
        assigneeId: body.assigneeId ? String(body.assigneeId) : session.user.id,
        title,
        clientName: body.clientName ? String(body.clientName) : title,
        siteAddress: body.siteAddress ? String(body.siteAddress) : undefined,
        workObject: body.workObject ? String(body.workObject) : undefined,
        orderNumber: body.orderNumber ? String(body.orderNumber) : undefined,
        osNumber: body.osNumber ? String(body.osNumber) : undefined,
        reference: body.reference ? String(body.reference) : undefined,
        receivedAt,
        status,
        colorKey: colorKeyForStatus(status),
        nextAction: body.nextAction ? String(body.nextAction) : "Analyser le dossier",
        nextActionAt: nextActionAt && !Number.isNaN(nextActionAt.getTime()) ? nextActionAt : undefined,
        notes: body.notes ? String(body.notes) : undefined,
        reminderOffsets: DEFAULT_REMINDER_OFFSETS_HOURS,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
      },
    });

    await appendFollowUpTimeline({
      sheetId: sheet.id,
      authorId: session.user.id,
      kind: "creation",
      label: "Fiche créée",
      detail: sheet.osNumber
        ? `OS n°${sheet.osNumber}`
        : sheet.orderNumber
          ? `Commande ${sheet.orderNumber}`
          : undefined,
    });

    if (sheet.nextAction) {
      await appendFollowUpTimeline({
        sheetId: sheet.id,
        authorId: session.user.id,
        kind: "action",
        label: `Prochaine action : ${sheet.nextAction}`,
        occurredAt: sheet.nextActionAt ?? undefined,
      });
    }

    const settings = await getFollowUpSettings(ownerUserId);
    return NextResponse.json(serializeFollowUpSheet(sheet, settings.thresholds), { status: 201 });
  } catch (e) {
    console.error("POST /api/follow-up", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
