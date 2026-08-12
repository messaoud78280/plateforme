"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AccueilOpsSummary } from "@/lib/accueil/load-accueil-ops";
import { MessagesHomeBanner } from "@/components/dashboard/MessagesHomeBanner";
import { FacturationHomeBanner } from "@/components/dashboard/FacturationHomeBanner";
import { cn } from "@/lib/cn";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function urgencyTone(u: string) {
  if (u === "CRITIQUE") return "border-l-red-600 bg-red-50/40";
  if (u === "URGENT") return "border-l-red-500 bg-red-50/25";
  if (u === "IMPORTANT") return "border-l-amber-500 bg-amber-50/30";
  return "border-l-slate-300 bg-slate-50/40";
}

function urgencyLabel(u: string) {
  if (u === "CRITIQUE" || u === "URGENT" || u === "IMPORTANT") return u;
  return null;
}

function agendaIcon(type: string) {
  if (type === "LIVRAISON") return "🚚";
  if (type === "INTERVENTION") return "🔧";
  if (type.includes("REUNION") || type === "REUNION_CHANTIER") return "👥";
  return "·";
}

function SideSection({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number | string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-200/80 pb-4 last:border-b-0 last:pb-0">
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
      <div className="mt-2.5">{children}</div>
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
    { label: "Créer un événement", href: links.nouvelEvenement },
    { label: "Créer une commande", href: links.nouvelleCommande },
    { label: "Ajouter un document", href: links.nouveauDocument },
    { label: "Créer une fiche", href: links.nouvelleFiche },
    { label: "Nouveau message", href: links.messagerie },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-10 items-center rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#16304f]"
      >
        + Action
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1.5 min-w-[210px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className="block px-3.5 py-2.5 text-sm text-slate-800 hover:bg-slate-50"
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
  const scopeHint =
    ops.canSwitchScope && ops.scope === "team"
      ? "Vue Équipe"
      : ops.canSwitchScope && ops.scope === "mine"
        ? "Vue Moi"
        : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1e3a5f] sm:text-[1.75rem]">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)] lg:gap-8 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.85fr)]">
        {/* Colonne principale */}
        <div className="space-y-6">
          {/* 1 — À TRAITER (héros) */}
          <section
            data-demo-target="accueil-a-traiter"
            className="rounded-2xl border border-[#1e3a5f]/15 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]">
                À traiter
                <span className="ml-2.5 tabular-nums text-slate-900">{ops.attentionTotal}</span>
                {scopeHint ? (
                  <span className="ml-2 text-[10px] font-semibold normal-case tracking-normal text-slate-400">
                    · {scopeHint}
                  </span>
                ) : null}
              </h2>
              <Link
                href={ops.links.aTraiter}
                className="text-xs font-semibold text-[#1d4ed8] hover:underline"
              >
                Voir tout →
              </Link>
            </div>

            {ops.attention.length === 0 ? (
              <p className="mt-4 text-sm font-medium text-emerald-800">
                ✓ Rien d’urgent à traiter.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {ops.attention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-start justify-between gap-3 rounded-xl border-l-[3px] px-3 py-2.5 transition hover:bg-white",
                        urgencyTone(item.urgency),
                      )}
                    >
                      <span className="min-w-0">
                        {urgencyLabel(item.urgency) ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {urgencyLabel(item.urgency)}
                          </span>
                        ) : null}
                        <span className="block text-sm font-bold text-slate-950">
                          {item.title}
                        </span>
                        {item.projectTitle ? (
                          <span className="mt-0.5 block text-xs font-medium text-slate-600">
                            {item.projectTitle}
                          </span>
                        ) : null}
                        <span className="mt-0.5 block text-xs text-slate-500">{item.reason}</span>
                      </span>
                      <span className="shrink-0 self-center text-xs font-bold text-[#1d4ed8]">
                        Voir
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {ops.attentionCapped ? (
              <p className="mt-2 text-[11px] text-slate-400">
                Aperçu Accueil — le board À traiter peut en contenir davantage.
              </p>
            ) : null}
          </section>

          {/* 1b — MESSAGES (réflexe principal, sans écraser À traiter) */}
          <MessagesHomeBanner variant="card" />

          {/* 1c — FACTURATION anti-oubli (masqué si rien) */}
          <FacturationHomeBanner />

          {/* 1d — Rentabilité chantiers (PILOTAGE-1) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]">
                Rentabilité chantiers
              </h2>
              <Link
                href="/dashboard/rentabilite"
                className="text-xs font-semibold text-[#1d4ed8] hover:underline"
              >
                Voir la rentabilité →
              </Link>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Marge prévue vs estimée, engagé, facturé et encaissé — sans IA.
            </p>
          </section>

          {/* 2 — AUJOURD’HUI */}
          <section data-demo-target="accueil-aujourdhui">
            <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]">
                {ops.agendaTitle}
              </h2>
              <Link
                href={ops.links.agenda}
                className="text-xs font-semibold text-[#1d4ed8] hover:underline"
              >
                Voir Agenda
              </Link>
            </div>
            {ops.agenda.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Aucun événement proche.</p>
            ) : (
              <ul className="mt-3 space-y-0">
                {ops.agenda.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex gap-3 border-b border-slate-100 py-2.5 last:border-b-0"
                  >
                    <span className="w-12 shrink-0 pt-0.5 text-sm font-bold tabular-nums text-slate-800">
                      {ops.agendaTitle === "Prochainement"
                        ? new Date(ev.startAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })
                        : fmtTime(ev.startAt)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mr-1.5 text-sm" aria-hidden>
                        {agendaIcon(ev.type)}
                      </span>
                      <Link
                        href={`/dashboard/agenda?event=${ev.id}`}
                        className="text-sm font-bold text-slate-950 hover:underline"
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
          </section>

          {/* 3 — CHANTIERS */}
          {ops.chantiers.length > 0 ? (
            <section data-demo-target="accueil-chantiers">
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Chantiers à surveiller
                </h2>
                <Link
                  href={ops.links.projets}
                  className="text-xs font-semibold text-[#1d4ed8] hover:underline"
                >
                  Voir chantiers
                </Link>
              </div>
              <ul className="mt-3 space-y-3">
                {ops.chantiers.map((c) => {
                  const signals = [
                    c.attentionCount > 0 ? `${c.attentionCount} À traiter` : null,
                    c.criticalCount > 0
                      ? `${c.criticalCount} critique${c.criticalCount > 1 ? "s" : ""}`
                      : null,
                    c.urgentCount > 0
                      ? `${c.urgentCount} urgent${c.urgentCount > 1 ? "s" : ""}`
                      : null,
                    c.overdueTasks > 0
                      ? `${c.overdueTasks} tâche${c.overdueTasks > 1 ? "s" : ""} en retard`
                      : null,
                    c.nextDeliveryLabel,
                    c.nextEventLabel && !c.nextDeliveryLabel ? c.nextEventLabel : null,
                  ].filter(Boolean);
                  return (
                    <li
                      key={c.id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-900">
                          {c.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {signals.join(" · ")}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/projets/${c.id}`}
                        className="shrink-0 text-xs font-bold text-[#1d4ed8] hover:underline"
                      >
                        Ouvrir le chantier
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {ops.teamToday.length > 0 ? (
            <section className="hidden lg:block">
              <h2 className="border-b border-slate-200 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Équipe aujourd’hui
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {ops.teamToday.map((t) => (
                  <li key={t.id}>
                    <span className="font-semibold text-slate-800">{t.name}</span>
                    {t.projectTitle ? (
                      <span className="text-slate-500"> — {t.projectTitle}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Colonne secondaire */}
        <aside className="space-y-0 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 lg:sticky lg:top-4 lg:self-start">
          {ops.orders.length > 0 ? (
            <SideSection
              title="Commandes & livraisons"
              action={{ href: ops.links.commandes, label: "Voir" }}
            >
              <ul className="space-y-2">
                {ops.orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={o.href}
                      className="block rounded-lg px-2 py-1.5 hover:bg-slate-50"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {o.supplierName}
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
                      <p className="text-xs text-slate-500">
                        {[o.number, o.projectTitle].filter(Boolean).join(" · ")}
                      </p>
                      {o.deliveryLabel ? (
                        <p className="mt-0.5 text-xs font-medium text-slate-700">
                          {o.deliveryLabel}
                        </p>
                      ) : null}
                      {o.receiptLabel ? (
                        <p className="mt-0.5 text-xs font-semibold text-slate-700">
                          {o.receiptLabel}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </SideSection>
          ) : null}

          <SideSection
            title="Mes tâches"
            action={{ href: ops.links.taches, label: "Voir" }}
          >
            {ops.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune tâche prioritaire.</p>
            ) : (
              <ul className="space-y-2">
                {ops.tasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/taches/${t.id}`}
                      className="block rounded-lg px-2 py-1.5 hover:bg-slate-50"
                    >
                      <span className="text-sm font-semibold text-slate-900">{t.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {[t.projectTitle, t.dueLabel].filter(Boolean).join(" · ")}
                        {t.overdue ? (
                          <span className="ml-1.5 font-semibold text-red-700">Retard</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SideSection>
        </aside>
      </div>
    </div>
  );
}
