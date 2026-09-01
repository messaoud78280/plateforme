import { NextResponse } from "next/server";
import type { CommercialLeadStatus } from "@prisma/client";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import {
  convertLeadToClient,
  createCommercialLead,
  scheduleLeadAppointment,
  updateCommercialLead,
} from "@/lib/commercial/leads/actions";

export const runtime = "nodejs";

const STATUSES = new Set<CommercialLeadStatus>([
  "NOUVEAU",
  "CONTACTE",
  "RDV_PLANIFIE",
  "ETUDE_EN_COURS",
  "DEVIS_A_PREPARER",
  "DEVIS_ENVOYE",
  "A_RELANCER",
  "GAGNE",
  "PERDU",
]);

export async function GET(req: Request) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/leads",
    requireWrite: false,
  });
  if (auth.error || !auth.orgId) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: auth.status });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as CommercialLeadStatus | null;
  const q = (url.searchParams.get("q") ?? "").trim();

  const leads = await prisma.commercialLead.findMany({
    where: {
      organizationId: auth.orgId,
      ...(status && STATUSES.has(status) ? { status } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ nextAppointmentAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/leads",
    requireWrite: true,
  });
  if (auth.error || !auth.orgId || !auth.session?.user?.id) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "create";

  try {
    if (action === "create") {
      const lead = await createCommercialLead({
        organizationId: auth.orgId,
        createdById: auth.session.user.id,
        data: {
          firstName: String(body.firstName ?? ""),
          lastName: String(body.lastName ?? ""),
          phone: (body.phone as string) ?? null,
          email: (body.email as string) ?? null,
          city: (body.city as string) ?? null,
          postalCode: (body.postalCode as string) ?? null,
          addressLine1: (body.addressLine1 as string) ?? null,
          needDescription: (body.needDescription as string) ?? null,
          workType: (body.workType as string) ?? null,
          sourceSite: (body.sourceSite as string) ?? null,
          sourcePage: (body.sourcePage as string) ?? null,
          notes: (body.notes as string) ?? null,
          status:
            typeof body.status === "string" && STATUSES.has(body.status as CommercialLeadStatus)
              ? (body.status as CommercialLeadStatus)
              : "NOUVEAU",
        },
      });
      return NextResponse.json({ ok: true, lead });
    }

    if (action === "update") {
      const leadId = String(body.leadId ?? "");
      const lead = await updateCommercialLead({
        organizationId: auth.orgId,
        leadId,
        data: {
          firstName: body.firstName != null ? String(body.firstName) : undefined,
          lastName: body.lastName != null ? String(body.lastName) : undefined,
          phone: body.phone !== undefined ? (body.phone as string | null) : undefined,
          email: body.email !== undefined ? (body.email as string | null) : undefined,
          city: body.city !== undefined ? (body.city as string | null) : undefined,
          postalCode:
            body.postalCode !== undefined ? (body.postalCode as string | null) : undefined,
          addressLine1:
            body.addressLine1 !== undefined ? (body.addressLine1 as string | null) : undefined,
          needDescription:
            body.needDescription !== undefined
              ? (body.needDescription as string | null)
              : undefined,
          workType: body.workType !== undefined ? (body.workType as string | null) : undefined,
          sourceSite:
            body.sourceSite !== undefined ? (body.sourceSite as string | null) : undefined,
          sourcePage:
            body.sourcePage !== undefined ? (body.sourcePage as string | null) : undefined,
          notes: body.notes !== undefined ? (body.notes as string | null) : undefined,
          status:
            typeof body.status === "string" && STATUSES.has(body.status as CommercialLeadStatus)
              ? (body.status as CommercialLeadStatus)
              : undefined,
        },
      });
      return NextResponse.json({ ok: true, lead });
    }

    if (action === "schedule") {
      const leadId = String(body.leadId ?? "");
      const startAt = new Date(String(body.startAt ?? ""));
      const endAt = body.endAt
        ? new Date(String(body.endAt))
        : new Date(startAt.getTime() + 60 * 60 * 1000);
      if (Number.isNaN(startAt.getTime())) {
        return NextResponse.json({ error: "Date/heure invalide" }, { status: 400 });
      }
      const event = await scheduleLeadAppointment({
        organizationId: auth.orgId,
        leadId,
        ownerUserId: auth.session.user.id,
        startAt,
        endAt,
        location: (body.location as string) ?? null,
        notes: (body.notes as string) ?? null,
        title: (body.title as string) ?? null,
      });
      return NextResponse.json({ ok: true, event });
    }

    if (action === "convert") {
      const leadId = String(body.leadId ?? "");
      const result = await convertLeadToClient({
        organizationId: auth.orgId,
        leadId,
      });
      return NextResponse.json({
        ok: true,
        ...result,
        href: `/dashboard/devis-facturation/clients/${result.clientId}`,
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
