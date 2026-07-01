import Link from "next/link";
import { WORK_ITEM_STATUS_LABELS, WORK_ITEM_UNITS } from "@/lib/be-work-devis-labels";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_SOURCE_LABELS,
} from "@/lib/dpgf-analysis/labels";
import type { DpgfLotOption } from "@/lib/dpgf-analysis/search";

type TradeOption = { code: string; label: string };

type Props = {
  sp: Record<string, string | undefined>;
  resultCount: number;
  lotOptions: DpgfLotOption[];
  familyOptions: { familyName: string }[];
  typeOptions: { ouvrageType: string }[];
  tradeOptions: TradeOption[];
};

const CHECKBOX_FILTERS = [
  { name: "hasMode", label: "Mode opératoire renseigné" },
  { name: "hasVigilance", label: "Points de vigilance" },
  { name: "hasQuestions", label: "Questions à poser" },
] as const;

export function DpgfAnalysisFiltersPanel({
  sp,
  resultCount,
  lotOptions,
  familyOptions,
  typeOptions,
  tradeOptions,
}: Props) {
  const hasAdvanced = Boolean(sp.unit || sp.level || sp.source || sp.ouvrageType);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-heading text-base font-bold text-slate-900">Filtres</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {resultCount.toLocaleString("fr-FR")} fiche{resultCount > 1 ? "s" : ""} correspondante{resultCount > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/devis/analyse-dpgf"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Réinitialiser
        </Link>
      </div>

      <form method="get" className="space-y-4 px-5 py-4">
        <div>
          <label htmlFor="filter-q" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Recherche
          </label>
          <input
            id="filter-q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Code, désignation, famille, mot-clé…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a5f]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            name="lot"
            label="Lot"
            defaultValue={sp.lot ?? ""}
            options={[{ value: "", label: "Tous les lots" }, ...lotOptions.map((o) => ({ value: o.lot, label: o.label }))]}
          />
          <FilterSelect
            name="family"
            label="Famille"
            defaultValue={sp.family ?? ""}
            options={[
              { value: "", label: "Toutes les familles" },
              ...familyOptions.map((o) => ({ value: o.familyName, label: o.familyName })),
            ]}
          />
          <FilterSelect
            name="trade"
            label="Corps de métier"
            defaultValue={sp.trade ?? ""}
            options={[
              { value: "", label: "Tous corps de métier" },
              ...tradeOptions.map((o) => ({ value: o.code, label: o.label })),
            ]}
          />
          <FilterSelect
            name="status"
            label="Statut"
            defaultValue={sp.status ?? ""}
            options={[
              { value: "", label: "Tous statuts" },
              ...Object.entries(WORK_ITEM_STATUS_LABELS)
                .filter(([k]) => k !== "archive")
                .map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
        </div>

        <details className="group rounded-xl border border-slate-100 bg-slate-50/40" open={hasAdvanced}>
          <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-[#1e3a5f] marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="transition group-open:rotate-90">›</span>
              Filtres complémentaires
            </span>
          </summary>
          <div className="grid gap-3 border-t border-slate-100 px-4 pb-4 pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              name="ouvrageType"
              label="Type d'ouvrage"
              defaultValue={sp.ouvrageType ?? ""}
              options={[
                { value: "", label: "Tous types d'ouvrage" },
                ...typeOptions.map((o) => ({ value: o.ouvrageType, label: o.ouvrageType })),
              ]}
            />
            <FilterSelect
              name="unit"
              label="Unité"
              defaultValue={sp.unit ?? ""}
              options={[{ value: "", label: "Toutes unités" }, ...WORK_ITEM_UNITS.map((u) => ({ value: u, label: u }))]}
            />
            <FilterSelect
              name="level"
              label="Niveau"
              defaultValue={sp.level ?? ""}
              options={[
                { value: "", label: "Tous niveaux" },
                ...Object.entries(DPGF_ANALYSIS_LEVEL_LABELS).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
            <FilterSelect
              name="source"
              label="Source"
              defaultValue={sp.source ?? ""}
              options={[
                { value: "", label: "Toutes sources" },
                ...Object.entries(DPGF_ANALYSIS_SOURCE_LABELS).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
          </div>
        </details>

        <div className="flex flex-wrap gap-2">
          {CHECKBOX_FILTERS.map(({ name, label }) => (
            <CheckboxChip key={name} name={name} label={label} defaultChecked={sp[name] === "1"} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="rounded-xl bg-[#1e3a5f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
          >
            Filtrer
          </button>
          <Link
            href="/dashboard/devis/analyse-dpgf"
            className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tout afficher
          </Link>
        </div>
      </form>
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

function CheckboxChip({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 has-[:checked]:border-[#1e3a5f]/30 has-[:checked]:bg-[#1e3a5f]/5 has-[:checked]:text-[#1e3a5f]">
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} className="sr-only" />
      {label}
    </label>
  );
}
