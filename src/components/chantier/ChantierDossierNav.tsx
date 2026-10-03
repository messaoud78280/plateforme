"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  DossierNavSnapshot,
  DossierNavStep,
  DossierNavVariant,
} from "@/lib/chantier/dossier-nav";

function statusGlyph(step: DossierNavStep): string {
  if (step.visual === "active") return "●";
  if (step.visual === "ready") return "✓";
  if (step.visual === "needs_attention") return "⚠";
  if (step.visual === "not_applicable") return "—";
  return "○";
}

function statusHint(step: DossierNavStep): string {
  if (step.visual === "active") return "En cours";
  if (step.visual === "ready") return "À jour";
  if (step.visual === "needs_attention") return "À revalider";
  if (step.visual === "not_applicable") return "N/A";
  return step.exists ? step.summary : "À préparer";
}

export function ChantierDossierNav({
  snapshot,
  variant = "compact",
  sticky = false,
  busy = false,
  onStepAction,
  className,
}: {
  snapshot: DossierNavSnapshot;
  variant?: DossierNavVariant;
  sticky?: boolean;
  busy?: boolean;
  /** Actions CREATE / prepare lorsque href null ou primaryAction ≠ open. */
  onStepAction?: (step: DossierNavStep) => void | Promise<void>;
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = snapshot.steps.find((s) => s.id === snapshot.activeStep);

  function isNavigable(step: DossierNavStep): boolean {
    if (step.visual === "active") return false;
    if (step.href) return true;
    if (step.primaryAction && step.primaryAction !== "open") return true;
    // Documents hub / liste visites même si « à préparer »
    if (step.href === null && step.primaryAction === "open") return false;
    return Boolean(step.href);
  }

  function handleClick(step: DossierNavStep, e: MouseEvent) {
    if (step.visual === "active") {
      e.preventDefault();
      return;
    }
    if (step.href && (!step.primaryAction || step.primaryAction === "open")) {
      return; // Link navigation
    }
    if (onStepAction && step.primaryAction && step.primaryAction !== "open") {
      e.preventDefault();
      void onStepAction(step);
      return;
    }
    if (!step.href && onStepAction) {
      e.preventDefault();
      void onStepAction(step);
    }
  }

  const shell = cn(
    sticky &&
      "sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85",
    className,
  );

  if (variant === "full") {
    return (
      <nav
        aria-label="Dossier chantier"
        className={cn(
          "rounded-2xl border border-slate-200/90 bg-white px-3 py-3 sm:px-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
          shell,
        )}
      >
        {snapshot.scopeName ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Lot · {snapshot.scopeName}
          </p>
        ) : null}
        <ol className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {snapshot.steps.map((step, idx) => (
            <FullStep
              key={step.id}
              step={step}
              idx={idx}
              busy={busy}
              navigable={isNavigable(step)}
              onClick={handleClick}
            />
          ))}
        </ol>
      </nav>
    );
  }

  // COMPACT
  return (
    <nav aria-label="Dossier chantier" className={cn("w-full", shell)}>
      {/* Mobile : disclosure */}
      <div className="sm:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Dossier chantier
            </span>
            <span className="mt-0.5 block truncate text-[13px] font-semibold text-[#1e3a5f]">
              {active
                ? `${statusGlyph(active)} ${active.shortLabel} · ${statusHint(active)}`
                : snapshot.projectTitle}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition",
              mobileOpen && "rotate-180",
            )}
          />
        </button>
        {mobileOpen ? (
          <ol className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-white p-2">
            {snapshot.steps.map((step) => (
              <li key={step.id}>
                <CompactStep
                  step={step}
                  busy={busy}
                  navigable={isNavigable(step)}
                  onClick={(s, e) => {
                    handleClick(s, e);
                    setMobileOpen(false);
                  }}
                  stacked
                />
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {/* Desktop / tablette */}
      <div className="hidden sm:block rounded-xl border border-slate-200/90 bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {snapshot.scopeName ? (
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {snapshot.scopeName}
          </p>
        ) : null}
        <ol className="flex items-stretch gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {snapshot.steps.map((step, idx) => (
            <li key={step.id} className="flex min-w-0 flex-1 items-stretch">
              {idx > 0 ? (
                <span
                  className="mx-0.5 mt-3 hidden h-px w-2 shrink-0 self-start bg-slate-200 md:block"
                  aria-hidden
                />
              ) : null}
              <CompactStep
                step={step}
                busy={busy}
                navigable={isNavigable(step)}
                onClick={handleClick}
              />
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

function FullStep({
  step,
  idx,
  busy,
  navigable,
  onClick,
}: {
  step: DossierNavStep;
  idx: number;
  busy: boolean;
  navigable: boolean;
  onClick: (step: DossierNavStep, e: MouseEvent) => void;
}) {
  const active = step.visual === "active";
  const cardClass = cn(
    "flex w-full flex-col rounded-xl border px-2.5 py-2 text-left transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/40 focus-visible:ring-offset-1",
    active
      ? "cursor-default border-[#1e3a5f] bg-[#1e3a5f]/[0.06] ring-1 ring-[#1e3a5f]/25"
      : navigable
        ? cn(
            "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
            step.ready
              ? "border-slate-200/90 bg-white hover:border-[#1e3a5f]/35"
              : "border-dashed border-slate-200 bg-slate-50/60 hover:border-[#1e3a5f]/30 hover:bg-white",
          )
        : "cursor-default border-dashed border-slate-200 bg-slate-50/80 opacity-90",
  );

  const inner = (
    <>
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
          active
            ? "bg-[#1e3a5f] text-white"
            : step.ready
              ? "bg-emerald-100 text-emerald-800"
              : step.visual === "needs_attention"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-500",
        )}
      >
        {step.ready && !active ? "✓" : active ? "●" : idx + 1}
      </span>
      <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {step.shortLabel}
      </span>
      <span className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-snug text-slate-800">
        {active ? "En cours" : step.summary}
      </span>
      {!active ? (
        <span className="mt-1.5 text-[10.5px] font-semibold text-[#1e3a5f]">
          {step.href || step.primaryAction
            ? step.ready
              ? "Ouvrir →"
              : `${step.actionLabel} →`
            : "—"}
        </span>
      ) : (
        <span className="mt-1.5 text-[10.5px] font-semibold text-[#1e3a5f]">
          Page ouverte
        </span>
      )}
    </>
  );

  return (
    <li className="flex min-w-[7.5rem] flex-1 items-stretch">
      {idx > 0 ? (
        <span
          className="mt-3 hidden w-2 shrink-0 self-start border-t border-slate-200 sm:block"
          aria-hidden
        />
      ) : null}
      {active ? (
        <div
          className={cardClass}
          aria-current="page"
          aria-label={`${step.label} — en cours`}
        >
          {inner}
        </div>
      ) : step.href && (!step.primaryAction || step.primaryAction === "open") ? (
        <Link
          href={step.href}
          className={cardClass}
          aria-label={`${step.label} — ${step.actionLabel}`}
          onClick={(e) => onClick(step, e)}
        >
          {inner}
        </Link>
      ) : navigable ? (
        <button
          type="button"
          disabled={busy}
          className={cn(cardClass, "disabled:cursor-wait disabled:opacity-60")}
          aria-label={`${step.label} — ${step.actionLabel}`}
          onClick={(e) => onClick(step, e)}
        >
          {inner}
        </button>
      ) : (
        <div className={cardClass} aria-label={`${step.label} — indisponible`}>
          {inner}
        </div>
      )}
    </li>
  );
}

function CompactStep({
  step,
  busy,
  navigable,
  onClick,
  stacked = false,
}: {
  step: DossierNavStep;
  busy: boolean;
  navigable: boolean;
  onClick: (step: DossierNavStep, e: MouseEvent) => void;
  stacked?: boolean;
}) {
  const active = step.visual === "active";
  const className = cn(
    "flex min-w-[5.5rem] flex-1 flex-col justify-center rounded-lg px-2 py-1.5 text-left transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/40",
    stacked && "w-full min-w-0 flex-row items-center gap-2 py-2",
    active
      ? "bg-[#1e3a5f]/[0.08] ring-1 ring-[#1e3a5f]/30"
      : navigable
        ? "hover:bg-slate-50"
        : "opacity-80",
  );

  const body = (
    <>
      <span className="flex items-center gap-1">
        <span
          className={cn(
            "text-[11px] font-bold",
            active
              ? "text-[#1e3a5f]"
              : step.ready
                ? "text-emerald-700"
                : step.visual === "needs_attention"
                  ? "text-amber-700"
                  : "text-slate-400",
          )}
          aria-hidden
        >
          {statusGlyph(step)}
        </span>
        <span
          className={cn(
            "text-[11px] font-bold uppercase tracking-[0.06em]",
            active ? "text-[#1e3a5f]" : "text-slate-600",
          )}
        >
          {step.shortLabel}
        </span>
        {active ? (
          <span className="rounded bg-[#1e3a5f]/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-[#1e3a5f]">
            En cours
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "line-clamp-1 text-[10px] text-slate-500",
          stacked && "ml-auto shrink-0",
        )}
      >
        {active ? "Page ouverte" : step.summary}
      </span>
    </>
  );

  if (active) {
    return (
      <div className={className} aria-current="page" aria-label={`${step.label} — en cours`}>
        {body}
      </div>
    );
  }

  if (step.href && (!step.primaryAction || step.primaryAction === "open")) {
    return (
      <Link
        href={step.href}
        className={className}
        aria-label={`${step.label} — ${step.summary}`}
        onClick={(e) => onClick(step, e)}
      >
        {body}
      </Link>
    );
  }

  if (navigable) {
    return (
      <button
        type="button"
        disabled={busy}
        className={cn(className, "disabled:opacity-60")}
        aria-label={`${step.label} — ${step.actionLabel}`}
        onClick={(e) => onClick(step, e)}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={className} aria-label={`${step.label} — ${step.summary}`}>
      {body}
    </div>
  );
}
