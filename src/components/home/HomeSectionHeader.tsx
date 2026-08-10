import type { ReactNode } from "react";
import { HOME_EYEBROW, HOME_H2, HOME_LEAD } from "@/components/home/homeSectionStyles";

type HomeSectionHeaderProps = {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
  align?: "center" | "left";
};

/** En-tête de section — typographie forte, peu de bruit. */
export function HomeSectionHeader({
  id,
  eyebrow,
  title,
  lead,
  className = "",
  align = "center",
}: HomeSectionHeaderProps) {
  const alignCls = align === "left" ? "text-left" : "mx-auto max-w-3xl text-center";
  return (
    <header className={`${alignCls} ${className}`.trim()}>
      {eyebrow ? <p className={HOME_EYEBROW}>{eyebrow}</p> : null}
      <h2 id={id} className={`${HOME_H2} ${eyebrow ? "mt-3" : ""}`}>
        {title}
      </h2>
      {lead ? <div className={`${HOME_LEAD} ${align === "center" ? "mx-auto" : ""}`}>{lead}</div> : null}
    </header>
  );
}
