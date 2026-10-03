"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PlanningTaskVM } from "@/lib/preparation/schedule/planning-view-model";
import { halfLabel } from "@/lib/preparation/schedule/gantt-layout";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso.slice(0, 10);
  const months = [
    "jan.",
    "fév.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  return `${Number(d)} ${months[Number(m) - 1] ?? m}`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  if (!children) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="text-[12.5px] leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-slate-400">—</span>;
  return (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((x, i) => (
        <li key={`${i}-${x.slice(0, 24)}`}>{x}</li>
      ))}
    </ul>
  );
}

/** Carte de lecture rapide — données VM uniquement, aucune écriture. */
export function PlanningTaskHoverCard({
  task,
  compact = false,
}: {
  task: PlanningTaskVM;
  compact?: boolean;
}) {
  const preds = task.dependsOn;
  const succs = task.successors;

  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-[11px] text-slate-500">{task.stepCode}</p>
        <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#1e3a5f]">
          {task.name}
        </p>
        {!compact && task.description ? (
          <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-600">
            {task.description}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Phase
          </p>
          <p className="text-slate-700">{task.phaseLabel}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Équipe
          </p>
          <p className={task.missing.crew ? "text-amber-700" : "text-slate-700"}>
            {task.crewDisplay}
            {task.crewSize != null ? ` · ${task.crewSize} pers.` : ""}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Durée
          </p>
          <p className="text-slate-700">
            {task.durationLabel}
            <span className="text-slate-400"> · {task.durationModeLabel}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Dates
          </p>
          <p className="text-slate-700">
            {task.startDate && task.endDate
              ? `${formatDate(task.startDate)} (${halfLabel(task.startHalf)}) → ${formatDate(task.endDate)} (${halfLabel(task.endHalf)})`
              : "À définir"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Quantité
          </p>
          <p className="text-slate-700">{task.quantityDisplay}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Charge
          </p>
          <p className="text-slate-700">{task.workloadDisplay || "—"}</p>
        </div>
      </div>

      {!compact ? (
        <>
          <Section title="Prérequis">
            <BulletList items={task.preconditions} />
          </Section>
          <Section title="Contrôles">
            <BulletList items={task.controls} />
          </Section>
          <Section title="Sécurité">
            <BulletList items={task.safety} />
          </Section>
        </>
      ) : null}

      <div
        className={cn(
          "grid gap-2 border-t border-slate-100 pt-2",
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        <Section title={`Prédécesseurs (${preds.length})`}>
          {preds.length === 0 ? (
            <span className="text-slate-400">Aucun</span>
          ) : (
            <ul className="space-y-0.5">
              {preds.slice(0, compact ? 4 : preds.length).map((d) => (
                <li key={`p-${d.stepId}`} className="font-mono text-[11px]">
                  <span className="text-[#1e3a5f]">{d.stepId}</span>
                  <span className="text-slate-400"> · {d.type}</span>
                  {d.name ? (
                    <span className="block truncate text-[11px] text-slate-600">
                      {d.name}
                    </span>
                  ) : null}
                </li>
              ))}
              {compact && preds.length > 4 ? (
                <li className="text-[11px] text-slate-400">
                  +{preds.length - 4} autre{preds.length - 4 > 1 ? "s" : ""}
                </li>
              ) : null}
            </ul>
          )}
        </Section>
        {!compact ? (
          <Section title={`Successeurs (${succs.length})`}>
            {succs.length === 0 ? (
              <span className="text-slate-400">Aucun</span>
            ) : (
              <ul className="space-y-0.5">
                {succs.map((d) => (
                  <li key={`s-${d.stepId}`} className="font-mono text-[11px]">
                    <span className="text-[#1e3a5f]">{d.stepId}</span>
                    <span className="text-slate-400"> · {d.type}</span>
                    {d.name ? (
                      <span className="block truncate text-[11px] text-slate-600">
                        {d.name}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ) : null}
      </div>

      {!compact ? (
        <p className="text-[11px] text-slate-400">
          Dépend de {preds.length} tâche{preds.length > 1 ? "s" : ""} · Bloque{" "}
          {succs.length} tâche{succs.length > 1 ? "s" : ""}
        </p>
      ) : null}
    </div>
  );
}
