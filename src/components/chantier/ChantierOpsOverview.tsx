"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChantierOpsSummary } from "@/lib/chantier/cockpit-ops";
import { cn } from "@/lib/cn";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  });
}

function fmtDayTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
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
}: {
  title: string;
  count?: number | string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {title}
          {count != null ? (
            <span className="ml-2 tabular-nums text-slate-800">{count}</span>
          ) : null}
        </h3>
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

export function ChantierQuickActions({
  ops,
  canCreate,
  onCreateTask,
}: {
  ops: ChantierOpsSummary;
  canCreate: boolean;
  onCreateTask?: () => void;
}) {
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

  if (!canCreate) return null;

  const items: { label: string; href?: string; onClick?: () => void }[] = [
    { label: "Créer une tâche", onClick: onCreateTask },
    { label: "Créer un événement Agenda", href: ops.links.nouvelEvenement },
    { label: "Ajouter un document", href: ops.links.nouveauDocument },
    { label: "Créer une fiche de suivi", href: ops.links.nouvelleFiche },
    { label: "Message équipe", href: ops.links.team },
    { label: "Créer une commande", href: ops.links.nouvelleCommande },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#16304f]"
      >
        + Action
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1.5 min-w-[220px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((it) =>
            it.href ? (
              <Link
                key={it.label}
                href={it.href}
                className="block px-3.5 py-2 text-sm text-slate-800 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {it.label}
              </Link>
            ) : (
              <button
                key={it.label}
                type="button"
                className="block w-full px-3.5 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
              >
                {it.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ChantierOpsOverview({
  ops,
  mode = "internal",
  billingHint,
}: {
  ops: ChantierOpsSummary;
  mode?: "internal" | "external";
  billingHint?: { label: string; count: number; href: string } | null;
}) {
  const c = ops.counts;

  return (
    <div className="space-y-4">
      {/* Synthèse chiffres */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            label: "À traiter",
            value: c.aTraiter,
            href: ops.links.aTraiter,
            hot: c.aTraiter > 0,
          },
          {
            label: "Livraisons / 7 j",
            value: c.deliveriesThisWeek,
            href: ops.links.agenda,
            hot: false,
          },
          {
            label: "Commandes à confirmer",
            value: c.ordersToConfirm,
            href: ops.links.commandes,
            hot: c.ordersToConfirm > 0,
          },
          {
            label: "Tâches ouvertes",
            value: c.openTasks,
            href: "#tab-taches",
            hot: false,
          },
        ]
          .filter((s) => mode === "internal" || s.label === "Livraisons / 7 j")
          .map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={cn(
                "rounded-xl border px-3 py-3 transition hover:border-[#1e3a5f]/30",
                s.hot
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-slate-200 bg-white",
              )}
            >
              <p className="text-xl font-extrabold tabular-nums text-slate-900">{s.value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-600">{s.label}</p>
            </Link>
          ))}
      </div>

      {mode === "internal" ? (
        <Section
          title="À traiter"
          count={ops.attention.length}
          action={{ href: ops.links.aTraiter, label: "Voir tout" }}
        >
          {ops.attention.length === 0 ? (
            <p className="text-sm text-slate-500">Rien de bloquant pour le moment.</p>
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
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{item.reason}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      {mode === "internal" && billingHint ? (
        <Section
          title="Facturation"
          count={billingHint.count}
          action={{ href: billingHint.href, label: "Voir" }}
        >
          <p className="text-sm font-medium text-slate-800">{billingHint.label}</p>
          <Link
            href={billingHint.href}
            className="mt-2 inline-block text-xs font-semibold text-[#1d4ed8] hover:underline"
          >
            Voir la facturation →
          </Link>
        </Section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Aujourd’hui / À venir"
          action={{ href: ops.links.agenda, label: "Voir l’Agenda" }}
        >
          {ops.agenda.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun événement à venir.</p>
          ) : (
            <ul className="space-y-2.5">
              {ops.agenda.map((ev) => (
                <li key={ev.id} className="flex gap-3 text-sm">
                  <span className="w-12 shrink-0 tabular-nums font-semibold text-slate-700">
                    {fmtTime(ev.startAt)}
                  </span>
                  <span className="min-w-0">
                    <span className="mr-1.5" aria-hidden>
                      {agendaIcon(ev.type)}
                    </span>
                    <Link
                      href={`/dashboard/agenda?event=${ev.id}&projectId=${ops.projectId}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {ev.title}
                    </Link>
                    {ev.status === "PLANIFIE" ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase text-amber-700">
                        À confirmer
                      </span>
                    ) : ev.status === "CONFIRME" ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase text-emerald-700">
                        Confirmé
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {fmtDay(ev.startAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {mode === "internal" && ops.teamToday.length > 0 ? (
          <Section
            title="Équipe aujourd’hui"
            action={{ href: ops.links.planning, label: "Voir le Planning" }}
          >
            <ul className="space-y-2">
              {ops.teamToday.map((t) => (
                <li key={t.id} className="text-sm">
                  <span className="font-semibold text-slate-900">{t.name}</span>
                  <span className="ml-2 tabular-nums text-slate-500">
                    {fmtTime(t.startAt)}–{fmtTime(t.endAt)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{t.title}</span>
                </li>
              ))}
            </ul>
          </Section>
        ) : mode === "internal" ? (
          <Section
            title="Équipe aujourd’hui"
            action={{ href: ops.links.planning, label: "Voir le Planning" }}
          >
            <p className="text-sm text-slate-500">
              Aucune ressource agenda liée à ce chantier aujourd’hui.
            </p>
          </Section>
        ) : null}
      </div>

      {mode === "internal" ? (
        <Section
          title="Commandes & livraisons"
          action={{ href: ops.links.commandes, label: "Voir les commandes" }}
        >
          {ops.orders.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune commande active.</p>
          ) : (
            <ul className="space-y-3">
              {ops.orders.map((o) => (
                <li
                  key={o.id}
                  className={cn(
                    "rounded-lg border px-3 py-2.5",
                    o.hasAttention ? "border-amber-200 bg-amber-50/40" : "border-slate-100",
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/dashboard/commandes/${o.id}`}
                      className="text-sm font-bold text-slate-900 hover:underline"
                    >
                      {o.number}
                    </Link>
                    <span className="text-[11px] font-semibold text-slate-500">{o.statusLabel}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{o.supplierName}</p>
                  {o.lineSummary ? (
                    <p className="mt-1 text-xs text-slate-700">{o.lineSummary}</p>
                  ) : null}
                  {o.deliveryAt ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Livraison : {fmtDayTime(o.deliveryAt)}
                    </p>
                  ) : null}
                  {o.receivedLabel ? (
                    <p className="mt-0.5 text-xs font-semibold text-slate-800">{o.receivedLabel}</p>
                  ) : null}
                  <Link
                    href={`/dashboard/commandes/${o.id}`}
                    className="mt-1.5 inline-block text-xs font-semibold text-[#1d4ed8] hover:underline"
                  >
                    Voir commande →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      {mode === "internal" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section
            title="Tâches"
            action={{ href: "#tab-taches", label: "Voir toutes" }}
          >
            {ops.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune tâche ouverte.</p>
            ) : (
              <ul className="space-y-2">
                {ops.tasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/taches/${t.id}`}
                      className="block text-sm hover:bg-slate-50"
                    >
                      <span className="font-semibold text-slate-900">{t.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {[t.assigneeName, t.desiredDate ? fmtDay(t.desiredDate) : null]
                          .filter(Boolean)
                          .join(" · ")}
                        {t.overdue ? (
                          <span className="ml-1.5 font-semibold text-red-700">Retard</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
                {ops.tasksMore > 0 ? (
                  <li className="text-xs font-medium text-slate-500">
                    +{ops.tasksMore} autre{ops.tasksMore > 1 ? "s" : ""}
                  </li>
                ) : null}
              </ul>
            )}
          </Section>

          <Section
            title="Fiches de suivi"
            action={{ href: ops.links.fiches, label: "Voir les fiches" }}
          >
            {ops.sheets.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune fiche active.</p>
            ) : (
              <ul className="space-y-2">
                {ops.sheets.map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-2 text-sm">
                    <Link
                      href={`/dashboard/fiches-suivi/${s.id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {s.title}
                    </Link>
                    <span className="shrink-0 text-[11px] text-slate-500">{s.statusLabel}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {mode === "internal" ? (
          <Section
            title="Messagerie"
            action={{ href: ops.links.messagerie, label: "Voir Messagerie" }}
          >
            {ops.messages.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun message récent.</p>
            ) : (
              <ul className="space-y-2.5">
                {ops.messages.map((m) => (
                  <li key={m.id} className="text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {m.channelLabel}
                    </span>
                    <p className="font-medium text-slate-800">
                      {m.senderName} : {m.preview}
                      {m.preview.length >= 80 ? "…" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={ops.links.team}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-[#1e3a5f]"
              >
                Équipe
              </Link>
              <Link
                href={ops.links.client}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-[#1e3a5f]"
              >
                Client
              </Link>
              <Link
                href={ops.links.suppliers}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-[#1e3a5f]"
              >
                Fournisseurs
              </Link>
            </div>
          </Section>
        ) : null}

        <Section
          title="Documents récents"
          action={{ href: "#dossier-chantier", label: "Voir les documents" }}
        >
          {ops.documents.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun document récent.</p>
          ) : (
            <ul className="space-y-2">
              {ops.documents.map((d) => (
                <li key={d.id} className="flex items-baseline justify-between gap-2 text-sm">
                  {d.href ? (
                    <a
                      href={d.href}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-medium text-slate-900 hover:underline"
                    >
                      {d.name}
                    </a>
                  ) : (
                    <span className="truncate font-medium text-slate-900">{d.name}</span>
                  )}
                  <span className="shrink-0 text-[11px] text-slate-400">{fmtDay(d.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
