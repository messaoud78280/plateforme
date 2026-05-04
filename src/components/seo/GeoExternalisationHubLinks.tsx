import Link from "next/link";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";

/** Maillage interne du cluster « externalisation administrative BTP » multi-pays. */
export function GeoExternalisationHubLinks({ currentHref }: { currentHref: string }) {
  const others = EXTERNALISATION_ADMIN_BT_NAV.filter((x) => x.href !== currentHref);

  return (
    <div className="not-prose mt-12 rounded-2xl border border-black/10 bg-[#f8fafc] p-6 md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#1d4ed8]">Continuer selon votre pays</p>
      <p className="mt-2 text-sm text-black leading-relaxed">
        Chaque page est rédigée différemment (pas de copier-coller) : problématiques locales, exemples terrain et formulations
        habituelles côté devis ou facturation.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {others.map((x) => (
          <li key={x.href} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <Link href={x.href} className="text-base font-semibold text-[#1d4ed8] hover:underline">
              {x.title}
            </Link>
            <span className="mt-1 block text-sm leading-snug text-black">{x.line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
