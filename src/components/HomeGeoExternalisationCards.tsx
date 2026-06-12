import Link from "next/link";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";

const CARDS = EXTERNALISATION_ADMIN_BT_NAV;

/** Grille 2×2 — pages SEO pays (maquette GEO accueil). */
export function HomeGeoExternalisationCards() {
  return (
    <section className="bg-[#f1f5f9]/90 px-6 py-12 md:py-16" aria-labelledby="geo-pays-heading">
      <div className="container-site mx-auto max-w-6xl">
        <h2 id="geo-pays-heading" className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-[1.65rem]">
          Une page par pays
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-800 md:text-[1.05rem]">
          Contenus et angles adaptés à chaque marché — ouvrez la page qui correspond à votre zone.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
          {CARDS.map((card) => (
            <li key={card.key}>
              <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <h3 className="text-lg font-bold tracking-tight text-black md:text-xl">{card.title}</h3>
                <p className="mt-2 flex-1 text-base leading-relaxed text-slate-700">{card.line}</p>
                <Link
                  href={card.href}
                  className="mt-5 inline-flex w-fit items-center gap-1 text-base font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
                >
                  Page dédiée
                  <span aria-hidden>→</span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
