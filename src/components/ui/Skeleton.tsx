import { cn } from "@/lib/cn";

/** Skeleton de chargement — respecte prefers-reduced-motion via CSS global. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--cc-radius)] bg-slate-200/70",
        className,
      )}
      aria-hidden
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="cc-card space-y-3 p-4" role="status" aria-label="Chargement">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}
