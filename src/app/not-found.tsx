import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen overflow-x-clip bg-transparent">
      <MarketingSiteHeader plainBg />
      <main className="relative isolate grid min-h-[68vh] place-items-center overflow-hidden px-5 py-24 text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[min(44rem,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(39,91,232,0.14),rgba(118,87,246,0.05)_42%,transparent_72%)] blur-2xl"
          aria-hidden
        />
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#275be8]">
            Erreur 404
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,8vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-[#0b0d12]">
            Cette page n’existe pas.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
            Le lien a peut-être changé. Revenez à l’accueil ou découvrez le programme de la
            formation BeWork.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2458E8,#1760FF)] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(39,91,232,0.22)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#275be8] motion-reduce:transform-none"
            >
              Retour à l’accueil
            </Link>
            <Link
              href="/formation#programme"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#275be8]"
            >
              Voir le programme
            </Link>
          </div>
        </div>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
