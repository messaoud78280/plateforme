import type { ReactNode } from "react";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";

type DemoShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** Affiche header/footer marketing complets (défaut true). */
  marketingChrome?: boolean;
};

/** Enveloppe commune des démonstrations interactives BeWork. */
export function DemoShell({ title, description, children, marketingChrome = true }: DemoShellProps) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {marketingChrome ? <MarketingSiteHeader plainBg /> : null}

      <main className="mx-auto max-w-site px-4 py-8 sm:px-6 sm:py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-[#1d4ed8]/25 bg-[#eff6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]">
              Démonstration BeWork
            </span>
            <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>
            ) : null}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
              Ce type de projet fait partie des possibilités que nous abordons pendant nos formations.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/demonstrations" className={CTA_SECONDARY}>
              ← Démonstrations
            </Link>
            <Link
              href="/formation"
              className="inline-flex items-center justify-center rounded-xl border border-[#1d4ed8]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff]"
            >
              La formation
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Données fictives — aucune inscription requise.{" "}
          <Link href="/contact#participer" className="font-semibold text-[#1d4ed8] hover:underline">
            Participer à une session
          </Link>
        </p>
      </main>

      {marketingChrome ? <MarketingSiteFooter /> : null}
    </div>
  );
}
