import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageDemoPilotage } from "@/lib/demo-pilotage/access";
import { DEMO_SCENARIO_LIST, getDemoScenario } from "@/lib/demo-pilotage/scenarios";
import { DemoPilotageShell } from "@/components/demo-pilotage/DemoPilotageShell";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";
import type { Metadata } from "next";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";

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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          Démonstration BeWork — Données fictives. Accès réservé aux équipes BeWork ou via un lien prospect sécurisé.
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Pilotage travaux — démonstration commerciale</h1>
        <p className="text-sm text-slate-600">
          Pour découvrir BeWork, demandez une démonstration personnalisée. Aucune donnée réelle de chantier n’est
          exposée sur cet espace.
        </p>
        <ProspectContactForm source="demo_pilotage_travaux_landing" />
        <p className="text-xs text-slate-500">
          Commercial BeWork ?{" "}
          <Link href="/connexion?callbackUrl=/demo/pilotage-travaux" className="font-semibold text-[#1e3a5f]">
            Se connecter
          </Link>
        </p>
      </div>
    );
  }

  const scenario = getDemoScenario(scenarioId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Mode rendez-vous · {session.user.name}</p>
          <Link href="/dashboard/demonstrations" className="text-sm font-semibold text-[#1e3a5f] hover:underline">
            Administration des liens prospect
          </Link>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">
            Scénario
            <select
              name="scenario"
              defaultValue={scenario.id}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal"
            >
              {DEMO_SCENARIO_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white">
            Changer
          </button>
        </form>
      </div>
      <DemoPilotageShell scenario={scenario} mode="staff" showTipsDefault />
    </div>
  );
}
