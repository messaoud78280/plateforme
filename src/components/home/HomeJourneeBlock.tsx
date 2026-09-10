import Image from "next/image";
import Link from "next/link";
import {
  BW_BTN_PRIMARY,
  BW_BTN_SECONDARY,
  BW_EYEBROW,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";

const BENEFITS = [
  { label: "Démonstrations concrètes" },
  { label: "Petit groupe" },
  { label: "Pratique sur vos idées" },
  { label: "Méthode réutilisable" },
] as const;

/** La journée — valeur d’abord, tarif plus bas. */
export function HomeJourneeBlock() {
  return (
    <section id="journee" className={BW_SECTION} aria-labelledby="journee-home-heading">
      <BwAtmosphere variant="formation" />
      <div className="container-site relative z-[1]">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_20px_56px_rgba(15,23,42,0.07)] backdrop-blur-sm lg:rounded-[2rem]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="relative min-h-[16rem] overflow-hidden sm:min-h-[18rem] lg:min-h-full">
              <Image
                src="/marketing/journee-bework.jpg"
                alt="Journée BeWork — formation pratique en petit groupe autour d’un écran"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 46vw"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <span className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1d4ed8] backdrop-blur-sm">
                Journée pratique
              </span>
            </div>

            <div className="flex flex-col justify-center gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
              <div>
                <p className={BW_EYEBROW}>La journée BeWork</p>
                <h2
                  id="journee-home-heading"
                  className="mt-3 font-display text-[1.75rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.35rem]"
                >
                  Pas une journée à écouter.
                  <br />
                  <span className="text-[#2563eb]">Une journée à créer.</span>
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
                  Une expérience pratique pour découvrir comment transformer vos
                  idées en projets numériques grâce à l’intelligence artificielle.
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-3">
                {BENEFITS.map((b) => (
                  <li
                    key={b.label}
                    className="rounded-xl border border-slate-100 bg-[#f8fafc] px-3 py-3 text-xs font-semibold text-slate-700 sm:text-sm"
                  >
                    {b.label}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/formation" className={BW_BTN_PRIMARY}>
                  Découvrir le déroulement
                  <span aria-hidden>→</span>
                </Link>
                <Link href="/demonstrations" className={BW_BTN_SECONDARY}>
                  Voir les démonstrations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
