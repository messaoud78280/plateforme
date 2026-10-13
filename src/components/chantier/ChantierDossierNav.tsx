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

function isBlockingStep(step: DossierNavStep): boolean {
  return /bloquant/i.test(step.summary);
}

function statusGlyph(step: DossierNavStep): string {
  if (isBlockingStep(step)) return "●";
  if (step.visual === "active") return "●";
  if (step.visual === "ready") return "✓";
  if (step.visual === "needs_attention") return "⚠";
  if (step.visual === "not_applicable") return "—";
  return "○";
}

function glyphTone(step: DossierNavStep, active: boolean): string {
  if (isBlockingStep(step)) return "text-bework-critical";
  if (active) return "text-bework-navy";
  if (step.visual === "ready") return "text-bework-ok";
  if (step.visual === "needs_attention") return "text-bework-watch";
  return "text-bework-muted";
}

function statusHint(step: DossierNavStep): string {
  if (step.visual === "active") return "En cours";
  if (step.visual === "ready") return "À jour";
  if (step.visual === "needs_attention") {
    if (/métré à vérifier/i.test(step.summary)) return "Métré à vérifier";
    if (/approvisionnements à vérifier/i.test(step.summary)) {
      return "Approvisionnements à vérifier";
    }
    return "À revalider";
  }
  if (step.visual === "not_applicable") return "N/A";
  return step.exists ? step.summary : "À préparer";
}

function stepSummary(step: DossierNavStep): string {
  if (step.visual === "active") {
    return step.summary && step.summary !== "À préparer"
      ? step.summary
      : "En cours";
  }
  return step.summary;
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
  onStepAction?: (step: DossierNavStep) => void | Promise<void>;
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = snapshot.steps.find((s) => s.id === snapshot.activeStep);
  const roomy = variant === "full";

  function isNavigable(step: DossierNavStep): boolean {
    if (step.visual === "active") return false;
    if (step.href) return true;
    if (step.primaryAction && step.primaryAction !== "open") return true;
    if (step.href === null && step.primaryAction === "open") return false;
    return Boolean(step.href);
  }

  function handleClick(step: DossierNavStep, e: MouseEvent) {
    if (step.visual === "active") {
      e.preventDefault();
      return;
    }
    if (step.href && (!step.primaryAction || step.primaryAction === "open")) {
      return;
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
      "sticky top-0 z-30 border-b border-bework-border bg-bework-surface/95 backdrop-blur supports-[backdrop-filter]:bg-bework-surface/90",
    className,
  );

  return (
    <nav aria-label="Dossier chantier" className={cn("w-full", shell)}>
      {/* Mobile */}
      <div className="sm:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-bework-border bg-bework-surface px-3.5 py-3 text-left"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-bework-muted">
              Dossier chantier
            </span>
            <span className="mt-0.5 block truncate text-[14px] font-semibold text-bework-navy">
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
          <ol className="mt-2 divide-y divide-bework-border overflow-hidden rounded-xl border border-bework-border bg-bework-surface">
            {snapshot.steps.map((step) => (
              <li key={step.id}>
                <NavStep
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

      {/* Desktop / tablette — barre unique horizontale */}
      <div
        className={cn(
          "hidden overflow-hidden rounded-xl border border-bework-border bg-bework-surface sm:block",
          roomy ? "px-1 py-1" : "px-0.5 py-0.5",
        )}
      >
        {snapshot.scopeName ? (
          <p className="border-b border-bework-border bg-bework-soft-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-bework-accent">
            Lot · {snapshot.scopeName}
          </p>
        ) : null}
        <ol
          className={cn(
            "flex items-stretch overflow-x-auto",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            roomy ? "min-h-[88px]" : "min-h-[72px]",
          )}
        >
          {snapshot.steps.map((step, idx) => (
            <li
              key={step.id}
              className={cn(
                "flex min-w-[6.5rem] flex-1 items-stretch",
                idx > 0 && "border-l border-bework-border",
              )}
            >
              <NavStep
                step={step}
                busy={busy}
                navigable={isNavigable(step)}
                onClick={handleClick}
                roomy={roomy}
              />
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

function NavStep({
  step,
  busy,
  navigable,
  onClick,
  stacked = false,
  roomy = false,
}: {
  step: DossierNavStep;
  busy: boolean;
  navigable: boolean;
  onClick: (step: DossierNavStep, e: MouseEvent) => void;
  stacked?: boolean;
  roomy?: boolean;
}) {
  const active = step.visual === "active";
  const summary = stepSummary(step);

  const className = cn(
    "group flex w-full text-left outline-none transition-colors",
    "focus-visible:bg-bework-soft-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bework-accent/30",
    stacked
      ? "items-center gap-3 px-3.5 py-3"
      : cn(
          "h-full flex-col justify-center",
          roomy ? "px-3 py-4" : "px-2.5 py-3",
        ),
    active
      ? "bg-bework-soft-navy shadow-[inset_0_-2.5px_0_0_var(--cc-accent)]"
      : navigable
        ? "hover:bg-bework-surface-muted"
        : "opacity-75",
  );

  const body = (
    <>
      <span
        className={cn(
          "flex items-center gap-1.5",
          stacked && "min-w-0 flex-1",
        )}
      >
        <span
          className={cn(
            "shrink-0 text-[13px] font-semibold leading-none",
            glyphTone(step, active),
          )}
          aria-hidden
        >
          {statusGlyph(step)}
        </span>
        <span
          className={cn(
            "truncate text-[13px] font-semibold tracking-tight",
            active ? "text-bework-navy" : "text-bework-ink",
          )}
        >
          {step.shortLabel}
        </span>
        {navigable && !active && !stacked ? (
          <span
            className="ml-auto hidden text-[12px] font-medium text-transparent transition group-hover:text-bework-navy/70 lg:inline"
            aria-hidden
          >
            →
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "line-clamp-1 text-[13px] leading-snug",
          stacked ? "shrink-0 text-bework-muted" : "mt-1 text-bework-muted",
          active && "font-medium text-bework-ink",
          isBlockingStep(step) && "text-bework-critical",
        )}
      >
        {summary}
      </span>
    </>
  );

  if (active) {
    return (
      <div
        className={className}
        aria-current="page"
        aria-label={`${step.label} — en cours`}
      >
        {body}
      </div>
    );
  }

  if (step.href && (!step.primaryAction || step.primaryAction === "open")) {
    return (
      <Link
        href={step.href}
        className={className}
        aria-label={`${step.label} — ${summary}`}
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
        className={cn(className, "disabled:cursor-wait disabled:opacity-60")}
        aria-label={`${step.label} — ${step.actionLabel}`}
        onClick={(e) => onClick(step, e)}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={className} aria-label={`${step.label} — ${summary}`}>
      {body}
    </div>
  );
}
