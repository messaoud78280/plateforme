import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";

/** Autocomplete fournisseurs (ExternalOrganization SUPPLIER) — isolé org. */
export async function GET(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const suppliers = await prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: auth.orgId,
      type: "SUPPLIER",
      status: "ACTIVE",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tradeName: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      city: true,
    },
    orderBy: { name: "asc" },
    take: 20,
  });
  return NextResponse.json({ suppliers });
}
