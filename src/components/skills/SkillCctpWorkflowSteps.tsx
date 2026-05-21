"use client";

import { CCTP_SIX_STEPS } from "@/content/cctp-methodology";
import { CheckCircle2 } from "lucide-react";

type Props = {
  activeStep?: number;
};

export function SkillCctpWorkflowSteps({ activeStep = 2 }: Props) {
  return (
    <nav
      className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm"
      aria-label="Étapes de rédaction CCTP"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Parcours conducteur de travaux</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CCTP_SIX_STEPS.map((s) => {
          const active = s.step === activeStep;
          const done = s.step < activeStep;
          return (
            <li
              key={s.step}
              className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${
                active
                  ? "border-[#2563eb]/40 bg-[#eff6ff] text-[#1e40af]"
                  : done
                    ? "border-emerald-200/80 bg-emerald-50/50 text-slate-700"
                    : "border-slate-100 bg-slate-50/50 text-slate-600"
              }`}
            >
              <span className="mt-0.5 shrink-0" aria-hidden>
                {done ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${
                      active ? "bg-[#2563eb] text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {s.step}
                  </span>
                )}
              </span>
              <span>
                <span className="font-semibold">{s.title}</span>
                <span className="mt-0.5 block text-xs leading-snug opacity-90">{s.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
