import { cn } from "@/lib/cn";
import { statusToneFromLabel, type StatusTone } from "@/lib/design-tokens";

const toneClass: Record<StatusTone, string> = {
  neutral: "badge-cc badge-cc-neutral",
  info: "badge-cc badge-cc-info",
  ok: "badge-cc badge-cc-ok",
  watch: "badge-cc badge-cc-watch",
  critical: "badge-cc badge-cc-critical",
  intel: "badge-cc badge-cc-intel",
};

export function Badge({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  const resolved = tone ?? (typeof children === "string" ? statusToneFromLabel(children) : "neutral");
  return <span className={cn(toneClass[resolved], className)}>{children}</span>;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusToneFromLabel(status)} className={className}>
      {status}
    </Badge>
  );
}
