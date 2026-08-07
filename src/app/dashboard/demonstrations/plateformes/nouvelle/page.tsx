import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreatePlatformDemoForm } from "@/components/demo-environment/CreatePlatformDemoForm";
import { requireDemoStaffSession } from "@/lib/demo-pilotage/access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NouvellePlatformDemoPage() {
  const session = await requireDemoStaffSession();
  if ((session.user as { isDemo?: boolean }).isDemo) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/demonstrations/plateformes">Plateformes démo</BackLink>
      <PageHeader
        eyebrow="Espace commercial"
        title="Créer une démonstration"
        description="Configurez l’identité, le template, les modules et la durée d’accès. Les données injectées sont fictives."
        actions={
          <Link href="/dashboard/demonstrations/plateformes" className="btn-cc-secondary">
            Liste
          </Link>
        }
      />
      <CreatePlatformDemoForm />
    </div>
  );
}
