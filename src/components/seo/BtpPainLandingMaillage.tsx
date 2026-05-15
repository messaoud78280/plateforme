import Link from "next/link";
import { GeoAeoBrief } from "@/components/seo/GeoAeoBrief";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";
import { BEWORK_PROCESS_BEW_PATH, BTP_PAIN_PAGE_CLUSTER } from "@/lib/btp-pain-pages";

type Props = {
  /** URL courante (exclue du bloc « autres angles »). */
  currentHref: string;
};

export function BtpPainLandingMaillage({ currentHref }: Props) {
  const otherAngles = BTP_PAIN_PAGE_CLUSTER.filter((x) => x.href !== currentHref);

  return (
    <div className="not-prose mt-14 space-y-10">
      <GeoAeoBrief />
      <div className="rounded-2xl border border-black/10 bg-[#f8fafc] p-6 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#1d4ed8]">Autres freins terrain</p>
        <p className="mt-2 text-sm text-black leading-relaxed">
          Quatre problématiques distinctes — chaque page est rédigée à part (pas de texte copié-collé).
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {otherAngles.map((item) => (
            <li key={item.href} className="rounded-xl border border-black/10 bg-white p-4">
              <Link href={item.href} className="text-[0.9375rem] font-semibold text-[#1d4ed8] hover:underline">
                {item.title}
              </Link>
              <span className="mt-1 block text-sm leading-snug text-black">{item.line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-[#1d4ed8]/20 bg-[#eff6ff]/35 p-6 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#1d4ed8]">
          Externalisation administrative BTP (France, Belgique, Suisse, Luxembourg)
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {EXTERNALISATION_ADMIN_BT_NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                className="inline-flex rounded-lg border border-[#1d4ed8]/30 bg-white px-3 py-1.5 text-sm font-medium text-[#1d4ed8] hover:bg-[#eff6ff]"
              >
                {n.title}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/tarifs"
            className="inline-flex rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50"
          >
            Forfaits & tarifs
          </Link>
          <Link
            href={BEWORK_PROCESS_BEW_PATH}
            className="inline-flex rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50"
          >
            Comment BeWork travaille
          </Link>
        </div>
      </div>
    </div>
  );
}
