import { cn } from "@/lib/cn";

/** Valeur + label uppercase (Client / Localisation / Responsable). */
export function ProjectMetaItem({
  value,
  label,
  className,
  empty = false,
}: {
  value: string;
  label: string;
  className?: string;
  empty?: boolean;
}) {
  return (
    <div className={cn("bw-psig__cell", empty && "bw-psig__cell--empty", className)}>
      <p className="bw-psig__cell-value">{value}</p>
      <p className="bw-psig__cell-label">{label}</p>
    </div>
  );
}
