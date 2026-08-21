import type { Metadata } from "next";
import Link from "next/link";
import { EssayerBeWorkForm } from "@/components/saas/EssayerBeWorkForm";
import { SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";

export const metadata: Metadata = {
  title: "Essayer BeWork — 14 jours gratuits",
  description:
    "Créez votre espace BeWork en quelques secondes. 14 jours d’essai gratuit, sans carte bancaire.",
};

export default function EssayerPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#dce2ea] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.18), transparent)",
        }}
      />
      <div className="relative mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-[13px] font-medium text-slate-500 transition hover:text-bework-navy"
          >
            ← Accueil BeWork
          </Link>
          <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm ring-1 ring-slate-200/80">
            Essai {SAAS_TRIAL_DAYS} jours
          </span>
        </div>

        <div className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-bework-navy sm:text-[1.65rem]">
            Créer mon espace BeWork
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Votre entreprise, vos données, votre équipe — opérationnel en moins d’une minute.
            Aucune carte bancaire.
          </p>

          <ul className="mt-5 space-y-2 text-[13px] text-slate-600">
            {[
              "Espace privé multi-utilisateurs",
              "Chantiers, devis, documents, commandes",
              `${SAAS_TRIAL_DAYS} jours pour tester sans engagement`,
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-0.5 text-bework-ok" aria-hidden>
                  ✓
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <EssayerBeWorkForm />
          </div>
        </div>
      </div>
    </div>
  );
}
