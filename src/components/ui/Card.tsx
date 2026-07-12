import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  hover = true,
  glass = false,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  hover?: boolean;
  glass?: boolean;
}) {
  return (
    <section
      className={cn(
        glass ? "cc-glass rounded-[var(--cc-radius-lg)]" : "cc-card",
        !hover && "hover:shadow-[var(--cc-shadow)] hover:border-[var(--cc-border)]",
        "p-4 sm:p-5",
        className,
      )}
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
        <h2 className="font-heading text-lg font-bold tracking-tight text-bework-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-bework-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
