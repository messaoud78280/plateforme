import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}) {
  const showAction = Boolean(actionLabel && (onAction || actionHref));

  return (
    <div
      className={cn(
        "rounded-[var(--cc-radius-lg)] border border-dashed border-bework-navy/20 bg-bework-navy-soft/40 px-5 py-10 text-center",
        className,
      )}
    >
      <p className="font-heading text-base font-bold text-bework-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-bework-muted">{description}</p>
      {showAction ? (
        <div className="mt-4">
          {actionHref ? (
            <Link href={actionHref} className="btn-cc-primary inline-flex">
              {actionLabel}
            </Link>
          ) : (
            <Button type="button" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
