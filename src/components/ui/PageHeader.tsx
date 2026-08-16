import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * DESIGN-SYSTEM-V3 / UI-COLOR-2 — header de page compact.
 * Pas de grosse card décorative : typographie + accent discret.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("space-y-1", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="inline-flex items-center rounded-full bg-bework-soft-navy px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-bework-navy">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-0.5 text-[1.75rem] font-semibold tracking-tight text-bework-ink sm:text-[1.875rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[0.9375rem] leading-relaxed text-bework-muted">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
