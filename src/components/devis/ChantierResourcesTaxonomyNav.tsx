"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { SiteResourceType } from "@prisma/client";
import { CHANTIER_RESOURCE_TAXONOMY, CHANTIER_RESOURCE_TYPE_LABELS } from "@/lib/chantier-resources/taxonomy";

type Props = { activeType?: SiteResourceType; activeFamily?: string; activeSubFamily?: string };

export function ChantierResourcesTaxonomyNav({ activeType, activeFamily, activeSubFamily }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function href(type?: SiteResourceType, family?: string, sub?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (type) p.set("type", type);
    else p.delete("type");
    if (family) p.set("family", family);
    else p.delete("family");
    if (sub) p.set("subFamily", sub);
    else p.delete("subFamily");
    const q = p.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <nav className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm" aria-label="Thèmes ressources">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Vue par thème</p>
      <ul className="mt-3 space-y-1">
        <li>
          <Link
            href={href()}
            className={`block rounded-lg px-2 py-1.5 font-medium ${!activeType ? "bg-[#1e3a5f] text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Toutes
          </Link>
        </li>
        {(Object.keys(CHANTIER_RESOURCE_TYPE_LABELS) as SiteResourceType[]).map((type) => (
          <li key={type}>
            <Link
              href={href(type)}
              className={`block rounded-lg px-2 py-1.5 font-semibold ${activeType === type && !activeFamily ? "bg-[#eff6ff] text-[#1e3a8a]" : "text-slate-800 hover:bg-slate-50"}`}
            >
              {CHANTIER_RESOURCE_TYPE_LABELS[type]}
            </Link>
            {activeType === type ? (
              <ul className="ml-2 mt-1 space-y-0.5 border-l border-slate-200 pl-2">
                {CHANTIER_RESOURCE_TAXONOMY[type].map((fam) => (
                  <li key={fam.family}>
                    <Link
                      href={href(type, fam.family)}
                      className={`block rounded px-2 py-1 text-xs ${activeFamily === fam.family && !activeSubFamily ? "font-bold text-[#1d4ed8]" : "text-slate-600 hover:text-[#1d4ed8]"}`}
                    >
                      {fam.label}
                    </Link>
                    {activeFamily === fam.family ? (
                      <ul className="ml-2 mt-0.5 space-y-0.5">
                        {fam.subFamilies.map((sub) => (
                          <li key={sub.key}>
                            <Link
                              href={href(type, fam.family, sub.key)}
                              className={`block rounded px-2 py-0.5 text-[11px] ${activeSubFamily === sub.key ? "font-bold text-[#1d4ed8]" : "text-slate-500 hover:text-[#1d4ed8]"}`}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
