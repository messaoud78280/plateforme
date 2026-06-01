import Link from "next/link";

export default function EnAttenteValidationPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] px-4 py-10 md:py-14">
      <div className="relative mx-auto w-full max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.35)] md:p-9">
          <h1 className="text-2xl font-semibold text-slate-900">Inscription en cours de validation</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Votre demande a bien été enregistrée. L&apos;équipe BeWork vérifie votre inscription avant
            d&apos;ouvrir l&apos;accès à la plateforme. Vous recevrez un email dès que votre compte sera validé.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Tant que la validation n&apos;est pas effectuée, la connexion à l&apos;espace client reste impossible.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="flex-1 rounded-xl border border-[color:var(--client-600)]/70 bg-[color:var(--client-600)] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--client-700)]"
            >
              Contacter BeWork
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
