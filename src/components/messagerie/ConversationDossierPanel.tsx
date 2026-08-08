"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Ctx = {
  project: { id: string; title: string } | null;
  todo: {
    id: string;
    title: string;
    priority: string | null;
    dueAt: string | null;
    assigneeName: string | null;
    href: string;
    kind: string;
  }[];
  events: {
    id: string;
    title: string;
    type: string;
    status: string;
    startAt: string;
    href: string;
    messageHref: string | null;
  }[];
  pending: {
    id: string;
    title: string;
    status: string;
    nextAction: string | null;
    nextActionAt: string | null;
    href: string;
  }[];
  waiting: { avenants: number; commandes: number; aFacturer: number };
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationDossierPanel({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<Ctx | null>(null);

  useEffect(() => {
    if (!taskId) return;
    void fetch(`/api/tasks/${taskId}/conversation-context`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setCtx(d as Ctx);
      })
      .catch(() => {});
  }, [taskId]);

  const todoCount = ctx?.todo.length ?? 0;
  const eventCount = ctx?.events.length ?? 0;
  const pendingCount = ctx?.pending.length ?? 0;
  const total = todoCount + pendingCount;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        title="Dossier conversation"
      >
        Dossier
        {total > 0 ? (
          <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
            {total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Dossier chantier
            </p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400">
              Fermer
            </button>
          </div>

          {projectId || ctx?.project ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Link
                href={`/dashboard/projets/${projectId || ctx?.project?.id}`}
                className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
              >
                Chantier
              </Link>
              <Link
                href="/dashboard/agenda"
                className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
              >
                Agenda
              </Link>
              <Link
                href="/dashboard/fiches-suivi"
                className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
              >
                Fiches
              </Link>
              <Link
                href="/dashboard/a-traiter"
                className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
              >
                À traiter
              </Link>
            </div>
          ) : null}

          <section className="mb-3">
            <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              À faire {todoCount ? `(${todoCount})` : ""}
            </h4>
            {todoCount === 0 ? (
              <p className="text-[11px] text-slate-400">Aucune action ouverte.</p>
            ) : (
              <ul className="space-y-1.5">
                {ctx!.todo.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={t.href}
                      className="block rounded-lg border border-slate-100 px-2 py-1.5 hover:bg-slate-50"
                    >
                      <span
                        className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                          t.priority === "URGENT"
                            ? "bg-red-600"
                            : t.priority === "IMPORTANT"
                              ? "bg-amber-500"
                              : "bg-slate-300"
                        }`}
                      />
                      <span className="text-[11px] font-semibold text-slate-800">{t.title}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {fmt(t.dueAt)}
                        {t.assigneeName ? ` · ${t.assigneeName}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-3">
            <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Prochains événements {eventCount ? `(${eventCount})` : ""}
            </h4>
            {eventCount === 0 ? (
              <p className="text-[11px] text-slate-400">Rien de planifié.</p>
            ) : (
              <ul className="space-y-1.5">
                {ctx!.events.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={e.href}
                      className="block rounded-lg border border-slate-100 px-2 py-1.5 hover:bg-slate-50"
                    >
                      <span className="text-[11px] font-semibold text-slate-800">{e.title}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {fmt(e.startAt)} · {e.type}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-2">
            <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Éléments en attente
            </h4>
            {ctx ? (
              <p className="text-[11px] text-slate-600">
                {ctx.waiting.avenants} avenant · {ctx.waiting.commandes} commande ·{" "}
                {ctx.waiting.aFacturer} à facturer
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">Chargement…</p>
            )}
            {pendingCount > 0 ? (
              <ul className="mt-1.5 space-y-1">
                {ctx!.pending.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <Link href={p.href} className="text-[11px] font-medium text-[#1d4ed8] hover:underline">
                      {p.nextAction || p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
