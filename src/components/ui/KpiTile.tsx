import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type KpiTone = "neutral" | "ok" | "watch" | "critical";

const valueTone: Record<KpiTone, string> = {
  neutral: "text-bework-ink",
  ok: "text-bework-ok",
  watch: "text-bework-watch",
  critical: "text-bework-critical",
};

export function KpiTile({
  label,
  value,
  hint,
  href,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: KpiTone;
  className?: string;
}) {
  const inner = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-bework-muted">{label}</p>
      <p className={cn("mt-1 font-heading text-2xl font-bold tabular-nums", valueTone[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-bework-muted">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("cc-kpi block hover:bg-bework-navy-soft/60", className)}>
        {inner}
      </Link>
    );
  }

  return <div className={cn("cc-kpi", className)}>{inner}</div>;
}
