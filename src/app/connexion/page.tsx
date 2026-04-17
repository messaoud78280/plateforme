"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

function IconBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 14.15v4.25c0 1.094-.787 2-1.75 2H5.5c-.963 0-1.75-.906-1.75-2v-4.25m16.5 0c0 1.094-.787 2-1.75 2H5.5c-.963 0-1.75-.906-1.75-2m16.5 0V8.75c0-1.094-.787-2-1.75-2H5.5c-.963 0-1.75.906-1.75 2v5.4m16.5 0v-1.65a2.25 2.25 0 00-2.25-2.25h-1.5m-12 0H5.25A2.25 2.25 0 003 12.75v1.65"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

const ACCES = [
  {
    slug: "gerante",
    badge: "Connexion gérant",
    title: "Espace Gérante / Managers",
    description: "Accès réservé à la gérante et aux managers de l'agence.",
    path: "/connexion/gerante",
    Icon: IconBriefcase,
  },
  {
    slug: "agents",
    badge: "Connexion agent",
    title: "Espace Agents",
    description: "Accès pour les agents opérationnels.",
    path: "/connexion/agents",
    Icon: IconUser,
  },
  {
    slug: "clients",
    badge: "Connexion client",
    title: "Espace Clients",
    description: "Accès pour les clients de l'agence.",
    path: "/connexion/clients",
    Icon: IconBuilding,
  },
] as const;

function ConnexionChoice() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const query = useMemo(() => (callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""), [callbackUrl]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#dce2ea] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.12), transparent 55%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.12),0_2px_0_rgba(255,255,255,0.6)_inset]">
          <div className="card-frame rounded-2xl p-8 md:p-10">
            <header className="mb-10 border-b border-[#c8d0dc]/60 pb-8 text-center">
              <h1 className="text-metallic-black font-[family-name:var(--font-playfair),ui-serif,Georgia,serif] text-[1.85rem] font-semibold leading-tight tracking-tight md:text-[2.25rem]">
                Plateforme BeWork
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-black md:text-base">
                Choisissez votre espace de connexion
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              {ACCES.map((acc) => {
                const { Icon } = acc;
                return (
                  <Link
                    key={acc.slug}
                    href={`${acc.path}${query}`}
                    className="surface-metallic-light group flex flex-col rounded-xl p-5 transition-all duration-200 hover:border-[#93c5fd]/80 hover:shadow-[0_8px_28px_rgba(29,78,216,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef0f4] md:p-6"
                    aria-label={`${acc.title} — ${acc.description}`}
                  >
                    <span className="surface-metallic-light surface-metallic-light--badge-pill mb-4 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black shadow-sm">
                      {acc.badge}
                    </span>
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[#bfdbfe]/60 bg-gradient-to-br from-[#eff6ff] to-[#dbeafe]/90 text-[#1d4ed8] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition group-hover:border-[#93c5fd] group-hover:text-[#1e40af]">
                      <Icon className="h-7 w-7" />
                    </span>
                    <h2 className="mb-2 font-[family-name:var(--font-playfair),ui-serif,Georgia,serif] text-lg font-semibold leading-snug tracking-tight text-black md:text-xl">
                      {acc.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-black">{acc.description}</p>
                    <span className="mt-4 text-xs font-semibold text-[#1d4ed8] transition group-hover:text-[#1e40af]">
                      Se connecter →
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-[#c8d0dc]/50 pt-8 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/"
                className="surface-metallic-outline flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-[#1e293b] transition hover:text-black"
              >
                <span aria-hidden>←</span>
                Retour à l&apos;accueil
              </Link>
              <Link
                href="/inscription"
                className="flex items-center justify-center rounded-xl border border-[#2563eb]/70 bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_18px_rgba(29,78,216,0.3)] transition hover:border-[#3b82f6] hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] active:translate-y-px"
              >
                Créer un compte (clients)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#dce2ea] px-4">
          <p className="text-sm font-medium text-black">Chargement…</p>
        </div>
      }
    >
      <ConnexionChoice />
    </Suspense>
  );
}
