import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr";

export const metadata: Metadata = {
  title: "Blog BeWork — Assistant administratif externalisé, délégation PME",
  description:
    "Articles et conseils sur l'assistant administratif externalisé, la délégation et l'externalisation de l'administratif pour PME et dirigeants.",
  alternates: { canonical: `${BASE_URL}/blog` },
};

const ARTICLES = [
  {
    slug: "10-taches-administratives-deleguer-dirigeant",
    title: "10 tâches administratives à déléguer quand on est dirigeant",
    excerpt: "Découvrez les tâches chronophages que les dirigeants peuvent déléguer pour gagner du temps et se recentrer sur leur cœur de métier.",
  },
  {
    slug: "combien-coute-assistant-administratif",
    title: "Combien coûte un assistant administratif ?",
    excerpt: "Comparatif des tarifs : assistant administratif externalisé vs salarié. Ce que coûte vraiment l'externalisation pour les PME.",
  },
  {
    slug: "assistant-virtuel-vs-assistant-salarie",
    title: "Assistant virtuel vs assistant salarié",
    excerpt: "Avantages et inconvénients de l'assistant administratif externalisé face à un recrutement interne. Pour qui, pour quoi ?",
  },
  {
    slug: "gagner-5-heures-semaine-deleguer-administratif",
    title: "Comment gagner 5 heures par semaine en déléguant l'administratif",
    excerpt: "Conseils pratiques pour identifier les tâches à déléguer et libérer du temps grâce à un assistant administratif externalisé.",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <BeWorkLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/tarifs" className="rounded-lg border border-[#c8cdd6] bg-white px-5 py-2.5 text-sm font-medium text-[#1e293b] hover:bg-[#f8f9fb]">
              Tarifs
            </Link>
            <Link href="/inscription" className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]">
              Tester BeWork
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
            Blog BeWork
          </h1>
          <p className="mt-4 text-lg text-[#334155]">
            Conseils et bonnes pratiques sur l&apos;assistant administratif externalisé et la délégation pour PME et dirigeants.
          </p>
          <ul className="mt-12 space-y-8">
            {ARTICLES.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/blog/${a.slug}`}
                  className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#1d4ed8]/30 hover:shadow-md"
                >
                  <h2 className="text-xl font-semibold text-[#0f172a]">{a.title}</h2>
                  <p className="mt-2 text-[#334155]">{a.excerpt}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-[#1d4ed8]">
                    Lire l&apos;article →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12 mt-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-sm text-[#334155]">
          <div className="flex items-center gap-3">
            <BeWorkLogo size="sm" />
            <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="font-medium hover:text-[#0f172a]">Accueil</Link>
            <Link href="/tarifs" className="font-medium hover:text-[#0f172a]">Tarifs</Link>
            <Link href="/contact" className="font-medium hover:text-[#0f172a]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
