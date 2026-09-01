import { notFound } from "next/navigation";
import { LeadDetailClient } from "@/components/commercial/LeadDetailClient";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCommercialSession("/dashboard/leads");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const { id } = await params;

  const lead = await prisma.commercialLead.findFirst({
    where: { id, organizationId: orgId },
    include: {
      agendaEvents: {
        orderBy: { startAt: "asc" },
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          location: true,
          status: true,
        },
      },
    },
  });
  if (!lead) notFound();

  return <LeadDetailClient lead={lead} />;
}
