import { cn } from "@/lib/cn";

/** Lien d’évitement clavier — hors écran, visible au focus. */
export function SkipLink({
  href = "#contenu-principal",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-[var(--cc-radius)] bg-bework-navy px-4 py-2",
        "text-sm font-semibold text-white shadow-lg transition-transform",
        "focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-bework-navy",
        className,
      )}
    >
      Aller au contenu principal
    </a>
  );
}
