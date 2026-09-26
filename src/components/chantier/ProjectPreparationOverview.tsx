import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ProjectWorkspace, ScopeWorkspace, SyncState } from "@/lib/chantier/project-workspace";

const SYNC_LABEL: Record<SyncState, string> = {
  A_JOUR: "À jour",
  MODIFICATION_DISPONIBLE: "Modification disponible",
  A_VERIFIER: "À vérifier",
  DESYNCHRONISE_VOLONTAIREMENT: "Désynchronisé volontairement",
  ABSENT: "Absent",
};

const SYNC_TONE: Record<SyncState, string> = {
  A_JOUR: "bg-emerald-50 text-emerald-800 border-emerald-200",
  MODIFICATION_DISPONIBLE: "bg-amber-50 text-amber-900 border-amber-200",
  A_VERIFIER: "bg-sky-50 text-sky-900 border-sky-200",
  DESYNCHRONISE_VOLONTAIREMENT: "bg-slate-100 text-slate-700 border-slate-200",
  ABSENT: "bg-slate-50 text-slate-500 border-slate-200",
};

export function ProjectPreparationOverview({
  workspace,
}: {
  workspace: ProjectWorkspace;
}) {
  return (
    <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1e3a5f]">
            Préparation & conduite de chantier
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Périmètres techniques · plans · métrés · devis · planning · suivi
          </p>
        </div>
        {workspace.scopes.length === 0 ? (
          <p className="text-[12px] text-amber-800">
            Aucun périmètre défini pour ce chantier.
          </p>
        ) : null}
      </div>

      {workspace.unscoped.studies +
        workspace.unscoped.schedulePlans +
        workspace.unscoped.quotes >
      0 ? (
        <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
          Hors périmètre : {workspace.unscoped.studies} métré(s),{" "}
          {workspace.unscoped.quotes} devis, {workspace.unscoped.schedulePlans}{" "}
          planning(s) — à classer.
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        {workspace.scopes.map((scope) => (
          <ScopeBlock key={scope.id} scope={scope} />
        ))}
      </div>
    </section>
  );
}

function ScopeBlock({ scope }: { scope: ScopeWorkspace }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {scope.code}
          </p>
          <Link
            href={scope.href}
            className="text-[16px] font-semibold text-[#1e3a5f] hover:underline"
          >
            {scope.name}
          </Link>
        </div>
        <Link
          href={scope.href}
          className="rounded-full border border-[#1e3a5f]/20 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1e3a5f]"
        >
          Ouvrir le périmètre
        </Link>
      </div>

      {scope.alerts.length ? (
        <ul className="mt-2 space-y-1">
          {scope.alerts.map((a) => (
            <li
              key={a.message}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[12px]",
                a.level === "warning"
                  ? "bg-amber-50 text-amber-950"
                  : "bg-white text-slate-600",
              )}
            >
              {a.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {scope.cards.map((card) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {card.label}
                </p>
                {card.isReference ? (
                  <span className="rounded bg-[#1e3a5f]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#1e3a5f]">
                    Réf.
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] font-medium text-slate-900 line-clamp-2">
                {card.title}
              </p>
              {card.detail ? (
                <p className="mt-0.5 text-[11px] text-slate-500">{card.detail}</p>
              ) : null}
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  SYNC_TONE[card.syncState],
                )}
                title={card.syncHint ?? undefined}
              >
                {SYNC_LABEL[card.syncState]}
              </span>
            </>
          );

          if (card.href) {
            return (
              <Link
                key={card.kind}
                href={card.href}
                className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#1e3a5f]/30 hover:shadow-sm"
              >
                {inner}
              </Link>
            );
          }
          return (
            <div
              key={card.kind}
              className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 opacity-80"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
