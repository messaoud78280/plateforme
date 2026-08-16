import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toneSurface, type BwTone } from "@/lib/design-system/semantic-colors";

export function Card({
  className,
  hover = true,
  glass = false,
  tone,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  hover?: boolean;
  glass?: boolean;
  /** Teinte sémantique optionnelle (UI-COLOR-2) */
  tone?: BwTone;
}) {
  const tinted = tone ? toneSurface(tone) : null;
  return (
    <section
      className={cn(
        glass ? "cc-glass rounded-[var(--cc-radius-lg)]" : tinted ? tinted.surface : "cc-card",
        tinted && "rounded-[var(--cc-radius-lg)] shadow-[var(--cc-shadow)]",
        !hover && "hover:shadow-[var(--cc-shadow)] hover:border-[var(--cc-border)]",
        "p-4 sm:p-5",
        className,
      )}
      style={
        tinted
          ? ({ ["--bw-card-tone"]: tinted.cssTone } as CSSProperties)
          : undefined
      }
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[1.125rem] font-semibold tracking-tight text-bework-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-[0.875rem] text-bework-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
