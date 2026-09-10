import type { ReactNode } from "react";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";

type DemoShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  marketingChrome?: boolean;
};

/** Enveloppe commune des démonstrations interactives BeWork. */
export function DemoShell({ title, description, children, marketingChrome = true }: DemoShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <BwAtmosphere variant="creation" />
      {marketingChrome ? <MarketingSiteHeader plainBg /> : null}

      <main className="relative z-[1] mx-auto max-w-site px-4 py-8 sm:px-6 sm:py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-[#275BE8]/25 bg-[#F1F6FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#275BE8]">
              Démonstration BeWork
            </span>
            <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#0B0D12] sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#42526B] sm:text-base">
                {description}
              </p>
            ) : null}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#8190A8]">
              Ce type de projet fait partie des possibilités que nous abordons pendant nos formations.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/demonstrations" className={CTA_SECONDARY}>
              ← Démonstrations
            </Link>
            <Link
              href="/formation"
              className="inline-flex items-center justify-center rounded-xl border border-[#275BE8]/30 bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#275BE8] backdrop-blur-sm transition hover:bg-[#F1F6FF]"
            >
              La formation
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[rgba(45,75,130,0.10)] bg-[rgba(255,255,255,0.92)] shadow-[0_12px_40px_rgba(30,50,90,0.06)] backdrop-blur-[14px]">
          {children}
        </div>

        <div className="mt-8 rounded-2xl border border-[rgba(45,75,130,0.10)] bg-[rgba(255,255,255,0.82)] p-5 text-center backdrop-blur-sm sm:p-6">
          <p className="font-display text-lg font-extrabold tracking-tight text-[#0B0D12] sm:text-xl">
            Et si votre idée devenait un outil&nbsp;?
          </p>
          <Link
            href="/formation"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#2458E8,#1760FF)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(39,91,232,0.22)]"
          >
            Découvrir la journée BeWork →
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-[#8190A8]">
          Données fictives — aucune inscription requise.{" "}
          <Link href="/contact#participer" className="font-semibold text-[#275BE8] hover:underline">
            Participer à une session
          </Link>
        </p>
      </main>

      {marketingChrome ? <MarketingSiteFooter /> : null}
    </div>
  );
}
