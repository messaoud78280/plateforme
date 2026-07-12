import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

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
    <header className={cn("cc-card overflow-hidden p-0", className)}>
      <div className="border-b border-bework-navy/10 bg-gradient-to-r from-bework-navy/[0.05] via-transparent to-bework-cyan/[0.04] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-bework-muted">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-bework-ink sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-bework-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}
