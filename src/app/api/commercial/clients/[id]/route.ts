import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH — mise à jour fiche client (ExternalOrganization). */
export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
    requireWrite: true,
  });
  if (auth.error || !auth.session || !auth.orgId) {
    return NextResponse.json(
      { error: auth.error ?? "Non autorisé" },
      { status: auth.status },
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.externalOrganization.findFirst({
    where: {
      id,
      hostOrganizationId: auth.orgId,
      type: { in: ["CLIENT_EXT", "CLIENT"] },
    },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const client = await prisma.externalOrganization.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.email !== undefined
        ? { email: body.email ? String(body.email).trim() : null }
        : {}),
      ...(body.phone !== undefined
        ? { phone: body.phone ? String(body.phone).trim() : null }
        : {}),
      ...(body.address !== undefined
        ? { address: body.address ? String(body.address).trim() : null }
        : {}),
      ...(body.zipCode !== undefined
        ? { zipCode: body.zipCode ? String(body.zipCode).trim() : null }
        : {}),
      ...(body.city !== undefined
        ? { city: body.city ? String(body.city).trim() : null }
        : {}),
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      email: true,
      phone: true,
      address: true,
      zipCode: true,
      city: true,
      siret: true,
    },
  });

  return NextResponse.json({ client });
}
