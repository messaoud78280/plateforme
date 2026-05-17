import Link from "next/link";
import { getSeoInternalLinks } from "@/lib/seo-internal-links";

type SeoInternalLinksProps = {
  path: string;
  className?: string;
};

export function SeoInternalLinks({ path, className = "mt-12" }: SeoInternalLinksProps) {
  const links = getSeoInternalLinks(path);
  if (!links.length) return null;

  return (
    <nav className={className} aria-label="Pages associées">
      <h2 className="font-heading text-lg font-bold text-black">À lire aussi</h2>
      <ul className="mt-4 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-base font-medium text-[#1d4ed8] hover:text-[#1e40af] hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
