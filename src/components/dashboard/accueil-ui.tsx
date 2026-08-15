import Link from "next/link";
import { cn } from "@/lib/cn";

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
      className={cn(
        "rounded-2xl border border-slate-200/70 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {badge != null && badge !== "" ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold tabular-nums text-slate-600">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="shrink-0 pt-0.5 text-[13px] font-medium text-[#1d4ed8] transition-colors duration-150 hover:text-[#1e3a5f]"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function urgencyMeta(u: string): {
  label: string;
  dot: string;
  text: string;
} {
  if (u === "CRITIQUE") {
    return { label: "Critique", dot: "bg-red-500", text: "text-red-700" };
  }
  if (u === "URGENT") {
    return { label: "Urgent", dot: "bg-orange-500", text: "text-orange-700" };
  }
  if (u === "IMPORTANT") {
    return { label: "Important", dot: "bg-sky-600", text: "text-sky-800" };
  }
  return { label: "À surveiller", dot: "bg-slate-400", text: "text-slate-500" };
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
      className="group flex min-h-[72px] items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-150 hover:bg-slate-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30 sm:min-h-[76px]"
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-medium">
          <span className={cn("inline-flex items-center gap-1.5", meta.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
            {meta.label}
          </span>
          {typeLabel ? (
            <span className="text-slate-400">· {typeLabel}</span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[15px] font-semibold tracking-tight text-slate-900">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[13px] text-slate-500">
            {subtitle}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className="shrink-0 text-[18px] font-light text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-500"
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
      className="group block rounded-lg px-1 py-2 transition-colors duration-150 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
    >
      {eyebrow ? (
        <span className="text-[12px] font-medium text-slate-400">{eyebrow}</span>
      ) : null}
      <span className="block truncate text-[14px] font-semibold text-slate-900">
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
      className="block min-w-0 rounded-xl px-1 py-1 transition-colors duration-150 hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/30"
    >
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-[24px] font-semibold tracking-tight text-slate-900 tabular-nums sm:text-[26px]">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[12px] text-slate-400">{hint}</p> : null}
    </Link>
  );
}
