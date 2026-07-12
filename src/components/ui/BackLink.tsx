import Link from "next/link";
import { cn } from "@/lib/cn";

interface BackLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function BackLink({ href, children, className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold text-bework-muted transition-colors hover:text-bework-navy",
        className,
      )}
    >
      <span aria-hidden className="text-bework-navy/70">
        ←
      </span>
      {children}
    </Link>
  );
}
