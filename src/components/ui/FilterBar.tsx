import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Barre de filtres / recherche pour les listes métier. */
export function FilterBar({
  children,
  className,
  as = "form",
  ...props
}: {
  children: ReactNode;
  className?: string;
  as?: "form" | "div";
} & FormHTMLAttributes<HTMLFormElement> &
  HTMLAttributes<HTMLDivElement>) {
  if (as === "div") {
    return (
      <div className={cn("cc-card flex flex-wrap items-end gap-3 p-3.5 sm:p-4", className)} {...props}>
        {children}
      </div>
    );
  }
  return (
    <form
      method="get"
      className={cn("cc-card flex flex-wrap items-end gap-3 p-3.5 sm:p-4", className)}
      {...props}
    >
      {children}
    </form>
  );
}

export function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-bework-navy text-white shadow-sm"
          : "border border-[color:var(--cc-chrome-border)] bg-white text-bework-ink/80 hover:bg-bework-navy-soft",
      )}
    >
      {children}
    </a>
  );
}
