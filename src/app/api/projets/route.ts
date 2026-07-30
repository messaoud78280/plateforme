import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ChantierStatus, ProjectUrgency } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import {
  ensureOrganizationForOwner,
  projectWhereForClientUser,
  resolveClientTenant,
} from "@/lib/organization/access";
import { isAgent, isBeworkStaff } from "@/lib/authz";
import { mapChantierToProjectStatus } from "@/lib/chantier-lifecycle";

const CHANTIER_STATUSES: ChantierStatus[] = ["ETUDE", "EN_COURS", "EN_ATTENTE", "RECEPTION", "TERMINE"];
const URGENCIES: ProjectUrgency[] = ["BASSE", "MOYENNE", "HAUTE", "URGENTE"];

/** GET /api/projets – Liste des projets accessibles */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const isStaff = isBeworkStaff(session.user);

  try {
    const projects = await prisma.project.findMany({
      where: isStaff
        ? isAgent(session.user)
          ? { assignedToId: session.user.id }
          : {}
        : await projectWhereForClientUser(session.user.id),
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        chantierStatus: true,
        siteCity: true,
        urgency: true,
        clientId: true,
        createdAt: true,
        client: { select: { id: true, name: true } },
        assignedToId: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur liste projets:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des projets." }, { status: 500 });
  }
}

/** POST /api/projets – Créer un chantier + rubriques dossier */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Le nom du chantier est obligatoire." }, { status: 400 });
  }

  const isStaff = isBeworkStaff(session.user);

  let clientId = session.user.id;
  let organizationId: string | null = null;

  if (!isStaff) {
    const tenant = await resolveClientTenant(session.user.id);
    clientId = tenant.clientId;
    organizationId = tenant.organizationId;
  } else if (isStaff && body.clientId) {
    const target = await prisma.user.findFirst({
      where: { id: String(body.clientId), role: "CLIENT" },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Client introuvable." }, { status: 400 });
    }
    clientId = target.id;
    organizationId = await ensureOrganizationForOwner(clientId);
  } else if (isStaff && !body.clientId) {
    return NextResponse.json({ error: "Sélectionnez un client pour ce chantier." }, { status: 400 });
  }

  const chantierStatusRaw = String(body.chantierStatus ?? "ETUDE");
  const chantierStatus = CHANTIER_STATUSES.includes(chantierStatusRaw as ChantierStatus)
    ? (chantierStatusRaw as ChantierStatus)
    : "ETUDE";

  const urgencyRaw = String(body.urgency ?? "MOYENNE");
  const urgency = URGENCIES.includes(urgencyRaw as ProjectUrgency) ? (urgencyRaw as ProjectUrgency) : "MOYENNE";

  const parseDate = (v: unknown) => {
    if (!v || typeof v !== "string" || !v.trim()) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const signedQuoteRaw = body.signedQuoteAmount;
  let signedQuoteAmount: number | null = null;
  if (signedQuoteRaw !== null && signedQuoteRaw !== undefined && signedQuoteRaw !== "") {
    const n = Number(signedQuoteRaw);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Montant devis invalide." }, { status: 400 });
    }
    signedQuoteAmount = n;
  }

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description: body.description ? String(body.description).trim() || null : null,
        notes: body.notes ? String(body.notes).trim() || null : null,
        clientId,
        organizationId,
        status: mapChantierToProjectStatus(chantierStatus),
        chantierStatus,
        urgency,
        siteAddress: body.siteAddress ? String(body.siteAddress).trim() || null : null,
        siteCity: body.siteCity ? String(body.siteCity).trim() || null : null,
        internalManager: body.internalManager ? String(body.internalManager).trim() || null : null,
        signedQuoteAmount,
        plannedStartDate: parseDate(body.plannedStartDate),
        plannedEndDate: parseDate(body.plannedEndDate),
        dateSouhaitee: parseDate(body.plannedStartDate ?? body.dateSouhaitee),
        deadline: parseDate(body.plannedEndDate ?? body.deadline),
      },
      select: { id: true },
    });

    await ensureChantierFolders(project.id);

    return NextResponse.json({ id: project.id }, { status: 201 });
  } catch (error) {
    console.error("Erreur création chantier:", error);
    return NextResponse.json({ error: "Erreur lors de la création du chantier." }, { status: 500 });
  }
}
