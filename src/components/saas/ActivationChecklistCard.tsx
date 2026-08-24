"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ActivationChecklistItem,
  ActivationMaturity,
} from "@/lib/organization/activation";
import { cn } from "@/lib/cn";

const COLLAPSE_PREFIX = "bework-onboarding-collapsed:";

/** Checklist d’aide facultative — compacte, repliable, jamais bloquante. */
export function ActivationChecklistCard({
  percent,
  items,
  companyName,
  maturity = "new",
  organizationId,
}: {
  percent: number;
  items: ActivationChecklistItem[];
  companyName?: string | null;
  maturity?: ActivationMaturity;
  organizationId?: string | null;
}) {
  const storageKey = organizationId
    ? `${COLLAPSE_PREFIX}${organizationId}`
    : null;
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setReady(true);
      return;
    }
    try {
      setCollapsed(localStorage.getItem(storageKey) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [storageKey]);

  function persistCollapsed(next: boolean) {
    setCollapsed(next);
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  // Mode « active » : bandeau minimal
  if (maturity === "active" && !collapsed) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bework-navy/10 bg-white px-4 py-3 shadow-[var(--cc-shadow)]">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-bework-navy">
            Bien démarrer — {percent} %
          </p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Guide facultatif
            {companyName ? ` · ${companyName}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/bienvenue"
            className="rounded-full border border-bework-navy/15 px-3 py-1.5 text-[12px] font-semibold text-bework-navy hover:bg-slate-50"
          >
            Voir les étapes
          </Link>
          <button
            type="button"
            onClick={() => persistCollapsed(true)}
            className="text-[12px] font-medium text-slate-500 hover:text-bework-navy"
          >
            Masquer
          </button>
        </div>
      </section>
    );
  }

  if (collapsed && ready) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bework-navy/10 bg-white px-4 py-2.5 shadow-[var(--cc-shadow)]">
        <p className="text-[13px] font-semibold text-bework-navy">
          Bien démarrer
          <span className="ml-2 tabular-nums text-bework-accent">{percent} %</span>
        </p>
        <button
          type="button"
          onClick={() => persistCollapsed(false)}
          className="text-[12px] font-semibold text-bework-accent hover:underline"
        >
          Afficher le guide
        </button>
      </section>
    );
  }

  const pending = items.filter((i) => !i.done);
  const showAll = maturity === "new";
  const shown = showAll ? items : pending.slice(0, 5);

  return (
    <section className="rounded-2xl border border-bework-navy/10 bg-white p-3.5 shadow-[var(--cc-shadow)] sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h2 className="text-[14px] font-semibold text-bework-navy">
              Bien démarrer
            </h2>
            <span
              className="text-[13px] font-bold tabular-nums text-bework-accent"
              aria-label={`Configuration à ${percent} pour cent`}
            >
              {percent} %
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Guide facultatif — explorez librement votre espace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => persistCollapsed(true)}
          className="shrink-0 text-[12px] font-medium text-slate-500 hover:text-bework-navy"
        >
          Réduire
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <div
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
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
      </div>

      <ul className="mt-3 space-y-1">
        {shown.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </ul>

      {!showAll && pending.length > shown.length ? (
        <Link
          href="/dashboard/bienvenue"
          className="mt-2 inline-block text-[12px] font-semibold text-bework-accent hover:underline"
        >
          Voir toutes les étapes →
        </Link>
      ) : null}
    </section>
  );
}

function ChecklistRow({ item }: { item: ActivationChecklistItem }) {
  const statusLabel = item.done ? "Terminé" : "À faire";

  if (item.done) {
    return (
      <li className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[13px]">
        <CheckDot done />
        <span className="font-medium text-slate-400 line-through">{item.label}</span>
        <span className="sr-only">{statusLabel}</span>
      </li>
    );
  }

  if (!item.href) {
    return (
      <li className="flex items-center gap-2 px-1.5 py-1 text-[13px]">
        <CheckDot done={false} />
        <span className="font-medium text-bework-ink">{item.label}</span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[13px] transition hover:bg-bework-soft-navy/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bework-accent/40"
      >
        <CheckDot done={false} />
        <span className="min-w-0 flex-1 font-medium text-bework-ink">{item.label}</span>
        <span className="sr-only">{statusLabel}</span>
        <span className="shrink-0 text-[12px] font-semibold text-bework-accent group-hover:underline">
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
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
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
