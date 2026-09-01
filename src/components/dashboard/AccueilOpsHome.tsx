"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AccueilOpsSummary } from "@/lib/accueil/load-accueil-ops";
import { MessagesHomeBanner } from "@/components/dashboard/MessagesHomeBanner";
import { FacturationHomeBanner } from "@/components/dashboard/FacturationHomeBanner";
import { canAccessDashboardHref } from "@/lib/equipe-acces/dashboard-policy";
import { cn } from "@/lib/cn";
import {
  DashboardSection,
  TodayRow,
  urgencyMeta,
} from "@/components/dashboard/accueil-ui";
import type { AttentionDisplayCategorySummary } from "@/lib/a-traiter/display-categories";

function agendaIcon(type: string) {
  if (type === "LIVRAISON") return "🚚";
  if (type === "INTERVENTION") return "🔧";
  if (type.includes("REUNION") || type === "REUNION_CHANTIER") return "👥";
  return "·";
}

function formatAgendaWhen(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });
}

function buildHeaderLine(ops: AccueilOpsSummary) {
  const parts: string[] = [];
  if (ops.attentionTotal > 0) {
    parts.push(
      `${ops.attentionTotal} élément${ops.attentionTotal > 1 ? "s" : ""} nécessitent votre attention aujourd’hui`,
    );
  }
  const todayDeliveries = ops.orders.filter((o) =>
    (o.deliveryLabel ?? "").toLowerCase().includes("aujourd"),
  ).length;
  if (todayDeliveries > 0) {
    parts.push(
      `${todayDeliveries} livraison${todayDeliveries > 1 ? "s" : ""} aujourd’hui`,
    );
  }
  if (parts.length > 0) return parts.join(" · ");
  if (!ops.hasProjects) {
    return "Priorité du jour : capturer vos leads, planifier les RDV, préparer les devis.";
  }
  return "Rien d’urgent à traiter aujourd’hui.";
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
    { label: "Nouveau lead", href: "/dashboard/leads" },
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
        className="inline-flex min-h-10 items-center rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-bold text-white transition-colors duration-150 hover:bg-[#16304f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/35"
      >
        + Action
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1.5 min-w-[200px] rounded-xl border border-slate-200/80 bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          {items.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className="block px-3.5 py-2 text-[13px] text-slate-700 transition-colors duration-150 hover:bg-slate-50"
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
  personType,
  permissionProfile,
}: {
  ops: AccueilOpsSummary;
  scopeHrefBase?: string;
  personType?: string | null;
  permissionProfile?: string | null;
}) {
  const showRentabilite = canAccessDashboardHref(
    "/dashboard/rentabilite",
    personType,
    permissionProfile,
  );
  const showFacturation = canAccessDashboardHref(
    "/dashboard/facturation",
    personType,
    permissionProfile,
  );
  const showSiteVisits = canAccessDashboardHref(
    "/dashboard/visites-metres",
    personType,
    permissionProfile,
  );
  const showSuppliers = canAccessDashboardHref(
    "/dashboard/fournisseurs",
    personType,
    permissionProfile,
  );
  const visibleCategories = ops.attentionCategories;
  const todayAgenda =
    ops.agendaTitle === "Aujourd’hui" ? ops.agenda.slice(0, 3) : [];
  const todayOrders = ops.orders.slice(0, 3);
  const todayTasks = ops.tasks.slice(0, 3);
  const upcoming =
    ops.agendaTitle === "Prochainement" ? ops.agenda.slice(0, 3) : [];
  const watchChantiers = ops.chantiers.slice(0, 3);
  const hasToday =
    todayAgenda.length > 0 || todayOrders.length > 0 || todayTasks.length > 0;
  const currentPanelTitle = "En ce moment";
  const dateLabel =
    ops.dateLabel.charAt(0).toUpperCase() + ops.dateLabel.slice(1);
  const seeAllLabel =
    ops.attentionTotal > 0
      ? `Voir les ${ops.attentionTotal} éléments →`
      : "Voir tout →";

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1e3a5f] sm:text-[1.75rem]">
            Bonjour {ops.firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{dateLabel}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">{buildHeaderLine(ops)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ops.canSwitchScope ? (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              <Link
                href={`${scopeHrefBase}?vue=moi`}
                className={cn(
                  "rounded-md px-2.5 py-1.5 transition-colors duration-150",
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
                  "rounded-md px-2.5 py-1.5 transition-colors duration-150",
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

      {!ops.hasProjects ? (
        <section className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/dashboard/leads", title: "Nouveau lead", sub: "Prospect & demande" },
            { href: "/dashboard/agenda?new=1", title: "Planifier un RDV", sub: "Agenda" },
            {
              href: "/dashboard/devis-facturation/devis/nouveau",
              title: "Créer un devis",
              sub: "Devis & facturation",
            },
            { href: "/dashboard/projets", title: "Ouvrir un chantier", sub: "Quand le devis est signé" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 transition hover:border-[#1e3a5f]/20 hover:bg-white"
            >
              <p className="text-[14px] font-bold text-[#1e3a5f]">{a.title}</p>
              <p className="mt-0.5 text-[12px] text-slate-500">{a.sub}</p>
            </Link>
          ))}
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)] lg:items-start xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.85fr)]">
        <div data-demo-target="accueil-a-traiter">
        <DashboardSection
          demoTarget="accueil-a-traiter"
          title="À traiter"
          badge={ops.attentionTotal > 0 ? ops.attentionTotal : null}
          subtitle={
            ops.attentionTotal > 0
              ? "Les domaines qui demandent votre attention"
              : null
          }
          action={{ href: ops.links.aTraiter, label: seeAllLabel }}
        >
          {visibleCategories.length === 0 ? (
            <div className="space-y-1 py-1">
              <p className="text-[14px] leading-snug text-slate-600">
                Vos actions importantes apparaîtront ici : relances, échéances,
                validations et alertes.
              </p>
              <p className="text-[13px] text-slate-500">
                Aucune action pour le moment.
              </p>
            </div>
          ) : (
            <ul
              className={cn(
                "grid gap-2",
                visibleCategories.length >= 4
                  ? "grid-cols-1 sm:grid-cols-2"
                  : visibleCategories.length === 3
                    ? "grid-cols-1 sm:grid-cols-3"
                    : visibleCategories.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1",
              )}
            >
              {visibleCategories.map((cat) => (
                <li key={cat.id}>
                  <AttentionCategoryCard category={cat} />
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
        </div>

        {hasToday ? (
          <aside
            data-demo-target="accueil-aujourdhui"
            className="rounded-2xl bw-surface-tinted-cyan px-5 py-5 shadow-sm lg:sticky lg:top-4 lg:row-span-2"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-bold tracking-tight text-[#1e3a5f]">
                {currentPanelTitle}
              </h2>
              <Link
                href={ops.links.agenda}
                className="text-[13px] font-semibold text-[#1d4ed8] hover:underline"
              >
                Voir Agenda
              </Link>
            </div>

            {todayAgenda.length > 0 ? (
              <div className="mt-3">
                <ul>
                  {todayAgenda.map((ev) => (
                    <li key={ev.id}>
                      <TodayRow
                        href={`/dashboard/agenda?event=${ev.id}`}
                        eyebrow={`${new Date(ev.startAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Paris",
                        })} · ${ev.type === "LIVRAISON" ? "Livraison" : "Agenda"}`}
                        title={ev.title}
                        subtitle={ev.projectTitle}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {todayOrders.length > 0 ? (
              <div className={todayAgenda.length > 0 ? "mt-5" : "mt-3"}>
                <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Livraisons</p>
                <ul className="mt-1">
                  {todayOrders.map((o) => (
                    <li key={o.id}>
                      <TodayRow
                        href={o.href}
                        eyebrow={o.deliveryLabel || o.statusLabel}
                        title={o.supplierName}
                        subtitle={o.projectTitle}
                      />
                    </li>
                  ))}
                </ul>
                <Link
                  href={ops.links.commandes}
                  className="mt-1 inline-block text-[13px] font-semibold text-[#1d4ed8] hover:underline"
                >
                  Voir les commandes
                </Link>
              </div>
            ) : null}

            {todayTasks.length > 0 ? (
              <div className={todayOrders.length > 0 || todayAgenda.length > 0 ? "mt-5" : "mt-3"}>
                <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Tâches</p>
                <ul className="mt-1">
                  {todayTasks.map((t) => (
                    <li key={t.id}>
                      <TodayRow
                        href={`/dashboard/taches/${t.id}`}
                        eyebrow={t.overdue ? "En retard" : t.dueLabel || "À faire"}
                        title={t.title}
                        subtitle={t.projectTitle}
                      />
                    </li>
                  ))}
                </ul>
                <Link
                  href={ops.links.taches}
                  className="mt-1 inline-block text-[13px] font-semibold text-[#1d4ed8] hover:underline"
                >
                  Voir les tâches
                </Link>
              </div>
            ) : null}
          </aside>
        ) : (
          <aside
            data-demo-target="accueil-aujourdhui"
            className="rounded-2xl bw-surface-tinted-navy px-5 py-4 shadow-sm lg:row-span-2"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold tracking-tight text-[#1e3a5f]">
                Aujourd’hui
              </h2>
              <Link
                href={ops.links.agenda}
                className="text-[13px] font-semibold text-[#1d4ed8] hover:underline"
              >
                Voir Agenda
              </Link>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-slate-500">
              Ajoutez vos rendez-vous, visites, livraisons et échéances pour les
              retrouver ici.
            </p>
            <Link
              href={ops.links.nouvelEvenement}
              className="mt-3 inline-block text-[13px] font-semibold text-[#1d4ed8] hover:underline"
            >
              Ajouter un événement
            </Link>
          </aside>
        )}

        <div className="space-y-5 lg:col-start-1">
          {showFacturation || showRentabilite ? (
            <section className="rounded-2xl bw-surface-tinted-ok px-5 py-5 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:divide-x sm:divide-bework-navy/10 sm:gap-0">
                {showFacturation ? (
                  <div className="min-w-0 flex-1 sm:pr-6">
                    <FacturationHomeBanner />
                  </div>
                ) : null}
                {showRentabilite ? (
                  <div className="min-w-0 flex-1 sm:pl-6">
                    {!ops.hasProjects ? (
                      <div className="rounded-xl py-1">
                        <p className="text-[13px] font-semibold text-slate-500">
                          Rentabilité chantier
                        </p>
                        <p className="mt-1 text-[14px] leading-snug text-slate-600">
                          Suivez votre marge dès votre premier chantier :
                          prévisionnel, engagé, réel et encaissé.
                        </p>
                        <Link
                          href="/dashboard/projets"
                          className="mt-2 inline-block text-[13px] font-semibold text-[#1d4ed8] hover:underline"
                        >
                          Créer mon premier chantier
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href="/dashboard/rentabilite"
                        className="block rounded-xl py-1 transition-colors duration-150 hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
                      >
                        <p className="text-[13px] font-semibold text-slate-500">
                          Rentabilité
                        </p>
                        <p className="mt-1 text-[15px] font-bold text-[#1e3a5f]">
                          Voir la marge
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          Prévisionnel, engagé et encaissé
                        </p>
                      </Link>
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {showSiteVisits || showSuppliers ? (
            <section className="rounded-2xl border border-bework-navy/10 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-slate-500">Accès utiles</p>
                  <p className="mt-0.5 text-[14px] font-bold text-[#1e3a5f]">
                    Retrouver rapidement les modules qui font avancer le chantier.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {showSiteVisits ? (
                    <Link
                      href="/dashboard/visites-metres"
                      className="rounded-full border border-bework-cyan/20 bg-bework-soft-cyan/60 px-3 py-1.5 text-[13px] font-medium text-bework-navy transition-colors hover:bg-bework-soft-cyan"
                    >
                      Visites & métrés
                    </Link>
                  ) : null}
                  {showSuppliers ? (
                    <Link
                      href="/dashboard/fournisseurs"
                      className="rounded-full border border-bework-watch/20 bg-bework-soft-watch/60 px-3 py-1.5 text-[13px] font-medium text-bework-navy transition-colors hover:bg-bework-soft-watch"
                    >
                      Fournisseurs
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <MessagesHomeBanner variant="card" />

          {watchChantiers.length > 0 ? (
            <DashboardSection
              demoTarget="accueil-chantiers"
              title="Chantiers à surveiller"
              action={{ href: ops.links.projets, label: "Voir chantiers →" }}
            >
              <ul className="space-y-2">
                {watchChantiers.map((c) => {
                  const signals = [
                    c.criticalCount > 0
                      ? `${c.criticalCount} critique${c.criticalCount > 1 ? "s" : ""}`
                      : null,
                    c.overdueTasks > 0
                      ? `${c.overdueTasks} tâche${c.overdueTasks > 1 ? "s" : ""} en retard`
                      : null,
                    c.attentionCount > 0 && c.criticalCount === 0
                      ? `${c.attentionCount} à traiter`
                      : null,
                  ].filter(Boolean);
                  const linkedSignals = [
                    c.nextEventLabel ? `Agenda · ${c.nextEventLabel}` : null,
                    c.nextDeliveryLabel ? `Livraison · ${c.nextDeliveryLabel}` : null,
                  ].filter(Boolean);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/dashboard/projets/${c.id}`}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-bework-navy/10 bg-white/70 px-3.5 py-3 transition-colors duration-150 hover:bg-bework-soft-accent hover:border-bework-accent/25"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-bold text-slate-950">
                            {c.title}
                          </span>
                          {signals.length > 0 ? (
                            <span className="mt-0.5 block text-[13px] text-slate-600">
                              {signals.join(" · ")}
                            </span>
                          ) : null}
                          {linkedSignals.length > 0 ? (
                            <span className="mt-1 block text-[12px] text-slate-500">
                              {linkedSignals.join(" · ")}
                            </span>
                          ) : null}
                        </span>
                        <span
                          aria-hidden
                          className="text-[18px] font-light text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#1e3a5f]"
                        >
                          ›
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </DashboardSection>
          ) : null}

          {upcoming.length > 0 ? (
            <DashboardSection
              title="Prochainement"
              action={{ href: ops.links.agenda, label: "Voir Agenda →" }}
            >
              <ol className="space-y-3">
                {upcoming.map((ev) => (
                  <li key={ev.id} className="flex gap-3">
                    <span className="w-[4.5rem] shrink-0 pt-0.5 text-[13px] font-medium text-slate-400">
                      {formatAgendaWhen(ev.startAt)}
                    </span>
                    <Link
                      href={`/dashboard/agenda?event=${ev.id}`}
                      className="min-w-0 flex-1 rounded-lg transition-colors duration-150 hover:bg-slate-50/80"
                    >
                      <span className="text-[14px] font-semibold text-slate-900">
                        <span className="mr-1" aria-hidden>
                          {agendaIcon(ev.type)}
                        </span>
                        {ev.title}
                      </span>
                      {ev.projectTitle ? (
                        <span className="mt-0.5 block text-[13px] text-slate-500">
                          {ev.projectTitle}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ol>
            </DashboardSection>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const ATTENTION_CARD_TONE: Record<
  AttentionDisplayCategorySummary["id"],
  { surface: string; pill: string; count: string; hover: string }
> = {
  annual_contract: {
    surface: "bw-surface-tinted-cyan",
    pill: "bw-icon-pill bw-icon-pill-cyan",
    count: "text-bework-cyan",
    hover: "hover:brightness-[0.98]",
  },
  tasks_followup: {
    surface: "bw-surface-tinted-violet",
    pill: "bw-icon-pill bw-icon-pill-violet",
    count: "text-bework-intel",
    hover: "hover:brightness-[0.98]",
  },
  purchase_order: {
    surface: "bw-surface-tinted-watch",
    pill: "bw-icon-pill bw-icon-pill-watch",
    count: "text-bework-watch",
    hover: "hover:brightness-[0.98]",
  },
  billing: {
    surface: "bw-surface-tinted-ok",
    pill: "bw-icon-pill bw-icon-pill-ok",
    count: "text-bework-ok",
    hover: "hover:brightness-[0.98]",
  },
  other: {
    surface: "bw-surface-tinted-navy",
    pill: "bw-icon-pill bw-icon-pill-navy",
    count: "text-bework-navy",
    hover: "hover:brightness-[0.98]",
  },
};

function AttentionCategoryCard({
  category,
}: {
  category: AttentionDisplayCategorySummary;
}) {
  const meta = urgencyMeta(category.maxUrgency);
  const tone = ATTENTION_CARD_TONE[category.id];
  return (
    <Link
      href={category.href}
      className={cn(
        "group flex items-start justify-between gap-3 rounded-xl px-3.5 py-3 transition-[filter,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bework-accent/30",
        tone.surface,
        tone.hover,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2.5">
          <span className={cn(tone.pill, "h-8 w-8")} aria-hidden>
            <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
          </span>
          <span className="truncate text-[13px] font-semibold text-slate-900">
            {category.label}
          </span>
        </span>
        <span className="mt-1.5 flex items-baseline gap-2 pl-[2.625rem]">
          <span
            className={cn(
              "text-2xl font-extrabold tabular-nums tracking-tight",
              tone.count,
            )}
          >
            {category.count}
          </span>
          {category.gravitySummary ? (
            <span className={cn("text-[11px] font-medium", meta.text)}>
              {category.gravitySummary}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block pl-[2.625rem] text-[12px] text-slate-500">
          {category.shortHint}
        </span>
      </span>
      <span
        aria-hidden
        className="pt-1 text-[18px] font-light text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-bework-navy"
      >
        ›
      </span>
    </Link>
  );
}
