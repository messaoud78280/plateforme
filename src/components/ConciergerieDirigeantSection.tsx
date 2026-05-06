import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  Search,
} from "lucide-react";
import { ConciergeDashboardMockup } from "@/components/ConciergeDashboardMockup";

const BLUE = "#2F5BFF";

export function ConciergerieDirigeantSection() {
  return (
    <section id="conciergerie" className="relative overflow-visible bg-transparent py-10 md:py-12">
      <div className="container-site relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        {/* LEFT */}
        <div className="max-w-xl">
          <p
            className="mb-4 text-[12px] font-bold uppercase tracking-[0.22em]"
            style={{ color: BLUE }}
          >
            CONCIERGERIE DIRIGEANT
          </p>

          <h2 className="text-balance text-[clamp(1.75rem,1.1rem+2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-slate-900">
            Votre temps est précieux. <span style={{ color: BLUE }}>On gère le reste.</span>
          </h2>

          <p className="mt-6 text-[17px] leading-relaxed text-slate-600">
            BeWork prend en charge vos imprévus de dirigeant&nbsp;: réservations, recherches, organisation — exécutées à
            distance, en votre nom.
          </p>

          <div className="mt-9 space-y-5">
            <div className="flex items-start gap-4">
              <div
                className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 ring-1 ring-blue-100"
                style={{ color: BLUE }}
                aria-hidden
              >
                <Briefcase className="size-[22px]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-slate-900">Déplacements &amp; réservations</p>
                <p className="mt-1 text-[14px] leading-snug text-slate-500">Hôtels, restaurants, transports, billets…</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 ring-1 ring-blue-100"
                style={{ color: BLUE }}
                aria-hidden
              >
                <Search className="size-[22px]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-slate-900">Recherches &amp; comparaisons</p>
                <p className="mt-1 text-[14px] leading-snug text-slate-500">Véhicules, engins, matériel, prestataires…</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 ring-1 ring-blue-100"
                style={{ color: BLUE }}
                aria-hidden
              >
                <CalendarDays className="size-[22px]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-slate-900">Coordination &amp; organisation</p>
                <p className="mt-1 text-[14px] leading-snug text-slate-500">Prestataires, créneaux, confirmations, suivi…</p>
              </div>
            </div>
          </div>

          <div
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-[13px] font-semibold text-blue-700 ring-1 ring-blue-100"
            style={{ color: BLUE }}
          >
            <span className="inline-block size-2.5 rounded-full bg-blue-600" aria-hidden style={{ backgroundColor: BLUE }} />
            Disponible 24h/24 — sur demande
          </div>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-semibold text-white shadow-[0_18px_40px_-22px_rgba(47,91,255,0.55)] transition hover:brightness-[0.98]"
              style={{ backgroundColor: BLUE }}
            >
              Demander un devis conciergerie <span aria-hidden>→</span>
            </Link>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-[13px] text-slate-600">
              <p className="font-semibold text-slate-900">Sur devis personnalisé</p>
              <p className="mt-0.5">Tarif adapté à vos besoins et au volume de demandes. 24h/24.</p>
            </div>
          </div>
        </div>

        {/* RIGHT — mockup UI */}
        <div className="flex w-full items-center justify-center overflow-visible">
          <div className="w-full max-w-[480px] origin-center scale-[0.9] lg:scale-[0.95] -translate-x-6 lg:-translate-x-10 translate-y-12">
            <ConciergeDashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

