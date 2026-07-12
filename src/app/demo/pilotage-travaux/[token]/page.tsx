import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { DemoPilotageShell } from "@/components/demo-pilotage/DemoPilotageShell";
import { DemoAccessCodeForm } from "@/components/demo-pilotage/DemoAccessCodeForm";
import { resolveDemoLinkAccess } from "@/lib/demo-pilotage/access";
import { getDemoScenario } from "@/lib/demo-pilotage/scenarios";
import type { DemoPersonalization } from "@/lib/demo-pilotage/types";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Démonstration Pilotage travaux | BeWork",
  robots: SEO_NOINDEX_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function DemoPilotageTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 20 || token.length > 128) {
    return <DemoDenied reason="Lien invalide." />;
  }

  const access = await resolveDemoLinkAccess(token);
  if (!access.ok) {
    const messages = {
      not_found: "Ce lien de démonstration n’existe pas.",
      revoked: "Ce lien a été révoqué.",
      expired: "Ce lien a expiré.",
      max_views: "Le nombre maximal de consultations a été atteint.",
    };
    return <DemoDenied reason={messages[access.reason]} />;
  }

  const link = access.link;
  if (link.accessCodeHash) {
    const jar = await cookies();
    const unlocked = jar.get(`demo_pilotage_${token}`)?.value === "1";
    if (!unlocked) {
      return <DemoAccessCodeForm token={token} />;
    }
  }

  const scenario = getDemoScenario(link.scenarioId);
  const personalization = (link.personalization ?? {}) as DemoPersonalization;

  return (
    <DemoPilotageShell
      scenario={scenario}
      personalization={personalization}
      mode="prospect"
      token={token}
      showTipsDefault
    />
  );
}

function DemoDenied({ reason }: { reason: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16">
      <Alert tone="watch">Démonstration BeWork — Données fictives</Alert>
      <Card hover={false} className="text-center">
        <CardHeader title="Accès indisponible" description={reason} />
        <p className="text-xs text-bework-muted">Contactez votre interlocuteur BeWork pour un nouveau lien.</p>
        <Link href="/contact" className="btn-cc-primary mt-4 inline-flex">
          Contacter BeWork
        </Link>
      </Card>
    </div>
  );
}
