import Link from "next/link";
import { cn } from "@/lib/cn";

interface BackLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Lien Retour serveur (SSR). Pour historique + fallback sûr, préférer ContextBackButton.
 * Style aligné NAVIGATION-RETOUR-V1 (discret, secondaire).
 */
export function BackLink({ href, children, className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1.5 py-1.5 -ml-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35",
        className,
      )}
    >
      <span aria-hidden className="text-base leading-none text-slate-400">
        ←
      </span>
      {children}
    </Link>
  );
}
