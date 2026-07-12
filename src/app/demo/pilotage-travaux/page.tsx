import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageDemoPilotage } from "@/lib/demo-pilotage/access";
import { DEMO_SCENARIO_LIST, getDemoScenario } from "@/lib/demo-pilotage/scenarios";
import { DemoPilotageShell } from "@/components/demo-pilotage/DemoPilotageShell";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";
import type { Metadata } from "next";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Démonstration Pilotage travaux | BeWork",
  robots: SEO_NOINDEX_ROBOTS,
};

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function first(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function DemoPilotageStaffPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await getServerSession(authOptions);
  const sp = await searchParams;
  const scenarioId = first(sp, "scenario") ?? "go-logements-public";

  if (!session?.user?.id || !canManageDemoPilotage(session.user.role)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-10">
        <Alert tone="watch">
          Démonstration BeWork — Données fictives. Accès réservé aux équipes BeWork ou via un lien prospect sécurisé.
        </Alert>
        <PageHeader
          eyebrow="Espace prospect"
          title="Pilotage travaux — démonstration"
          description="Demandez une démonstration personnalisée. Aucune donnée réelle de chantier n’est exposée sur cet espace."
        />
        <Card hover={false}>
          <ProspectContactForm source="demo_pilotage_travaux_landing" />
        </Card>
        <p className="text-xs text-bework-muted">
          Commercial BeWork ?{" "}
          <Link
            href="/connexion?callbackUrl=/demo/pilotage-travaux"
            className="font-semibold text-bework-navy hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    );
  }

  const scenario = getDemoScenario(scenarioId);

  return (
    <div className="space-y-4">
      <div className="cc-card flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-bework-muted">
            Mode rendez-vous · {session.user.name}
          </p>
          <Link
            href="/dashboard/demonstrations"
            className="text-sm font-semibold text-bework-navy hover:underline"
          >
            Administration des liens prospect
          </Link>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-bework-muted">
            Scénario
            <select
              name="scenario"
              defaultValue={scenario.id}
              className="ml-2 rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] px-2 py-1.5 text-sm font-normal text-bework-ink"
            >
              {DEMO_SCENARIO_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-cc-primary !px-3 !py-1.5 text-xs">
            Changer
          </button>
        </form>
      </div>
      <DemoPilotageShell scenario={scenario} mode="staff" showTipsDefault />
    </div>
  );
}
