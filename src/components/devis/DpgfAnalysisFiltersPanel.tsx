"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { WORK_ITEM_STATUS_LABELS, WORK_ITEM_UNITS } from "@/lib/be-work-devis-labels";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_SOURCE_LABELS,
} from "@/lib/dpgf-analysis/labels";
import type { DpgfAnalysisFilterParams } from "@/lib/dpgf-analysis/types";
import type { DpgfAnalysisViewMode } from "@/lib/dpgf-analysis/list-order";

type LotOption = { lot: string; label: string };
type FamilyOption = { familyName: string };
type TypeOption = { ouvrageType: string };
type TradeOption = { code: string; label: string };

type Props = {
  filters: DpgfAnalysisFilterParams;
  viewMode: DpgfAnalysisViewMode;
  lotOptions: LotOption[];
  familyOptions: FamilyOption[];
  typeOptions: TypeOption[];
  tradeOptions: TradeOption[];
  resultCount: number;
};

const CHIP_FILTERS: {
  key: keyof Pick<
    DpgfAnalysisFilterParams,
    "hasModeOperatoire" | "hasVigilance" | "hasQuestions" | "onlyToVerify" | "onlyIncomplete"
  >;
  param: string;
  label: string;
}[] = [
  { key: "hasModeOperatoire", param: "hasMode", label: "Mode opératoire renseigné" },
  { key: "hasVigilance", param: "hasVigilance", label: "Points de vigilance" },
  { key: "hasQuestions", param: "hasQuestions", label: "Questions à poser" },
  { key: "onlyToVerify", param: "onlyToVerify", label: "Fiches à vérifier" },
  { key: "onlyIncomplete", param: "onlyIncomplete", label: "Fiches incomplètes" },
];

export function DpgfAnalysisFiltersPanel({
  filters,
  viewMode,
  lotOptions,
  familyOptions,
  typeOptions,
  tradeOptions,
  resultCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(filters.ouvrageType || filters.unit || filters.source || filters.trade),
  );
  const [query, setQuery] = useState(filters.q ?? "");

  const buildUrl = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") params.delete(k);
        else params.set(k, v);
      }
      const qs = params.toString();
      return qs ? `/dashboard/devis/analyse-dpgf?${qs}` : "/dashboard/devis/analyse-dpgf";
    },
    [searchParams],
  );

  const navigate = useCallback(
    (patch: Record<string, string | undefined>) => {
      startTransition(() => router.push(buildUrl(patch)));
    },
    [router, buildUrl, startTransition],
  );

  const activeChips = useMemo(() => {
    const chips: { param: string; label: string; value?: string }[] = [];
    if (filters.q?.trim()) chips.push({ param: "q", label: `Recherche : ${filters.q.trim()}` });
    if (filters.lot) {
      const lotLabel = lotOptions.find((o) => o.lot === filters.lot)?.label ?? filters.lot;
      chips.push({ param: "lot", label: `Lot : ${lotLabel}` });
    }
    if (filters.family) chips.push({ param: "family", label: `Famille : ${filters.family}` });
    if (filters.trade) chips.push({ param: "trade", label: `Corps de métier : ${filters.trade}` });
    if (filters.status) chips.push({ param: "status", label: `Statut : ${WORK_ITEM_STATUS_LABELS[filters.status]}` });
    if (filters.level) chips.push({ param: "level", label: `Niveau : ${DPGF_ANALYSIS_LEVEL_LABELS[filters.level]}` });
    if (filters.unit) chips.push({ param: "unit", label: `Unité : ${filters.unit}` });
    if (filters.source) chips.push({ param: "source", label: `Source : ${DPGF_ANALYSIS_SOURCE_LABELS[filters.source]}` });
    if (filters.ouvrageType) chips.push({ param: "ouvrageType", label: `Type : ${filters.ouvrageType}` });
    for (const chip of CHIP_FILTERS) {
      if (filters[chip.key]) chips.push({ param: chip.param, label: chip.label });
    }
    if (viewMode !== "families") chips.push({ param: "view", label: `Vue : ${viewLabel(viewMode)}` });
    return chips;
  }, [filters, lotOptions, viewMode]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: query.trim() || undefined });
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-heading text-base font-bold text-slate-900">Rechercher et filtrer les fiches</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {pending ? "Mise à jour…" : `${resultCount.toLocaleString("fr-FR")} fiche${resultCount > 1 ? "s" : ""} affichée${resultCount > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/devis/analyse-dpgf"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Réinitialiser
        </Link>
      </div>

      <div className="space-y-4 px-5 py-4">
        <form onSubmit={submitSearch} className="relative">
          <label htmlFor="dpgf-search" className="sr-only">
            Rechercher
          </label>
          <input
            id="dpgf-search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un code, une désignation, une famille, un mot technique…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-4 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a5f]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
          />
          <button
            type="submit"
            disabled={pending}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
          >
            Rechercher
          </button>
        </form>

        {activeChips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeChips.map((chip) => (
              <button
                key={`${chip.param}-${chip.label}`}
                type="button"
                onClick={() => navigate({ [chip.param]: undefined })}
                className="inline-flex items-center gap-1 rounded-full border border-[#1e3a5f]/15 bg-[#1e3a5f]/5 px-2.5 py-1 text-[11px] font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
              >
                {chip.label}
                <span aria-hidden className="text-[#1e3a5f]/60">×</span>
              </button>
            ))}
          </div>
        ) : null}

        <form
          method="get"
          className="space-y-4"
          onChange={(e) => {
            const form = e.currentTarget;
            if (form.id !== "dpgf-primary-filters") return;
            form.requestSubmit();
          }}
        >
          <input type="hidden" name="q" value={filters.q ?? ""} />
          <input type="hidden" name="view" value={viewMode} />
          {CHIP_FILTERS.filter((c) => filters[c.key]).map((c) => (
            <input key={c.param} type="hidden" name={c.param} value="1" />
          ))}

          <div id="dpgf-primary-filters" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect name="lot" label="Lot" defaultValue={filters.lot ?? ""} options={[
              { value: "", label: "Tous les lots" },
              ...lotOptions.map((o) => ({ value: o.lot, label: o.label })),
            ]} />
            <FilterSelect name="family" label="Famille" defaultValue={filters.family ?? ""} options={[
              { value: "", label: "Toutes les familles" },
              ...familyOptions.map((o) => ({ value: o.familyName, label: o.familyName })),
            ]} />
            <FilterSelect name="trade" label="Corps de métier" defaultValue={filters.trade ?? ""} options={[
              { value: "", label: "Tous corps de métier" },
              ...tradeOptions.map((o) => ({ value: o.code, label: `${o.code} — ${o.label}` })),
            ]} />
            <FilterSelect name="status" label="Statut" defaultValue={filters.status ?? ""} options={[
              { value: "", label: "Tous statuts" },
              ...Object.entries(WORK_ITEM_STATUS_LABELS)
                .filter(([k]) => k !== "archive")
                .map(([k, v]) => ({ value: k, label: v })),
            ]} />
            <FilterSelect name="level" label="Niveau" defaultValue={filters.level ?? ""} options={[
              { value: "", label: "Tous niveaux" },
              ...Object.entries(DPGF_ANALYSIS_LEVEL_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]} />
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-[#1e3a5f] hover:underline"
          >
            <span className={`transition ${advancedOpen ? "rotate-90" : ""}`}>›</span>
            Filtres avancés
          </button>

          {advancedOpen ? (
            <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <FilterSelect name="unit" label="Unité" defaultValue={filters.unit ?? ""} options={[
                { value: "", label: "Toutes unités" },
                ...WORK_ITEM_UNITS.map((u) => ({ value: u, label: u })),
              ]} />
              <FilterSelect name="source" label="Source" defaultValue={filters.source ?? ""} options={[
                { value: "", label: "Toutes sources" },
                ...Object.entries(DPGF_ANALYSIS_SOURCE_LABELS).map(([k, v]) => ({ value: k, label: v })),
              ]} />
              <FilterSelect name="ouvrageType" label="Type d'ouvrage" defaultValue={filters.ouvrageType ?? ""} options={[
                { value: "", label: "Tous types" },
                ...typeOptions.map((o) => ({ value: o.ouvrageType, label: o.ouvrageType })),
              ]} />
            </div>
          ) : (
            <>
              {filters.unit ? <input type="hidden" name="unit" value={filters.unit} /> : null}
              {filters.source ? <input type="hidden" name="source" value={filters.source} /> : null}
              {filters.ouvrageType ? <input type="hidden" name="ouvrageType" value={filters.ouvrageType} /> : null}
            </>
          )}
        </form>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {CHIP_FILTERS.map((chip) => {
            const active = Boolean(filters[chip.key]);
            return (
              <button
                key={chip.param}
                type="button"
                disabled={pending}
                onClick={() => navigate({ [chip.param]: active ? undefined : "1" })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-[#1e3a5f] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#1e3a5f]/30 hover:text-[#1e3a5f]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <ViewModeToggle viewMode={viewMode} pending={pending} buildUrl={buildUrl} />
      </div>
    </section>
  );
}

function FilterSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#1e3a5f]/40 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
      >
        {options.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ViewModeToggle({
  viewMode,
  pending,
  buildUrl,
}: {
  viewMode: DpgfAnalysisViewMode;
  pending: boolean;
  buildUrl: (patch: Record<string, string | undefined>) => string;
}) {
  const modes: { id: DpgfAnalysisViewMode; label: string }[] = [
    { id: "families", label: "Vue par familles" },
    { id: "dpgf", label: "Vue ordre DPGF" },
    { id: "table", label: "Vue tableau complet" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Affichage</span>
      {modes.map((m) => (
        <Link
          key={m.id}
          href={buildUrl({ view: m.id === "families" ? undefined : m.id })}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === m.id
              ? "bg-slate-900 text-white"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          } ${pending ? "pointer-events-none opacity-50" : ""}`}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}

function viewLabel(mode: DpgfAnalysisViewMode): string {
  if (mode === "dpgf") return "Ordre DPGF";
  if (mode === "table") return "Tableau complet";
  return "Par familles";
}
