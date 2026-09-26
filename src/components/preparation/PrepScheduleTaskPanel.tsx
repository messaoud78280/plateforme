"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatQty } from "@/lib/preparation/units";
import { halfLabel } from "@/lib/preparation/schedule/gantt-layout";
import type { SchedulePlanViewPayload } from "@/lib/preparation/schedule/transfer";

type Task = SchedulePlanViewPayload["tasks"][number];

const HOLD_OPTIONS = [
  { value: "A_CONTROLER", label: "À contrôler" },
  { value: "VALIDE", label: "Validé" },
  { value: "RESERVES", label: "Réserves" },
] as const;

type Props = {
  task: Task;
  nextBlockedStepCode: string | null;
  busy: boolean;
  onClose: () => void;
  onHoldStatusChange: (status: "A_CONTROLER" | "VALIDE" | "RESERVES") => void;
};

export function PrepScheduleTaskPanel({
  task,
  nextBlockedStepCode,
  busy,
  onClose,
  onHoldStatusChange,
}: Props) {
  return (
    <aside className="flex h-full max-h-[min(85vh,820px)] w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="font-mono text-[12px] text-slate-500">{task.stepCode}</p>
          <h3 className="text-[15px] font-semibold text-[#1e3a5f]">{task.name}</h3>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {kindLabel(task.kind)}
            {task.conditional ? " · Conditionnel · Hors planning de base" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-[13px] text-slate-500 hover:bg-slate-50"
        >
          Fermer
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-[13px]">
        {task.holdPoint ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              Point d&apos;arrêt
            </p>
            {nextBlockedStepCode ? (
              <p className="mt-1 text-[12px] text-amber-950">
                Levée requise avant {nextBlockedStepCode}.
              </p>
            ) : null}
            {task.holdPointBlocksNext ? (
              <p className="mt-1 text-[12px] font-medium text-amber-900">
                Intervention suivante non libérée tant que ce point n&apos;est pas validé.
              </p>
            ) : (
              <p className="mt-1 text-[12px] text-emerald-800">Point d&apos;arrêt validé.</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {HOLD_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={busy}
                  onClick={() => onHoldStatusChange(o.value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    task.holdPointStatus === o.value
                      ? "bg-amber-800 text-white"
                      : "border border-amber-300 bg-white text-amber-950",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {task.conditional ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[12px] text-slate-700">
            <span className="font-semibold">Conditionnel</span> — date indicative, hors durée de
            base tant que non activé.
            {task.conditionalConditions.length ? (
              <ul className="mt-1 list-inside list-disc text-[11px] text-slate-600">
                {task.conditionalConditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <Section title="Planning">
          <Row
            label="Dates"
            value={`${task.startDate ?? "—"} → ${task.endDate ?? "—"}`}
          />
          <Row
            label="Créneaux"
            value={`${halfLabel(task.startHalf)} → ${halfLabel(task.endHalf)}`}
          />
          <Row
            label="Durée"
            value={`${task.durationDays} j ${task.durationCalendar === "calendar" ? "calendaires" : "ouvrés"}`}
          />
        </Section>

        <Section title="Quantité / rendement">
          <Row
            label="Quantité pilote"
            value={
              task.quantitySnapshot != null
                ? `${formatQty(task.quantitySnapshot)} ${task.quantityUnit ?? ""}`.trim()
                : "—"
            }
          />
          <Row
            label="Rendement"
            value={
              task.rateValue != null
                ? `${task.rateValue} ${task.rateUnit ?? ""}${task.ratePerLabel ? ` (${task.ratePerLabel})` : ""}`
                : "—"
            }
          />
          <Row label="Code pilote" value={task.driverTakeoffCode ?? "—"} />
        </Section>

        <Section title="Équipe">
          {task.crew.length ? (
            <ul className="space-y-0.5">
              {task.crew.map((c) => (
                <li key={c.labor_id}>
                  {c.count}× {c.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </Section>

        <Section title="Engins">
          {task.equipment.length ? (
            <ul className="space-y-0.5">
              {task.equipment.map((e) => (
                <li key={e.equipment_id}>
                  {e.count}× {e.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </Section>

        <Section title="Dépendances">
          {task.dependsOn.length ? (
            <ul className="space-y-0.5">
              {task.dependsOn.map((d) => (
                <li key={`${d.stepId}-${d.type}`}>
                  {d.type} ← {d.stepId}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </Section>

        <Section title="Prérequis">
          {task.preconditions.length ? (
            <ul className="list-inside list-disc space-y-0.5 text-[12px]">
              {task.preconditions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </Section>

        <Section title="Contrôles">
          {task.controls.length ? (
            <ul className="list-inside list-disc space-y-0.5 text-[12px]">
              {task.controls.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </Section>

        <Section title="Montants">
          <Row
            label="Vente HT"
            value={
              task.sellHtSnapshot != null
                ? `${task.sellHtSnapshot.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                : "—"
            }
          />
          <Row
            label="Déboursé HT"
            value={
              task.costHtSnapshot != null
                ? `${task.costHtSnapshot.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                : "—"
            }
          />
        </Section>

        {task.blockingReason ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-950">
            {task.blockingReason}
          </p>
        ) : null}

        {task.description ? (
          <Section title="Description">
            <p className="whitespace-pre-wrap text-[12px] text-slate-600">{task.description}</p>
          </Section>
        ) : null}
      </div>
    </aside>
  );
}

function kindLabel(kind: string) {
  if (kind === "wait") return "Attente technique";
  if (kind === "control") return "Contrôle";
  return "Travaux";
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium tabular-nums text-slate-800">{value}</span>
    </div>
  );
}
