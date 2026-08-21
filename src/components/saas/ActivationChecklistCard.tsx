"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivationChecklistItem } from "@/lib/organization/activation";
import { cn } from "@/lib/cn";

export function ActivationChecklistCard({
  percent,
  items,
  trialDaysRemaining,
  companyName,
  compact,
}: {
  percent: number;
  items: ActivationChecklistItem[];
  trialDaysRemaining?: number | null;
  companyName?: string | null;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-bework-navy/10 bg-white shadow-[var(--cc-shadow)]",
        compact ? "p-4" : "p-5 sm:p-6",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-bework-navy">
            Bien démarrer avec BeWork
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            {companyName ? `${companyName} — ` : ""}
            espace configuré à {percent} %
            {trialDaysRemaining != null && trialDaysRemaining > 0
              ? ` · ${trialDaysRemaining} j d’essai restants`
              : ""}
          </p>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-bework-accent transition-all"
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            {item.href && !item.done ? (
              <Link
                href={item.href}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-[13px] transition hover:bg-bework-soft-navy/50"
              >
                <CheckDot done={false} />
                <span className="font-medium text-bework-ink">{item.label}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 px-2 py-1.5 text-[13px]">
                <CheckDot done={item.done} />
                <span
                  className={cn(
                    "font-medium",
                    item.done ? "text-slate-400 line-through" : "text-bework-ink",
                  )}
                >
                  {item.label}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CheckDot({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
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
