import Link from "next/link";
import {
  HEALTH_BAR,
  HEALTH_COLORS,
  HEALTH_LABELS,
  type HealthLabel,
  type HealthResult,
} from "@/lib/pilotage/health";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";

export function HealthBadge({ label }: { label: HealthLabel | string | null | undefined }) {
  const key = (label ?? "A_SURVEILLER") as HealthLabel;
  const color = HEALTH_COLORS[key] ?? HEALTH_COLORS.A_SURVEILLER;
  const text = HEALTH_LABELS[key] ?? label ?? "—";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${color}`}>
      {text}
    </span>
  );
}

export function HealthPanel({
  health,
  causesHref,
  compact,
}: {
  health: HealthResult;
  causesHref?: string;
  compact?: boolean;
}) {
  return (
    <div className={`pilotage-card flex gap-3 ${compact ? "p-3" : "p-4"}`}>
      <div className={`pilotage-health-bar ${HEALTH_BAR[health.label]}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Santé du chantier</p>
            <div className="mt-1 flex items-center gap-2">
              <HealthBadge label={health.label} />
              <span className="text-lg font-bold text-[#1e3a5f]">{health.score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
          {causesHref ? (
            <Link href={causesHref} className="text-xs font-semibold text-[#1e3a5f] hover:underline">
              Voir les causes
            </Link>
          ) : null}
        </div>
        {!compact ? (
          <ul className="mt-3 space-y-1">
            {health.reasons.map((r) => (
              <li key={r} className="text-xs leading-relaxed text-slate-600">
                · {r}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function PilotageKpi({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number | string;
  href?: string;
  tone?: "ok" | "watch" | "critical" | "neutral";
}) {
  const toneClass =
    tone === "critical"
      ? "text-red-700"
      : tone === "watch"
        ? "text-amber-700"
        : tone === "ok"
          ? "text-emerald-700"
          : "text-slate-900";
  const inner = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="pilotage-kpi block">
        {inner}
      </Link>
    );
  }
  return <div className="pilotage-kpi">{inner}</div>;
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{pct}%</p>
        <p className="text-[10px] text-slate-500">Avancement administratif et documentaire</p>
      </div>
    </div>
  );
}

export function MilestoneTimeline({
  milestones,
}: {
  milestones: {
    id: string;
    title: string;
    status: string;
    plannedAt: Date | string | null;
    sortOrder: number;
  }[];
}) {
  if (milestones.length === 0) {
    return <p className="text-sm text-slate-500">Aucun jalon. Appliquez un modèle ou ajoutez des jalons.</p>;
  }
  const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <ol className="relative space-y-0 border-l-2 border-slate-200 pl-4">
      {sorted.map((m) => {
        const done = m.status === "Atteint";
        const blocked = m.status === "Bloqué";
        const current = m.status === "En cours" || m.status === "Prêt";
        return (
          <li key={m.id} className="relative pb-5 last:pb-0">
            <span
              className={`absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full ring-2 ring-white ${
                blocked ? "bg-red-500" : done ? "bg-emerald-500" : current ? "bg-[#1e3a5f]" : "bg-slate-300"
              }`}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className={`text-sm font-semibold ${blocked ? "text-red-800" : "text-slate-900"}`}>{m.title}</p>
              <span className="text-[11px] font-medium text-slate-500">{m.status}</span>
            </div>
            {m.plannedAt ? (
              <p className="text-xs text-slate-500">
                Prévu : {new Date(m.plannedAt).toLocaleDateString("fr-FR")}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export { PILOTAGE_LIST_PATH };
