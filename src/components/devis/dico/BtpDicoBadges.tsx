import { categoryLabel } from "@/lib/btp-dico/labels";
import { lotLabelFromCode } from "@/lib/btp-dico/lots";

export function LevelBadge({ level }: { level: string }) {
  const cls =
    level === "confirmé"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : level === "intermédiaire"
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
      {level}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "validé"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "brouillon"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : "bg-amber-50 text-amber-800 ring-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
      {status}
    </span>
  );
}

export function LotBadge({ lotCode }: { lotCode: string | null }) {
  if (!lotCode) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
        Sans lot
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#eef2f7] px-2 py-0.5 text-[11px] font-semibold text-[#1e3a5f] ring-1 ring-[#1e3a5f]/15">
      {lotLabelFromCode(lotCode)}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string | null }) {
  const label = categoryLabel(category);
  if (!label) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
      {label}
    </span>
  );
}
