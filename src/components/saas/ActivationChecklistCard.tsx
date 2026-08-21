"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ActivationChecklistItem,
  ActivationMaturity,
} from "@/lib/organization/activation";
import { cn } from "@/lib/cn";

export function ActivationChecklistCard({
  percent,
  items,
  companyName,
  maturity = "new",
}: {
  percent: number;
  items: ActivationChecklistItem[];
  companyName?: string | null;
  maturity?: ActivationMaturity;
}) {
  if (maturity === "active") {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bework-navy/10 bg-white px-4 py-3 shadow-[var(--cc-shadow)]">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-bework-navy">
            Configuration BeWork — {percent} %
          </p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {companyName
              ? `Encore quelques étapes pour ${companyName}.`
              : "Encore quelques étapes pour finaliser votre espace."}
          </p>
        </div>
        <Link
          href="/dashboard/bienvenue"
          className="btn-cc-primary shrink-0 !text-xs sm:!text-sm"
        >
          Terminer la configuration
        </Link>
      </section>
    );
  }

  const compact = maturity === "building";
  const pending = items.filter((i) => !i.done);
  const shown = compact ? pending.slice(0, 4) : items;

  return (
    <section
      className={cn(
        "rounded-2xl border border-bework-navy/10 bg-white shadow-[var(--cc-shadow)]",
        compact ? "p-4" : "p-4 sm:p-5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="text-[15px] font-semibold text-bework-navy">
              Bien démarrer avec BeWork
            </h2>
            <span
              className="text-[14px] font-bold tabular-nums text-bework-accent"
              aria-label={`Configuration à ${percent} pour cent`}
            >
              {percent} %
            </span>
          </div>
          <p className="mt-1 text-[13px] text-slate-500">
            Configuration de votre espace
            {companyName ? ` · ${companyName}` : ""}.
            {compact
              ? " Continuez les étapes restantes."
              : " Configurez votre espace en quelques étapes simples."}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression de configuration"
        >
          <div
            className="h-full rounded-full bg-bework-accent transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-slate-500">
          {percent} %
        </span>
      </div>

      <ul className={cn("mt-4", compact ? "space-y-1.5" : "space-y-2")}>
        {shown.map((item) => (
          <ChecklistRow key={item.id} item={item} compact={compact} />
        ))}
      </ul>

      {compact && pending.length > shown.length ? (
        <Link
          href="/dashboard/bienvenue"
          className="mt-3 inline-block text-[12px] font-semibold text-bework-accent hover:underline"
        >
          Voir toutes les étapes →
        </Link>
      ) : null}
    </section>
  );
}

function ChecklistRow({
  item,
  compact,
}: {
  item: ActivationChecklistItem;
  compact: boolean;
}) {
  const statusLabel = item.done ? "Terminé" : "À faire";

  if (item.done) {
    return (
      <li className="flex items-start gap-2.5 rounded-xl px-2 py-1.5 text-[13px]">
        <CheckDot done />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-400 line-through">{item.label}</p>
          <span className="sr-only">{statusLabel}</span>
        </div>
      </li>
    );
  }

  if (!item.href) {
    return (
      <li className="flex items-start gap-2.5 px-2 py-1.5 text-[13px]">
        <CheckDot done={false} />
        <span className="font-medium text-bework-ink">{item.label}</span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className="group flex items-start gap-2.5 rounded-xl px-2 py-2 text-[13px] transition hover:bg-bework-soft-navy/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bework-accent/40"
      >
        <CheckDot done={false} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-bework-ink">{item.label}</p>
          {!compact && item.description ? (
            <p className="mt-0.5 text-[12px] leading-snug text-slate-500">
              {item.description}
            </p>
          ) : null}
          <span className="sr-only">{statusLabel}</span>
        </div>
        <span className="shrink-0 self-center text-[12px] font-semibold text-bework-accent opacity-90 group-hover:underline">
          {item.ctaLabel} →
        </span>
      </Link>
    </li>
  );
}

function CheckDot({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        done ? "bg-bework-ok/15 text-bework-ok" : "bg-slate-100 text-slate-400",
      )}
      aria-hidden
    >
      {done ? "✓" : "○"}
    </span>
  );
}

export function OnboardingSkipBar({
  onSkip,
}: {
  onSkip?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => {
          onSkip?.();
          router.push("/dashboard");
        }}
        className="text-[13px] font-medium text-slate-500 hover:text-bework-navy"
      >
        Continuer plus tard
      </button>
      <Link href="/dashboard" className="btn-cc-primary text-[13px]">
        Accéder à mon espace
      </Link>
    </div>
  );
}
