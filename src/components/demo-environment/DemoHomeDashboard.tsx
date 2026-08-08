import Link from "next/link";
import { cn } from "@/lib/cn";
import type { DemoHomeItem, DemoHomeProject, DemoHomeStats } from "@/lib/demo-environment/dashboard-stats";

const toneDot: Record<DemoHomeItem["tone"], string> = {
  critical: "bg-red-500",
  watch: "bg-amber-500",
  ok: "bg-emerald-500",
  info: "bg-sky-500",
};

const statusLabel: Record<string, string> = {
  ETUDE: "Étude",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  RECEPTION: "Réception",
  TERMINE: "Terminé",
};

function StatCard({
  value,
  label,
  href,
  emphasize,
}: {
  value: number;
  label: string;
  href: string;
  emphasize?: "critical" | "watch" | "neutral";
}) {
  const ring =
    emphasize === "critical"
      ? "border-red-200 bg-red-50/70"
      : emphasize === "watch"
        ? "border-amber-200 bg-amber-50/60"
        : "border-slate-200/90 bg-white";

  return (
    <Link
      href={href}
      className={cn(
        "group rounded-2xl border p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm",
        ring,
      )}
    >
      <p className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium leading-snug text-slate-600 group-hover:text-slate-800">{label}</p>
    </Link>
  );
}

export function DemoHomeDashboard({
  companyName,
  firstName,
  stats,
  inbox,
  projects,
  modules,
}: {
  companyName: string;
  firstName: string;
  stats: DemoHomeStats;
  inbox: DemoHomeItem[];
  projects: DemoHomeProject[];
  modules: string[];
}) {
  const showOrders = modules.includes("commandes") || modules.length === 0;
  const showDocs = modules.includes("documents") || modules.length === 0;
  const showProjects = modules.includes("chantiers") || modules.length === 0;

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-bework-muted">{companyName}</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-bework-ink md:text-3xl">
          Bonjour {firstName}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Voici ce qui demande votre attention aujourd’hui. Ce qui était dispersé entre emails, Excel et post-it
          devient une information attribuée et suivie.
        </p>
      </header>

      <section aria-labelledby="demo-today">
        <h2 id="demo-today" className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-bework-muted">
          Aujourd’hui
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            value={stats.followUpUrgent ?? stats.urgentActions}
            label="Urgences"
            href="/dashboard/fiches-suivi?filter=urgent"
            emphasize={(stats.followUpUrgent ?? stats.urgentActions) > 0 ? "critical" : "neutral"}
          />
          <StatCard
            value={stats.followUpToday ?? 0}
            label="Actions à réaliser aujourd’hui"
            href="/dashboard/fiches-suivi?filter=today"
            emphasize={(stats.followUpToday ?? 0) > 0 ? "watch" : "neutral"}
          />
          <StatCard
            value={stats.followUpWeek ?? stats.deadlinesThisWeek}
            label="Actions cette semaine"
            href="/dashboard/fiches-suivi"
            emphasize={(stats.followUpWeek ?? 0) > 0 ? "watch" : "neutral"}
          />
          <StatCard
            value={stats.followUpUnprepared ?? 0}
            label="Interventions non préparées"
            href="/dashboard/fiches-suivi?filter=non-preparees"
            emphasize={(stats.followUpUnprepared ?? 0) > 0 ? "critical" : "neutral"}
          />
          <StatCard
            value={stats.followUpToInvoice ?? 0}
            label="Dossiers à facturer"
            href="/dashboard/fiches-suivi?filter=a-facturer"
          />
          <StatCard
            value={stats.followUpAvenant ?? 0}
            label="Avenants sans réponse"
            href="/dashboard/fiches-suivi?filter=avenant"
            emphasize={(stats.followUpAvenant ?? 0) > 0 ? "watch" : "neutral"}
          />
          {showOrders ? (
            <StatCard
              value={stats.lateDeliveries}
              label="Commande en retard"
              href="/dashboard/taches"
              emphasize={stats.lateDeliveries > 0 ? "critical" : "neutral"}
            />
          ) : null}
          {showOrders ? (
            <StatCard
              value={stats.ordersToValidate}
              label="Bons de commande à valider"
              href="/dashboard/taches"
              emphasize={stats.ordersToValidate > 0 ? "watch" : "neutral"}
            />
          ) : null}
          {showDocs ? (
            <StatCard
              value={stats.missingDocuments}
              label="Documents manquants"
              href="/dashboard/documents"
              emphasize={stats.missingDocuments > 0 ? "watch" : "neutral"}
            />
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="demo-inbox">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="demo-inbox" className="text-sm font-bold uppercase tracking-[0.12em] text-bework-muted">
              À traiter
            </h2>
            <Link href="/dashboard/a-traiter" className="text-xs font-semibold text-[#1d4ed8] hover:underline">
              Tout voir
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            {inbox.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-slate-600">
                Aucune urgence pour le moment. Tout est à jour.
              </li>
            ) : (
              inbox.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50/80"
                  >
                    <span
                      className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", toneDot[item.tone])}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                      {item.subtitle ? (
                        <span className="mt-0.5 block text-xs text-slate-500">{item.subtitle}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        {showProjects ? (
          <section className="lg:col-span-2" aria-labelledby="demo-projects">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 id="demo-projects" className="text-sm font-bold uppercase tracking-[0.12em] text-bework-muted">
                Mes chantiers
              </h2>
              <Link href="/dashboard/projets" className="text-xs font-semibold text-[#1d4ed8] hover:underline">
                Voir tout
              </Link>
            </div>
            <ul className="space-y-2.5">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/projets/${p.id}`}
                    className="block rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50/50"
                  >
                    <span className="block text-sm font-semibold text-slate-900">{p.title}</span>
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      {p.city ? <span>{p.city}</span> : null}
                      {p.manager ? <span>{p.manager}</span> : null}
                      <span className="font-medium text-slate-700">
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {(modules.includes("ia") || modules.length === 0) && (
        <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 px-5 py-4">
          <h2 className="text-sm font-bold text-bework-ink">Assistant BeWork</h2>
          <p className="mt-1 text-sm text-slate-600">
            Posez une question métier à partir des données de votre plateforme (à valider avant action).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Qu’est-ce qui est urgent aujourd’hui ?",
              "Quels bons de commande attendent une validation ?",
              "Quelles tâches sont en retard ?",
            ].map((q) => (
              <Link
                key={q}
                href={`/dashboard/skills?q=${encodeURIComponent(q)}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {q}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
