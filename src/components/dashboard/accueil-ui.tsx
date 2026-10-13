import Link from "next/link";
import { cn } from "@/lib/cn";

const sectionSurface =
  "bw-section-card px-5 py-5";

export function DashboardSection({
  title,
  badge,
  subtitle,
  action,
  children,
  className,
  demoTarget,
}: {
  title: string;
  badge?: number | string | null;
  subtitle?: string | null;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
  demoTarget?: string;
}) {
  return (
    <section
      data-demo-target={demoTarget}
      className={cn(sectionSurface, className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold tracking-tight text-bework-navy">
              {title}
            </h2>
            {badge != null && badge !== "" ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-bework-soft-accent px-1.5 text-[11px] font-bold tabular-nums text-bework-accent">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] text-bework-muted">{subtitle}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="shrink-0 pt-0.5 text-[13px] font-semibold text-bework-accent transition-colors duration-150 hover:underline"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export function urgencyMeta(u: string): {
  label: string;
  dot: string;
  text: string;
  row: string;
} {
  if (u === "CRITIQUE") {
    return {
      label: "Critique",
      dot: "bg-bework-critical",
      text: "text-bework-critical",
      row: "border-l-bework-critical bg-bework-soft-critical",
    };
  }
  if (u === "URGENT") {
    return {
      label: "Urgent",
      dot: "bg-bework-watch",
      text: "text-bework-watch",
      row: "border-l-bework-watch bg-bework-soft-watch",
    };
  }
  if (u === "IMPORTANT") {
    return {
      label: "Important",
      dot: "bg-bework-accent",
      text: "text-bework-navy",
      row: "border-l-bework-accent bg-bework-soft-accent",
    };
  }
  return {
    label: "À surveiller",
    dot: "bg-bework-muted",
    text: "text-bework-muted",
    row: "border-l-bework-border bg-bework-surface-muted",
  };
}

export function attentionTypeLabel(id: string, reason: string): string | null {
  const kind = id.split(":")[0] ?? "";
  const r = reason.toLowerCase();
  if (kind === "PURCHASE_ORDER") {
    if (r.includes("livr")) return "Livraison";
    return "Commande";
  }
  if (kind === "FOLLOW_UP") {
    if (r.includes("factur")) return "Facturation";
    if (r.includes("interven")) return "Intervention";
    return "Suivi";
  }
  return null;
}

export function PriorityRow({
  href,
  urgency,
  typeLabel,
  title,
  subtitle,
}: {
  href: string;
  urgency: string;
  typeLabel: string | null;
  title: string;
  subtitle: string;
}) {
  const meta = urgencyMeta(urgency);
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[72px] items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 transition-colors duration-150 hover:bg-bework-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bework-accent/30 sm:min-h-[76px]",
        meta.row,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-semibold">
          <span className={cn("inline-flex items-center gap-1.5", meta.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
            {meta.label}
          </span>
          {typeLabel ? (
            <span className="font-medium text-slate-500">· {typeLabel}</span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[15px] font-bold tracking-tight text-bework-ink">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[13px] text-slate-600">
            {subtitle}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className="shrink-0 text-[18px] font-light text-bework-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-bework-navy"
      >
        ›
      </span>
    </Link>
  );
}

export function TodayRow({
  href,
  eyebrow,
  title,
  subtitle,
}: {
  href: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-bework-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bework-accent/30"
    >
      {eyebrow ? (
        <span className="text-[12px] font-semibold text-slate-500">{eyebrow}</span>
      ) : null}
      <span className="block truncate text-[14px] font-bold text-bework-ink">
        {title}
      </span>
      {subtitle ? (
        <span className="mt-0.5 block truncate text-[13px] text-slate-500">
          {subtitle}
        </span>
      ) : null}
    </Link>
  );
}

export function FinanceMetric({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block min-w-0 rounded-xl px-1 py-1 transition-colors duration-150 hover:bg-bework-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bework-accent/30"
    >
      <p className="text-[13px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-[24px] font-bold tracking-tight text-bework-navy tabular-nums sm:text-[26px]">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[12px] text-slate-500">{hint}</p> : null}
    </Link>
  );
}
