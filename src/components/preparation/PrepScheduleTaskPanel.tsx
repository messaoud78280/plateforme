"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatQty } from "@/lib/preparation/units";
import { halfLabel } from "@/lib/preparation/schedule/gantt-layout";
import type { PlanningTaskVM } from "@/lib/preparation/schedule/planning-view-model";

const HOLD_OPTIONS = [
  { value: "A_CONTROLER", label: "À contrôler" },
  { value: "VALIDE", label: "Validé" },
  { value: "RESERVES", label: "Réserves" },
] as const;

type Props = {
  task: PlanningTaskVM;
  nextBlockedStepCode: string | null;
  busy: boolean;
  onClose: () => void;
  onHoldStatusChange: (status: "A_CONTROLER" | "VALIDE" | "RESERVES") => void;
  onFocusStep?: (stepCode: string) => void;
  docked?: boolean;
};

function kindLabel(kind: string) {
  if (kind === "wait") return "Attente technique";
  if (kind === "control") return "Contrôle";
  return "Travaux";
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[12px] text-slate-500">{children}</p>;
}

function formatOpText(raw: string): ReactNode {
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return <p className="whitespace-pre-wrap text-[12px] text-slate-700">{raw}</p>;
  }
  const looksLikeSteps = lines.filter((l) => /^[-•*\d]+[.)\s]/.test(l)).length >= 2;
  if (looksLikeSteps) {
    return (
      <ul className="list-inside list-disc space-y-1 text-[12px] text-slate-700">
        {lines.map((l) => (
          <li key={l}>{l.replace(/^[-•*\d]+[.)\s]+/, "")}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-2 text-[12px] text-slate-700">
      {lines.map((l) => (
        <p key={l} className="whitespace-pre-wrap">
          {l}
        </p>
      ))}
    </div>
  );
}

export function PrepScheduleTaskPanel({
  task,
  nextBlockedStepCode,
  busy,
  onClose,
  onHoldStatusChange,
  onFocusStep,
  docked = false,
}: Props) {
  return (
    <aside
      className={cn(
        "flex w-full flex-col border-l border-slate-200/80 bg-white",
        docked
          ? "h-full max-h-[min(82vh,920px)] w-[400px]"
          : "h-full max-h-[min(90vh,900px)] max-w-[400px] shadow-[0_16px_40px_-20px_rgba(15,23,42,0.35)]",
      )}
      aria-label={`Fiche tâche ${task.stepCode}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[12px] text-slate-500">{task.stepCode}</p>
          <h3 className="text-[15px] font-semibold leading-snug text-[#1e3a5f]">
            {task.name}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {kindLabel(task.kind)}
            </span>
            {task.visualKind === "incomplete" ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                À COMPLÉTER
              </span>
            ) : null}
            {task.visualKind === "blocked" ? (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                BLOQUANT
              </span>
            ) : null}
            {task.durationMode !== "fixed" ? (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {task.durationMode === "computed" || task.durationMode === "computed_workload"
                  ? "CALCULÉ"
                  : "FIXE"}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-[13px] text-slate-500 hover:bg-slate-50"
        >
          Fermer
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-[13px]">
        {task.holdPoint ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
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

        {/* 1. Identité */}
        <Section title="Identité">
          <Row label="Référence" value={task.stepCode} />
          <Row label="Nature" value={kindLabel(task.kind)} />
          <Row
            label="Source métré"
            value={
              task.driverTakeoffCode
                ? `Métré ${task.driverTakeoffCode}`
                : "Non renseignée"
            }
          />
        </Section>

        {/* 2. Phase */}
        <Section title="Phase">
          <Row label="Phase" value={task.phaseLabel} />
        </Section>

        {/* 3. Planning */}
        <Section title="Planning">
          <Row
            label="Dates"
            value={
              task.startDate && task.endDate
                ? `${task.startDate} → ${task.endDate}`
                : "Dates à définir (démarrer le planning)"
            }
          />
          <Row
            label="Créneau"
            value={`${halfLabel(task.startHalf)} → ${halfLabel(task.endHalf)}`}
          />
          <Row
            label="Durée"
            value={`${task.durationLabel} ${
              task.durationCalendar === "calendar" ? "calendaires" : "ouvrés"
            }`}
          />
          <Row label="Mode durée" value={task.durationModeLabel} />
        </Section>

        {/* 4. Production */}
        <Section title="Production">
          <Row
            label="Quantité"
            value={
              task.quantitySnapshot != null
                ? `${formatQty(task.quantitySnapshot)} ${task.quantityUnit ?? ""}`.trim()
                : "Quantité non disponible"
            }
          />
          <Row
            label="Rendement"
            value={task.rateDisplay}
          />
          <Row label="Unités parallèles" value={String(task.parallelUnits)} />
          <Row
            label="Charge h.j"
            value={
              task.workloadPersonDays != null
                ? task.workloadDisplay
                : "Charge non renseignée"
            }
          />
        </Section>

        {/* 5. Équipe */}
        <Section title="Équipe">
          {task.missing.crew ? (
            <Empty>Équipe non renseignée</Empty>
          ) : (
            <>
              <Row label="Équipe" value={task.crewId ?? "Sans identifiant"} />
              <Row
                label="Effectif"
                value={
                  task.crewSize != null
                    ? `${task.crewSize} personne${task.crewSize > 1 ? "s" : ""}`
                    : "Non renseigné"
                }
              />
              {task.crewMembers.length ? (
                <div className="mt-1">
                  <p className="mb-0.5 text-[11px] text-slate-500">Composition</p>
                  <ul className="space-y-0.5 text-[12px] text-slate-700">
                    {task.crewMembers.map((c) => (
                      <li key={c.labor_id}>
                        {c.count} {c.label || c.labor_id}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </Section>

        {/* 6. Dépendances */}
        <Section title="Dépendances">
          {!task.dependsOn.length && !task.successors.length ? (
            <Empty>Aucune dépendance définie</Empty>
          ) : (
            <>
              {task.dependsOn.length ? (
                <div>
                  <p className="mb-0.5 text-[11px] text-slate-500">Après</p>
                  <ul className="space-y-0.5">
                    {task.dependsOn.map((d) => (
                      <li key={`pred-${d.stepId}-${d.type}`}>
                        <button
                          type="button"
                          className="text-left text-[12px] font-medium text-[#1e3a5f] underline-offset-2 hover:underline"
                          onClick={() => onFocusStep?.(d.stepId)}
                        >
                          {d.stepId}
                          {d.name ? ` · ${d.name}` : ""}
                        </button>
                        <span className="ml-1 text-[11px] text-slate-500">
                          {d.type} · lag 0 j
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Empty>Aucun prédécesseur</Empty>
              )}
              {task.successors.length ? (
                <div className="mt-2">
                  <p className="mb-0.5 text-[11px] text-slate-500">Avant</p>
                  <ul className="space-y-0.5">
                    {task.successors.map((d) => (
                      <li key={`suc-${d.stepId}-${d.type}`}>
                        <button
                          type="button"
                          className="text-left text-[12px] font-medium text-[#1e3a5f] underline-offset-2 hover:underline"
                          onClick={() => onFocusStep?.(d.stepId)}
                        >
                          {d.stepId}
                          {d.name ? ` · ${d.name}` : ""}
                        </button>
                        <span className="ml-1 text-[11px] text-slate-500">{d.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </Section>

        {/* 7. Prérequis */}
        <Section title="Prérequis">
          {task.preconditions.length ? (
            <ul className="list-inside list-disc space-y-0.5 text-[12px] text-slate-700">
              {task.preconditions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun prérequis renseigné</Empty>
          )}
        </Section>

        {/* 8. Mode opératoire */}
        <Section title="Mode opératoire">
          {task.description ? (
            formatOpText(task.description)
          ) : (
            <Empty>Mode opératoire non renseigné</Empty>
          )}
        </Section>

        {/* 9. Moyens / outillage */}
        <Section title="Outillage / engins">
          {task.equipment.length ? (
            <ul className="space-y-0.5 text-[12px] text-slate-700">
              {task.equipment.map((e) => (
                <li key={e.equipment_id}>
                  {e.count}× {e.label}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Non renseigné</Empty>
          )}
        </Section>
        <Section title="Matériaux / consommables">
          {task.supplies.length ? (
            <ul className="space-y-0.5 text-[12px] text-slate-700">
              {task.supplies.map((s) => (
                <li key={s.supply_id}>
                  {(s.count ?? 1)}× {s.label}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Non renseigné</Empty>
          )}
        </Section>

        {/* 10. Contrôles */}
        <Section title="Contrôles">
          {task.controls.length ? (
            <ul className="list-inside list-disc space-y-0.5 text-[12px] text-slate-700">
              {task.controls.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun contrôle renseigné</Empty>
          )}
        </Section>

        {/* 11. Sécurité */}
        <Section title="Sécurité">
          {task.safety.length ? (
            <ul className="list-inside list-disc space-y-0.5 text-[12px] text-slate-700">
              {task.safety.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            <Empty>Aucune consigne de sécurité renseignée</Empty>
          )}
        </Section>

        {/* 12. Montants */}
        <Section title="Montants">
          <Row
            label="Vente HT"
            value={
              task.sellHtSnapshot != null
                ? `${task.sellHtSnapshot.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })} €`
                : "Non renseigné"
            }
          />
          <Row
            label="Déboursé HT"
            value={
              task.costHtSnapshot != null
                ? `${task.costHtSnapshot.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })} €`
                : "Non renseigné"
            }
          />
        </Section>

        {/* 13. Provenance */}
        <Section title="Provenance">
          <Row
            label="Quantité"
            value={
              task.driverTakeoffCode
                ? `Métré ${task.driverTakeoffCode}${
                    task.quantitySnapshot != null
                      ? ` · ${task.quantityDisplay}`
                      : " · absente du planning (à régénérer)"
                  }`
                : task.quantitySnapshot != null
                  ? "Saisie planning"
                  : "Absente"
            }
          />
          <Row
            label="Phase"
            value={
              task.missing.unclassifiedPhase
                ? "Phase à classer"
                : task.phase.source === "structured"
                  ? "Phase issue de structure source"
                  : task.phase.source === "inferred"
                    ? "Phase résolue (inférence)"
                    : "Phase à classer"
            }
          />
          <Row
            label="Durée"
            value={
              task.durationMode === "computed" ||
              task.durationMode === "computed_workload"
                ? "Calculé"
                : "Fixe / manuel"
            }
          />
          <Row
            label="Charge"
            value={
              task.workloadSource === "DERIVED"
                ? "Calculée"
                : task.workloadSource === "PROVIDED"
                  ? "Fournie"
                  : "Absente"
            }
          />
        </Section>

        {task.blockingReason ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-950">
            {task.blockingReason}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
