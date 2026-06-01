import Link from "next/link";

export default function InscriptionRefuseePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] px-4 py-10 md:py-14">
      <div className="relative mx-auto w-full max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.35)] md:p-9">
          <h1 className="text-2xl font-semibold text-slate-900">Inscription non retenue</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Votre demande d&apos;accès à BeWork n&apos;a pas été validée. Pour toute question, contactez notre équipe.
          </p>
          <div className="mt-7">
            <Link
              href="/contact"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
