import Link from "next/link";
import { HomeProductPreview } from "@/components/home/HomeProductPreview";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BTN_SECONDARY, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Preuve de savoir-faire — la plateforme est une offre, pas toute la marque. */
export function HomePlatformProof() {
  return (
    <section id="plateforme" className={`${HOME_SECTION} bg-white`} aria-labelledby="platform-proof-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="platform-proof-heading"
          eyebrow="Preuve"
          title="Nous avons déjà construit une plateforme métier complète."
          lead="La plateforme BeWork est une de nos offres majeures — et la démonstration concrète de notre capacité à concevoir des systèmes pour le BTP."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-5xl`}>
          <HomeProductPreview large />
        </div>

        <ul className="mx-auto mt-12 grid max-w-3xl gap-8 sm:mt-14 sm:grid-cols-3 sm:gap-8">
          {[
            { title: "À faire", text: "Actions et échéances qui font avancer." },
            { title: "À surveiller", text: "Risques et points qui dérivent." },
            { title: "À décider", text: "Ce qui attend une validation." },
          ].map((p) => (
            <li key={p.title} className="text-center">
              <h3 className="font-display text-xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-2xl">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href="#modules"
            className={HOME_BTN_SECONDARY}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-platform-voir")}
          >
            Voir BeWork en action
          </Link>
        </div>
      </div>
    </section>
  );
}
