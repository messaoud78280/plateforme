"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] px-4 py-10 md:py-14">
      <div className="relative mx-auto w-full max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.35)] md:p-9">
          <h1 className="font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-slate-900 md:text-[1.85rem]">
            Demande d’essai enregistrée
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 md:text-[0.9375rem]">
            Votre demande{email ? " (" : ""}
            {email ? <span className="font-semibold text-slate-900">{email}</span> : null}
            {email ? ")" : ""} est bien reçue. BeWork doit valider votre accès avant toute connexion.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Prochaines étapes</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Validation de votre dossier entreprise par BeWork</li>
              <li>Email dès que votre essai 14 jours est activé</li>
              <li>Connexion uniquement après cette validation</li>
            </ul>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Retour à l’accueil
            </Link>
            <Link
              href="/contact"
              className="flex-1 rounded-xl bg-[#1e3a5f] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#16304f]"
            >
              Contacter BeWork
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EssayerConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-slate-600">Chargement…</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
