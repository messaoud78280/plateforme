import { cn } from "@/lib/cn";
import { UX_WARNINGS } from "@/lib/design-system/vocabulary";

type TrustKind =
  | "demo"
  | "fictive"
  | "test"
  | "obsolete"
  | "confidential"
  | "unsaved"
  | "irreversible"
  | "external";

const KIND: Record<
  TrustKind,
  { label: string; className: string }
> = {
  demo: {
    label: UX_WARNINGS.demoData,
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
  fictive: {
    label: "Données fictives",
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
  test: {
    label: UX_WARNINGS.testEnv,
    className: "border-violet-300 bg-violet-50 text-violet-950",
  },
  obsolete: {
    label: UX_WARNINGS.obsoleteDoc,
    className: "border-orange-300 bg-orange-50 text-orange-950",
  },
  confidential: {
    label: UX_WARNINGS.confidential,
    className: "border-red-300 bg-red-50 text-red-900",
  },
  unsaved: {
    label: UX_WARNINGS.unsaved,
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
  irreversible: {
    label: UX_WARNINGS.irreversible,
    className: "border-red-300 bg-red-50 text-red-900",
  },
  external: {
    label: UX_WARNINGS.externalShare,
    className: "border-bework-navy/20 bg-bework-navy-soft text-bework-navy",
  },
};

/** Indicateurs de confiance — sobres mais impossibles à manquer. */
export function TrustContextBanner({
  kind,
  detail,
  className,
}: {
  kind: TrustKind;
  detail?: string;
  className?: string;
}) {
  const k = KIND[kind];
  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--cc-radius)] border px-3.5 py-2 text-sm font-semibold",
        k.className,
        className,
      )}
    >
      {k.label}
      {detail ? <span className="mt-0.5 block text-xs font-normal opacity-90">{detail}</span> : null}
    </div>
  );
}

export function TrustBadge({ kind }: { kind: TrustKind }) {
  const k = KIND[kind];
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", k.className)}>
      {k.label}
    </span>
  );
}
