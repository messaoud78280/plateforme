import { cn } from "@/lib/cn";

type AlertTone = "info" | "ok" | "watch" | "critical";

const toneClass: Record<AlertTone, string> = {
  info: "border-bework-navy/15 bg-bework-navy-soft text-bework-navy",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  watch: "border-amber-200 bg-amber-50 text-amber-950",
  critical: "border-red-200 bg-red-50 text-red-900",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--cc-radius)] border px-3.5 py-3 text-sm",
        toneClass[tone],
        className,
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={cn(title && "mt-1", "leading-relaxed opacity-95")}>{children}</div>
    </div>
  );
}
