"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AccueilOpsSummary } from "@/lib/accueil/load-accueil-ops";
import { MessagesHomeBanner } from "@/components/dashboard/MessagesHomeBanner";
import { cn } from "@/lib/cn";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDayTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function urgencyDot(u: string) {
  if (u === "CRITIQUE") return "bg-red-600";
  if (u === "URGENT") return "bg-red-500";
  if (u === "IMPORTANT") return "bg-amber-500";
  return "bg-slate-400";
}

function agendaIcon(type: string) {
  if (type === "LIVRAISON") return "🚚";
  if (type === "INTERVENTION") return "🔧";
  if (type.includes("REUNION") || type === "REUNION_CHANTIER") return "👥";
  return "📅";
}

function Section({
  title,
  count,
  action,
  children,
  className,
}: {
  title: string;
  count?: number | string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200/90 bg-white p-4", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {title}
          {count != null ? (
            <span className="ml-2 tabular-nums text-slate-900">{count}</span>
          ) : null}
        </h2>
        {action ? (
          <Link
            href={action.href}
            className="shrink-0 text-xs font-semibold text-[#1d4ed8] hover:underline"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function QuickActionMenu({ links }: { links: AccueilOpsSummary["links"] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const items = [
    { label: "Créer une tâche", href: links.nouvelleTache },
    { label: "Agenda", href: links.nouvelEvenement },
    { label: "Fiche de suivi", href: links.nouvelleFiche },
    { label: "Commande", href: links.nouvelleCommande },
    { label: "Nouveau message", href: links.messagerie },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white hover:bg-[#16304f]"
      >
        + Action
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1.5 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className="block px-3.5 py-2 text-sm text-slate-800 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              {it.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AccueilOpsHome({
  ops,
  scopeHrefBase = "/dashboard",
}: {
  ops: AccueilOpsSummary;
  scopeHrefBase?: string;
}) {
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Bonjour {ops.firstName}
          </h1>
          <p className="mt-1 text-sm capitalize text-slate-500">{ops.dateLabel}</p>
          <p className="mt-1 text-sm text-slate-600">
            Voici ce qui mérite votre attention aujourd’hui.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ops.canSwitchScope ? (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              <Link
                href={`${scopeHrefBase}?vue=moi`}
                className={cn(
                  "rounded-md px-2.5 py-1.5",
                  ops.scope === "mine"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                Moi
              </Link>
              <Link
                href={`${scopeHrefBase}?vue=equipe`}
                className={cn(
                  "rounded-md px-2.5 py-1.5",
                  ops.scope === "team"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                Équipe
              </Link>
            </div>
          ) : null}
          <QuickActionMenu links={ops.links} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Colonne principale */}
        <div className="space-y-4">
          <Section
            title="À traiter"
            count={ops.attentionTotal}
            action={{ href: ops.links.aTraiter, label: "Voir tout" }}
          >
            {ops.attention.length === 0 ? (
              <p className="text-sm font-medium text-emerald-800">
                ✓ Rien d’urgent à traiter.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {ops.attention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 py-2.5 hover:bg-slate-50/80"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          urgencyDot(item.urgency),
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {item.reason}
                        </span>
                        {item.projectTitle ? (
                          <span className="mt-0.5 block text-[11px] text-slate-400">
                            {item.projectTitle}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {ops.attentionCapped ? (
              <p className="mt-2 text-[11px] text-slate-400">
                Aperçu limité — le board complet peut en contenir davantage.
              </p>
            ) : null}
          </Section>

          <Section
            title={ops.agendaTitle}
            action={{ href: ops.links.agenda, label: "Voir Agenda" }}
          >
            {ops.agenda.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun événement proche.</p>
            ) : (
              <ul className="space-y-2.5">
                {ops.agenda.map((ev) => (
                  <li key={ev.id} className="flex gap-3 text-sm">
                    <span className="w-12 shrink-0 tabular-nums font-semibold text-slate-700">
                      {fmtTime(ev.startAt)}
                    </span>
                    <span className="min-w-0">
                      <span className="mr-1" aria-hidden>
                        {agendaIcon(ev.type)}
                      </span>
                      <Link
                        href={`/dashboard/agenda?event=${ev.id}`}
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        {ev.title}
                      </Link>
                      {ev.projectTitle ? (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {ev.projectTitle}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {ops.chantiers.length > 0 ? (
            <Section
              title="Chantiers à surveiller"
              action={{ href: ops.links.projets, label: "Voir chantiers" }}
            >
              <ul className="space-y-3">
                {ops.chantiers.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link
                        href={`/dashboard/projets/${c.id}`}
                        className="text-sm font-bold text-slate-900 hover:underline"
                      >
                        {c.title}
                      </Link>
                      <Link
                        href={`/dashboard/projets/${c.id}`}
                        className="text-xs font-semibold text-[#1d4ed8] hover:underline"
                      >
                        Ouvrir
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {[
                        c.attentionCount > 0
                          ? `${c.attentionCount} À traiter`
                          : null,
                        c.criticalCount > 0
                          ? `${c.criticalCount} critique${c.criticalCount > 1 ? "s" : ""}`
                          : null,
                        c.overdueTasks > 0
                          ? `${c.overdueTasks} tâche${c.overdueTasks > 1 ? "s" : ""} en retard`
                          : null,
                        c.nextEventLabel,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {ops.teamToday.length > 0 ? (
            <Section title="Équipe aujourd’hui" className="hidden lg:block">
              <ul className="space-y-1.5 text-sm">
                {ops.teamToday.map((t) => (
                  <li key={t.id}>
                    <span className="font-semibold text-slate-900">{t.name}</span>
                    {t.projectTitle ? (
                      <span className="text-slate-500"> — {t.projectTitle}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        {/* Colonne secondaire */}
        <div className="space-y-4">
          <MessagesHomeBanner />

          {ops.orders.length > 0 ? (
            <Section
              title="Commandes & livraisons"
              action={{ href: ops.links.commandes, label: "Voir Commandes" }}
            >
              <ul className="space-y-2.5">
                {ops.orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/dashboard/commandes/${o.id}`}
                      className="block rounded-lg border border-slate-100 px-3 py-2 hover:border-[#1e3a5f]/25"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {o.supplierName} — {o.number}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase",
                            o.hasIssue ? "text-amber-700" : "text-slate-500",
                          )}
                        >
                          {o.statusLabel}
                        </span>
                      </div>
                      {o.projectTitle ? (
                        <p className="mt-0.5 text-xs text-slate-500">{o.projectTitle}</p>
                      ) : null}
                      {o.deliveryAt ? (
                        <p className="mt-0.5 text-xs text-slate-600">
                          {fmtDayTime(o.deliveryAt)}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section
            title="Mes tâches"
            action={{ href: ops.links.taches, label: "Voir toutes" }}
          >
            {ops.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune tâche prioritaire.</p>
            ) : (
              <ul className="space-y-2">
                {ops.tasks.map((t) => (
                  <li key={t.id}>
                    <Link href={`/dashboard/taches/${t.id}`} className="block text-sm">
                      <span className="font-semibold text-slate-900">{t.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {[t.projectTitle, t.assigneeName, t.dueLabel]
                          .filter(Boolean)
                          .join(" · ")}
                        {t.overdue ? (
                          <span className="ml-1.5 font-semibold text-red-700">Retard</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
