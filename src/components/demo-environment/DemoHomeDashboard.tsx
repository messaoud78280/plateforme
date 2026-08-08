import Link from "next/link";
import { cn } from "@/lib/cn";
import type {
  DemoHomeAgendaItem,
  DemoHomeItem,
  DemoHomeProject,
  DemoHomeStats,
} from "@/lib/demo-environment/dashboard-stats";

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

const agendaTypeLabel: Record<string, string> = {
  LIVRAISON: "Livraison",
  INTERVENTION: "Intervention",
  RDV_CLIENT: "Rendez-vous",
  REUNION: "Réunion",
  ECHEANCE: "Échéance",
  COMMANDE: "Commande",
  FACTURATION: "Facturation",
};

function CountPill({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: "critical" | "urgent" | "important";
}) {
  const styles =
    tone === "critical"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "urgent"
        ? "border-orange-200 bg-orange-50 text-orange-900"
        : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <div className={cn("rounded-2xl border px-4 py-3", styles)}>
      <p className="text-3xl font-extrabold tabular-nums tracking-tight">{count}</p>
      <p className="mt-0.5 text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

export function DemoHomeDashboard({
  companyName,
  firstName,
  stats,
  inbox,
  projects,
  agendaToday,
}: {
  companyName: string;
  firstName: string;
  stats: DemoHomeStats;
  inbox: DemoHomeItem[];
  projects: DemoHomeProject[];
  agendaToday: DemoHomeAgendaItem[];
  modules?: string[];
}) {
  const critique = stats.attentionCritique ?? 0;
  const urgent = stats.attentionUrgent ?? 0;
  const important = stats.attentionImportant ?? 0;
  const hot = critique + urgent + important;

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-bework-muted">{companyName}</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-bework-ink md:text-3xl">
          Bonjour {firstName}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-slate-600">
          BeWork vous dit ce qui se passe — et surtout ce qui risque d’être oublié.
        </p>
      </header>

      {/* Zone principale : attention */}
      <section
        aria-labelledby="demo-attention"
        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="demo-attention"
                className="text-sm font-bold uppercase tracking-[0.12em] text-[#1e3a5f]"
              >
                Ce qui mérite mon attention
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {hot > 0
                  ? "Dossiers détectés par BeWork — à traiter avant qu’ils ne bloquent le chantier."
                  : "Rien d’urgent pour le moment."}
              </p>
            </div>
            <Link
              href="/dashboard/a-traiter"
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#152a45]"
            >
              Ouvrir À traiter →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <CountPill count={critique} label="Critique" tone="critical" />
            <CountPill count={urgent} label="Urgents" tone="urgent" />
            <CountPill count={important} label="Importants" tone="important" />
          </div>
        </div>

        <ul className="divide-y divide-slate-100">
          {inbox.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-slate-500">
              Aucune alerte active. Les dossiers avancent normalement.
            </li>
          ) : (
            inbox.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-slate-50/90"
                >
                  <span
                    className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", toneDot[item.tone])}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                    {item.subtitle ? (
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <Link
            href="/dashboard/fiches-suivi?view=tableau"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1e3a5f] hover:border-[#1d4ed8]"
          >
            Tableau de suivi
          </Link>
          <Link
            href="/dashboard/agenda"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
          >
            Agenda
          </Link>
          <Link
            href="/dashboard/messagerie"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
          >
            Messages
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="demo-today">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="demo-today" className="text-sm font-bold uppercase tracking-[0.12em] text-bework-muted">
              Aujourd’hui
            </h2>
            <Link href="/dashboard/agenda" className="text-xs font-semibold text-[#1d4ed8] hover:underline">
              Agenda →
            </Link>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            {agendaToday.length === 0 ? (
              <li className="px-5 py-6 text-sm text-slate-500">
                Aucune intervention, livraison ou rendez-vous aujourd’hui.
              </li>
            ) : (
              agendaToday.map((ev) => (
                <li key={ev.id} className="border-b border-slate-50 last:border-0">
                  <Link
                    href={ev.href}
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50/80"
                  >
                    <span className="w-14 shrink-0 text-sm font-bold tabular-nums text-[#1d4ed8]">
                      {ev.startAt.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {agendaTypeLabel[ev.type] ?? ev.type}
                      </span>
                      <span className="block text-sm font-semibold text-slate-900">{ev.title}</span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="lg:col-span-2" aria-labelledby="demo-projects">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2
              id="demo-projects"
              className="text-sm font-bold uppercase tracking-[0.12em] text-bework-muted"
            >
              Chantiers
            </h2>
            <Link href="/dashboard/projets" className="text-xs font-semibold text-[#1d4ed8] hover:underline">
              Voir tout
            </Link>
          </div>
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/projets/${p.id}`}
                  className="block rounded-xl border border-slate-200/90 bg-white px-3.5 py-3 transition hover:border-slate-300 hover:bg-slate-50/50"
                >
                  <span className="block text-sm font-semibold text-slate-900">{p.title}</span>
                  <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
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

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/fiches-suivi?filter=a-facturer"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center transition hover:border-slate-300"
            >
              <p className="text-lg font-extrabold tabular-nums text-slate-900">
                {stats.followUpToInvoice}
              </p>
              <p className="text-[10px] font-semibold uppercase text-slate-500">À facturer</p>
            </Link>
            <Link
              href="/dashboard/fiches-suivi?filter=avenant"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center transition hover:border-slate-300"
            >
              <p className="text-lg font-extrabold tabular-nums text-slate-900">
                {stats.followUpAvenant}
              </p>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Avenants</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
