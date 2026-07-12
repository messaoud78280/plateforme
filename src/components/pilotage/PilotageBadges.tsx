import {
  PILOTAGE_STATUS_COLORS,
  PILOTAGE_STATUS_LABELS,
  PRIORITY_COLORS,
} from "@/lib/pilotage/constants";

export function StatusBadge({ status }: { status: string }) {
  const color =
    PILOTAGE_STATUS_COLORS[status] ??
    PRIORITY_COLORS[status] ??
    statusColorFallback(status);
  const label = PILOTAGE_STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${color}`}>
      {label}
    </span>
  );
}

function statusColorFallback(status: string): string {
  const s = status.toLowerCase();
  if (/(retard|bloqu|refus|expir|manquant|critique|sans validation)/.test(s)) {
    return "bg-red-50 text-red-800 ring-red-200";
  }
  if (/(attente|proche|à préparer|à vérifier|à corriger|surveillance)/.test(s)) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  if (/(valid|termin|conforme|payé|bon pour)/.test(s)) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (/(cours|envoyé|reçu)/.test(s)) {
    return "bg-blue-50 text-blue-800 ring-blue-200";
  }
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-[100px]">
      {label ? <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p> : null}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#1e3a5f] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-0.5 text-xs font-semibold text-slate-700">{pct}%</p>
    </div>
  );
}
