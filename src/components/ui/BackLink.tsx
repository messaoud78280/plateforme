import Link from "next/link";

interface BackLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function BackLink({ href, children, className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 ${className}`}
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}
