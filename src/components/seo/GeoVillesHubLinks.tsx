import Link from "next/link";
import { ASSISTANT_TRAVAUX_VILLE_NAV } from "@/lib/assistant-travaux-villes";

export function GeoVillesHubLinks({
  currentHref,
  paysFilter,
  hub = false,
}: {
  currentHref?: string;
  paysFilter?: "France" | "Belgique" | "Suisse";
  /** Affiche toutes les villes du filtre pays (page pays). */
  hub?: boolean;
}) {
  const others = ASSISTANT_TRAVAUX_VILLE_NAV.filter(
    (x) => (!paysFilter || x.pays === paysFilter) && (!currentHref || x.href !== currentHref),
  );

  if (others.length === 0) return null;

  return (
    <div className="not-prose mt-12 rounded-2xl border border-black/10 bg-[#f8fafc] p-6 md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#1d4ed8]">
        {hub ? "Principales villes" : "Autres villes"}
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {others.map((x) => (
          <li key={x.href}>
            <Link href={x.href} className="text-base font-semibold text-[#1d4ed8] hover:underline">
              {x.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
