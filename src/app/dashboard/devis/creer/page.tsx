import { QuoteCreationWizard } from "@/components/devis/QuoteCreationWizard";
import { QuoteSchemaMissingCallout } from "@/components/devis/QuoteSchemaMissingCallout";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

export default async function CreerDevisPage() {
  await requireBeWorkDevisSession();

  let quoteSchemaOk = true;
  let projects: { id: string; clientName: string; projectName: string }[] = [];
  try {
    projects = await prisma.quoteProject.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: { id: true, clientName: true, projectName: true },
    });
  } catch {
    quoteSchemaOk = false;
  }

  if (!quoteSchemaOk) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 px-1">
        <QuoteSchemaMissingCallout />
      </div>
    );
  }

  return <QuoteCreationWizard projects={projects} />;
}
