"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.12), transparent 55%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.35)] md:p-9">
          <h1 className="font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-slate-900 md:text-[1.85rem]">
            Demande enregistrée
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 md:text-[0.9375rem]">
            Votre inscription{email ? " (" : ""}
            {email ? <span className="font-semibold text-slate-900">{email}</span> : null}
            {email ? ")" : ""} est enregistrée. L&apos;équipe BeWork doit la valider avant que vous puissiez
            accéder à la plateforme.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Prochaines étapes</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Validation de votre dossier par BeWork (sous 48 h ouvrées en général)</li>
              <li>Email de confirmation lorsque votre compte est activé</li>
              <li>Connexion possible uniquement après cette validation</li>
            </ul>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="flex-1 rounded-xl border border-[color:var(--accent-600)]/70 bg-gradient-to-b from-[color:var(--accent-500)] via-[color:var(--accent-600)] to-[color:var(--accent-600)] px-4 py-3 text-center text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(29,78,216,0.38)] transition hover:border-[color:var(--accent-500)] hover:from-[color:var(--accent-600)] hover:via-[color:var(--accent-700)] hover:to-[color:var(--accent-700)] active:translate-y-px"
            >
              Contacter BeWork
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Retour à l’accueil
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-600">
            Si vous ne recevez rien, contactez-nous via{" "}
            <Link href="/contact" className="font-semibold text-[color:var(--accent-600)] hover:underline">
              le support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white via-[#fdfefe] to-[#F8FAFC] px-4">
          <p className="text-sm font-medium text-black">Chargement…</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

