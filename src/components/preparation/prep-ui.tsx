"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  DEMO_WATERMARK,
  NATURE_LABELS,
  PROVENANCE_LABELS,
  ROLE_LABELS,
  type LineNature,
  type LineRole,
  type StoredProvenance,
} from "@/lib/preparation/types";
import { formatQty } from "@/lib/preparation/units";

const PROVENANCE_TONE: Record<StoredProvenance | "CALCULE", string> = {
  RELEVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  RELEVE_A_VERIFIER: "bg-amber-50 text-amber-800 ring-amber-200",
  HYPOTHESE: "bg-violet-50 text-violet-800 ring-violet-200",
  SAISIE_MANUELLE: "bg-sky-50 text-sky-800 ring-sky-200",
  CALCULE: "bg-slate-50 text-slate-700 ring-slate-200",
};

export function Chip({ className, children, title }: { className?: string; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProvenanceBadge({ provenance }: { provenance: StoredProvenance | "CALCULE" | null }) {
  if (!provenance) return <Chip className="bg-slate-50 text-slate-500 ring-slate-200">Non renseigné</Chip>;
  return <Chip className={PROVENANCE_TONE[provenance]}>{PROVENANCE_LABELS[provenance]}</Chip>;
}

export function RoleBadge({ role }: { role: LineRole }) {
  const tone =
    role === "quote"
      ? "bg-[#1e3a5f]/5 text-[#1e3a5f] ring-[#1e3a5f]/15"
      : role === "indicator"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : "bg-cyan-50 text-cyan-800 ring-cyan-200";
  return (
    <Chip
      className={tone}
      title={role === "indicator" ? "Indicateur technique — jamais une quantité facturable" : undefined}
    >
      {ROLE_LABELS[role]}
    </Chip>
  );
}

export function NatureBadge({ nature }: { nature: LineNature | null }) {
  if (!nature) return null;
  return <Chip className="bg-white text-slate-600 ring-slate-200">{NATURE_LABELS[nature]}</Chip>;
}

export type LineStatus = "error" | "indicator" | "validated" | "revalidate" | "theoretical";

export function StatusBadge({ status, validated }: { status: LineStatus; validated?: number | null }) {
  switch (status) {
    case "error":
      return <Chip className="bg-red-50 text-red-700 ring-red-200">Erreur de calcul</Chip>;
    case "indicator":
      return <Chip className="bg-slate-100 text-slate-600 ring-slate-200">Indicateur</Chip>;
    case "validated":
      return <Chip className="bg-emerald-50 text-emerald-800 ring-emerald-200">Validée</Chip>;
    case "revalidate":
      return (
        <Chip
          className="bg-amber-50 text-amber-800 ring-amber-200"
          title={`Quantité validée : ${formatQty(validated ?? null)} — les paramètres ont changé depuis`}
        >
          À revalider
        </Chip>
      );
    default:
      return <Chip className="bg-white text-slate-600 ring-slate-200">Théorique</Chip>;
  }
}

export function DemoBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900",
        className,
      )}
    >
      <span className="font-semibold tracking-wide">{DEMO_WATERMARK}</span>
      <span className="ml-2 text-amber-800">
        Dossier fictif de formation — ne pas utiliser pour un chiffrage ou un engagement réel.
      </span>
    </div>
  );
}

export function IssueList({
  issues,
  max = 30,
}: {
  issues: { path: string; message: string; severity: "error" | "warn" }[];
  max?: number;
}) {
  if (!issues.length) return null;
  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  return (
    <div className="space-y-2">
      {errors.length ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
          <p className="font-semibold">{errors.length} erreur(s) bloquante(s)</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {errors.slice(0, max).map((i, idx) => (
              <li key={idx}>
                <span className="font-mono text-[11px] text-red-600">{i.path}</span> — {i.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {warns.length ? (
        <details className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <summary className="cursor-pointer font-semibold">{warns.length} point(s) à vérifier</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {warns.slice(0, max).map((i, idx) => (
              <li key={idx}>
                <span className="font-mono text-[11px] text-amber-700">{i.path}</span> — {i.message}
              </li>
            ))}
            {warns.length > max ? <li>… et {warns.length - max} autre(s)</li> : null}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

const IDENT_RE = /[A-Z][A-Z0-9]*-[0-9]{1,4}|[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*/g;

/** Formule avec les valeurs courantes substituées (affichage uniquement). */
export function substituteFormula(formula: string, valueOf: (ref: string) => number | null | undefined): string {
  return formula.replace(IDENT_RE, (m, offset: number) => {
    const rest = formula.slice(offset + m.length).trimStart();
    if (rest.startsWith("(")) return m;
    const v = valueOf(m);
    return v === null || v === undefined ? m : formatQty(v, 4);
  });
}
