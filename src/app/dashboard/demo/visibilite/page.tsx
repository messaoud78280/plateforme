import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DEMO_PERSONA_KEYS,
  DEMO_PERSONAS,
  personaRightsSummary,
  type DemoPersonaKey,
} from "@/lib/demo-environment/personas";
import { DemoPreviewSpaceButtons } from "@/components/demo-environment/DemoPreviewSpaceButtons";

export const dynamic = "force-dynamic";

export default async function DemoVisibilitePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/demo/visibilite");
  if (!session.user.isDemo) redirect("/dashboard");

  const company = session.user.demoCompanyName ?? "ABC Étanchéité";

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Démonstration"
        title="Qui voit quoi ?"
        description={`Droits par persona sur l’environnement ${company}. Une seule plateforme — quatre regards distincts.`}
      />

      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">
          Prévisualiser un espace
        </h2>
        <p className="mt-1 text-sm text-amber-950/80">
          Basculez temporairement vers le profil d’un intervenant (session démo uniquement).
        </p>
        <div className="mt-4">
          <DemoPreviewSpaceButtons />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {DEMO_PERSONA_KEYS.map((key) => (
          <PersonaRightsCard key={key} personaKey={key} />
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Scénario collab (Victor Hugo)
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>· Client (Sophie) : voit uniquement les chantiers partagés — pas le fil interne.</li>
          <li>· Fournisseur (Thomas / Point.P) : confirme BC-2026-043 — Direction est alertée.</li>
          <li>· Conducteur (Karim) : actions terrain sur chantiers affectés.</li>
          <li>· Direction (Marc) : vision globale, avenants, à facturer, équipe.</li>
        </ul>
        <Link
          href="/dashboard/commandes"
          className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline"
        >
          Voir les bons de commande →
        </Link>
      </section>
    </div>
  );
}

function PersonaRightsCard({ personaKey }: { personaKey: DemoPersonaKey }) {
  const def = DEMO_PERSONAS[personaKey];
  const sections = personaRightsSummary(personaKey);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">{def.label}</p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">{def.name}</h3>
      <p className="text-sm text-slate-500">
        {def.jobTitle} · {def.company}
      </p>
      {sections.map((sec) => (
        <div key={sec.section} className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{sec.section}</p>
          <ul className="mt-2 space-y-1.5">
            {sec.items.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm">
                <span className={item.allowed ? "text-emerald-600" : "text-slate-400"} aria-hidden>
                  {item.allowed ? "✓" : "✗"}
                </span>
                <span className={item.allowed ? "text-slate-800" : "text-slate-500 line-through"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  );
}
