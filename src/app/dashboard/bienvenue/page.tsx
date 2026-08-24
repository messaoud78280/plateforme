import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizationActivationSnapshot } from "@/lib/organization/activation";
import {
  requireOrganizationContext,
  TenantAccessError,
} from "@/lib/organization/tenant";
import {
  ActivationChecklistCard,
  OnboardingSkipBar,
} from "@/components/saas/ActivationChecklistCard";
import { SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";

export default async function BienvenuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion/clients?callbackUrl=/dashboard/bienvenue");
  }

  let ctx;
  try {
    ctx = await requireOrganizationContext(session.user);
  } catch (e) {
    if (e instanceof TenantAccessError) redirect("/dashboard");
    throw e;
  }

  // Marquer l’étape onboarding démarrée (sans bloquer)
  if (ctx.organization.onboardingStep == null) {
    await prisma.organization
      .update({
        where: { id: ctx.organizationId },
        data: { onboardingStep: 1 },
      })
      .catch(() => undefined);
  }

  const snapshot = await getOrganizationActivationSnapshot(ctx.organizationId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-1 py-4 sm:py-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bework-accent">
          Bienvenue
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-bework-navy sm:text-3xl">
          Votre espace {ctx.organization.name}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          {ctx.effectiveStatus === "TRIAL"
            ? `${SAAS_TRIAL_DAYS} jours pour explorer toute la plateforme — sans carte bancaire. Ce guide est facultatif.`
            : "Explorez librement vos modules. Ce guide reste disponible si vous souhaitez structurer le démarrage."}
        </p>
      </div>

      <ActivationChecklistCard
        percent={snapshot.percent}
        items={snapshot.items}
        companyName={ctx.organization.name}
        maturity="new"
        organizationId={ctx.organizationId}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/dashboard/parametres/coordonnees",
            title: "Entreprise",
            body: "Logo, SIRET, coordonnées",
          },
          {
            href: "/dashboard/equipe",
            title: "Équipe",
            body: "Inviter un collaborateur",
          },
          {
            href: "/dashboard/documents?universe=ouvrages",
            title: "Ouvrages",
            body: "Créer vos premiers prix",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-bework-navy/10 bg-white p-4 shadow-[var(--cc-shadow)] transition hover:-translate-y-px hover:border-bework-accent/30"
          >
            <p className="text-[14px] font-semibold text-bework-navy">{c.title}</p>
            <p className="mt-1 text-[12px] text-slate-500">{c.body}</p>
          </Link>
        ))}
      </div>

      <OnboardingSkipBar />
    </div>
  );
}
