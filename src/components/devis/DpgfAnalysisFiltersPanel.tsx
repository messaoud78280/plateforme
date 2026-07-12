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

const fieldClass =
  "h-10 w-full rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] bg-white px-3 text-sm text-bework-ink focus:border-bework-navy focus:outline-none focus:ring-2 focus:ring-bework-navy/20";

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
    <section className="cc-card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bework-navy/10 bg-gradient-to-r from-bework-navy/[0.06] via-transparent to-bework-cyan/[0.04] px-5 py-4">
        <div>
          <h2 className="font-heading text-base font-bold text-bework-ink">Filtres</h2>
          <p className="mt-0.5 text-sm text-bework-muted">
            {resultCount.toLocaleString("fr-FR")} fiche{resultCount > 1 ? "s" : ""} affichée
            {resultCount > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/devis/analyse-dpgf" className="btn-cc-secondary !px-3 !py-1.5 text-xs">
          Réinitialiser
        </Link>
      </div>

      <form method="get" className="space-y-5 p-5">
        <div>
          <label htmlFor="filter-q" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-bework-muted">
            Rechercher
          </label>
          <input
            id="filter-q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Code, désignation, famille, mot-clé…"
            className={`${fieldClass} h-11 px-4`}
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

        <details
          className="overflow-hidden rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] bg-bework-navy-soft/30"
          open={hasAdvanced}
        >
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-bework-navy marker:content-none [&::-webkit-details-marker]:hidden">
            + Filtres complémentaires (unité, niveau, source, type)
          </summary>
          <div className="grid gap-3 border-t border-[color:var(--cc-chrome-border)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="flex flex-wrap gap-2 border-t border-[color:var(--cc-chrome-border)] pt-4">
          <button type="submit" className="btn-cc-primary">
            Appliquer les filtres
          </button>
          <Link href="/dashboard/devis/analyse-dpgf" className="btn-cc-secondary">
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
      <label htmlFor={name} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-bework-muted">
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} className={fieldClass}>
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
    <label className="inline-flex cursor-pointer select-none items-center rounded-lg border border-[color:var(--cc-chrome-border)] bg-white px-3 py-1.5 text-xs font-semibold text-bework-ink/80 transition has-[:checked]:border-bework-navy has-[:checked]:bg-bework-navy has-[:checked]:text-white">
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} className="sr-only" />
      {label}
    </label>
  );
}
