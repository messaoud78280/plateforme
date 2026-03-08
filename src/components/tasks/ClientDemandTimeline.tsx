"use client";

import type { TaskStatus } from "@/types";

const STEPS = [
  { key: "received", label: "Demande reçue" },
  { key: "analysis", label: "Analyse en cours" },
  { key: "treatment", label: "Traitement" },
  { key: "delivered", label: "Livrable envoyé" },
  { key: "done", label: "Terminée" },
] as const;

function stepIndex(status: TaskStatus, completedAt: Date | null, validatedAt: Date | null): number {
  if (status === "NOUVEAU" || status === "EN_ATTENTE") return 0;
  if (["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO"].includes(status)) return 2;
  if (status === "A_VALIDER") return 2;
  if (status === "COMPLETE") {
    if (validatedAt) return 4;
    if (completedAt) return 3;
    return 3;
  }
  return 0;
}

interface ClientDemandTimelineProps {
  status: TaskStatus;
  createdAt: Date;
  completedAt: Date | null;
  validatedAt: Date | null;
}

export function ClientDemandTimeline({
  status,
  createdAt,
  completedAt,
  validatedAt,
}: ClientDemandTimelineProps) {
  const current = stepIndex(status, completedAt, validatedAt);

  return (
    <div className="flow-root">
      <ul className="-mb-8 flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap">
        {STEPS.map((step, i) => {
          const idx = i;
          const isDone = idx <= current;
          const isCurrent = idx === current;
          return (
            <li
              key={step.key}
              className={`relative flex shrink-0 flex-col items-center text-center ${
                idx < STEPS.length - 1 ? "flex-1 sm:flex-initial" : ""
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-medium transition ${
                  isDone
                    ? "border-[#1d4ed8] bg-[#1d4ed8] text-white"
                    : "border-slate-300 bg-white text-slate-400"
                } ${isCurrent ? "ring-2 ring-[#1d4ed8] ring-offset-2" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? (
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <p
                className={`mt-2 text-xs font-medium sm:text-sm ${
                  isDone ? "text-slate-800" : "text-slate-500"
                }`}
              >
                {step.label}
              </p>
              {idx === 0 && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(createdAt).toLocaleDateString("fr-FR")}
                </p>
              )}
              {idx === 4 && (completedAt || validatedAt) && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {(validatedAt ? new Date(validatedAt) : completedAt ? new Date(completedAt) : null)?.toLocaleDateString("fr-FR")}
                </p>
              )}
              {idx < STEPS.length - 1 && (
                <div
                  className={`absolute left-1/2 top-4 hidden h-0.5 w-full sm:block ${
                    isDone ? "bg-[#1d4ed8]" : "bg-slate-200"
                  }`}
                  style={{ transform: "translate(50%, 0)" }}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
