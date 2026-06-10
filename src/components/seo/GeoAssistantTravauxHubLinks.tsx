import Link from "next/link";
import { ASSISTANT_TRAVAUX_GEO_NAV } from "@/lib/assistant-travaux-geo";

export function GeoAssistantTravauxHubLinks({ currentHref }: { currentHref: string }) {
  const others = ASSISTANT_TRAVAUX_GEO_NAV.filter((x) => x.href !== currentHref);

  return (
    <div className="not-prose mt-12 rounded-2xl border border-black/10 bg-[#f8fafc] p-6 md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#1d4ed8]">Assistant travaux — autres pays</p>
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
      <ul className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <li>
          <Link href="/services/assistant-travaux" className="text-[#1d4ed8] hover:underline">
            Service assistant travaux
          </Link>
        </li>
        <li>
          <Link href="/reponse-appel-offres-btp" className="text-[#1d4ed8] hover:underline">
            Réponse appels d&apos;offres
          </Link>
        </li>
        <li>
          <Link href="/tarifs" className="text-[#1d4ed8] hover:underline">
            Tarifs
          </Link>
        </li>
      </ul>
    </div>
  );
}
