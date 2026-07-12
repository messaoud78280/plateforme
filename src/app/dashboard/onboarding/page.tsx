import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/onboarding");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Espace client"
        title="Bienvenue sur BeWork"
        description="Votre assistant travaux est prêt. Commencez par votre première demande pour cadrer le besoin chantier."
      />
      <Card hover={false} className="text-center">
        <p className="text-sm text-bework-muted">
          Déposez une mission claire : objet, échéance, pièces jointes. BeWork vous aide à sécuriser le suivi.
        </p>
        <Link href="/dashboard/nouvelle-demande" className="btn-cc-primary mt-6 inline-flex">
          Créer ma première demande
        </Link>
        <p className="mt-4 text-sm text-bework-muted">
          <Link href="/dashboard" className="font-semibold text-bework-navy hover:underline">
            Passer et aller au tableau de bord
          </Link>
        </p>
      </Card>
    </div>
  );
}
