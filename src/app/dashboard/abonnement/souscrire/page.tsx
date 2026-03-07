import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPlan, PLAN_KEYS, SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { SouscrireClient } from "./SouscrireClient";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ plan?: string }> };

export default async function SouscrirePage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/connexion?callbackUrl=${encodeURIComponent("/dashboard/abonnement/souscrire")}`);
  }
  if (session.user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const planKeyParam = params.plan ?? "";
  const planKey = PLAN_KEYS.includes(planKeyParam as keyof typeof SUBSCRIPTION_PLANS)
    ? planKeyParam
    : "STANDARD";
  const plan = getPlan(planKey);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink href="/dashboard/abonnement">Retour à l&apos;abonnement</BackLink>
      <h1 className="text-2xl font-bold text-slate-800">Souscription</h1>
      {plan ? (
        <SouscrireClient
          initialPlanKey={planKey}
          planName={plan.name}
          priceLabel={plan.priceLabel}
          billing={plan.billing}
          actionsLabel={plan.actionsLabel}
          actionsIncluded={plan.actionsIncluded}
        />
      ) : (
        <p className="text-slate-600">Formule introuvable.</p>
      )}
    </div>
  );
}
