import type { ReactNode } from "react";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

type SeoLandingPageProps = {
  title: string;
  description: string;
  h1: string;
  intro: ReactNode;
  children: ReactNode;
};

export function SeoLandingPage({ title, description, h1, intro, children }: SeoLandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <BeWorkLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/tarifs" className="hidden rounded-lg border border-[#c8cdd6] bg-white px-5 py-2.5 text-sm font-medium text-[#1e293b] sm:inline-flex hover:bg-[#f8f9fb]">
              Tarifs
            </Link>
            <Link href="/contact" className="rounded-lg border border-[#c8cdd6] bg-white px-5 py-2.5 text-sm font-medium text-[#1e293b] hover:bg-[#f8f9fb]">
              Contact
            </Link>
            <Link href="/inscription" className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]">
              Tester BeWork
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">{h1}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[#334155]">{intro}</p>
          <div className="mt-12 prose prose-slate max-w-none prose-headings:text-[#0f172a] prose-p:text-[#334155]">
            {children}
          </div>
          <div className="mt-12 rounded-xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8">
            <h2 className="text-xl font-bold text-[#0f172a]">Prêt à externaliser votre administratif ?</h2>
            <p className="mt-3 text-[#334155]">
              BeWork accompagne les PME francophones en France, Belgique, Suisse et Luxembourg. Dès 215 € TTC/mois.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/inscription" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Tester BeWork
              </Link>
              <Link href="/inscription" className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]">
                Créer un compte
              </Link>
              <Link href="/contact" className="inline-flex rounded-lg border-2 border-[#c8cdd6] bg-white px-6 py-3 font-semibold text-[#334155] hover:border-[#1d4ed8] hover:text-[#1d4ed8]">
                Déléguer une première tâche
              </Link>
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-[#334155] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <BeWorkLogo size="sm" />
              <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="font-medium hover:text-[#0f172a]">Accueil</Link>
            <Link href="/tarifs" className="font-medium hover:text-[#0f172a]">Tarifs</Link>
            <Link href="/contact" className="font-medium hover:text-[#0f172a]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
