import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadsBoard } from "@/components/commercial/LeadsBoard";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await requireCommercialSession("/dashboard/leads");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const leads = await prisma.commercialLead.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      city: true,
      postalCode: true,
      status: true,
      workType: true,
      nextAppointmentAt: true,
      createdAt: true,
    },
    orderBy: [{ nextAppointmentAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Commercial"
          title="Leads"
          description="Prospects et demandes — du premier contact au devis signé."
        />
        <Link
          href="/dashboard/devis-facturation/clients"
          className="text-[13px] font-semibold text-bework-accent hover:underline"
        >
          Voir les clients →
        </Link>
      </div>
      <LeadsBoard initialLeads={leads} />
    </div>
  );
}
