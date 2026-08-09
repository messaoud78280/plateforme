"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { activateContractualFollowUp } from "@/app/dashboard/pilotage-travaux/actions";
import { projectContractuelSectionHref } from "@/lib/pilotage/project-links";

export type ContractuelSummary = {
  pilotageId: string | null;
  openBlockers: number;
  criticalBlockers: number;
  openObligations: number;
  visasPending: number;
  doeIncomplete: number;
  doeTotal: number;
  openActions: number;
};

type Props = {
  projectId: string;
  projectTitle: string;
  canEdit: boolean;
  summary: ContractuelSummary | null;
};

export function ChantierContractuelPanel({
  projectId,
  projectTitle,
  canEdit,
  summary,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const active = Boolean(summary?.pilotageId);

  function activate() {
    setError(null);
    startTransition(async () => {
      const res = await activateContractualFollowUp(projectId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (!active) {
    return (
      <div className="rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Extension chantier
        </p>
        <h2 className="mt-1 text-lg font-semibold text-bework-ink">Suivi contractuel</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-bework-muted">
          Non activé. Obligations, visas, DOE contractuel et blocages marché restent optionnels —
          le chantier « {projectTitle} » reste le seul dossier.
        </p>
        <p className="mt-2 text-[12.5px] text-slate-500">
          GED / Documents = fichiers. Ce suivi = complétude et conformité contractuelle.
        </p>
        {canEdit ? (
          <button
            type="button"
            disabled={pending}
            onClick={activate}
            className="btn-cc-primary mt-4 disabled:opacity-60"
          >
            {pending ? "Activation…" : "Activer le suivi contractuel"}
          </button>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Activation réservée à l’équipe interne.</p>
        )}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  const s = summary!;
  const cards = [
    {
      label: "Blocages ouverts",
      value: s.openBlockers,
      hint: s.criticalBlockers > 0 ? `${s.criticalBlockers} critique(s)` : null,
      href: projectContractuelSectionHref(projectId, "blocages"),
      watch: s.openBlockers > 0,
    },
    {
      label: "Obligations",
      value: s.openObligations,
      href: projectContractuelSectionHref(projectId, "a-traiter"),
      watch: s.openObligations > 0,
    },
    {
      label: "Visas en attente",
      value: s.visasPending,
      href: projectContractuelSectionHref(projectId, "plans"),
      watch: s.visasPending > 0,
    },
    {
      label: "DOE",
      value: s.doeTotal > 0 ? `${s.doeTotal - s.doeIncomplete}/${s.doeTotal}` : "—",
      hint: s.doeIncomplete > 0 ? `${s.doeIncomplete} à compléter` : null,
      href: projectContractuelSectionHref(projectId, "doe"),
      watch: s.doeIncomplete > 0,
    },
    {
      label: "Échéances contractuelles",
      value: s.openActions,
      href: projectContractuelSectionHref(projectId, "a-traiter"),
      watch: s.openActions > 0,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Extension de {projectTitle}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-bework-ink">Suivi contractuel</h2>
        <p className="mt-1 text-sm text-bework-muted">
          Obligations, visas, DOE et blocages marché — rattachés à ce chantier, pas un second
          dossier.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={`rounded-xl border px-3 py-3 transition hover:border-[#1e3a5f]/25 hover:bg-[#eef2f7]/50 ${
                c.watch ? "border-amber-200 bg-amber-50/40" : "border-slate-100 bg-slate-50/50"
              }`}
            >
              <p className="text-[11px] font-medium text-slate-500">{c.label}</p>
              <p className="mt-0.5 text-xl font-semibold text-bework-ink">{c.value}</p>
              {c.hint ? <p className="text-[11px] font-medium text-amber-800">{c.hint}</p> : null}
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={projectContractuelSectionHref(projectId, "a-traiter")}
            className="btn-cc-secondary"
          >
            Ouvrir le détail contractuel
          </Link>
        </div>
      </div>
    </div>
  );
}
