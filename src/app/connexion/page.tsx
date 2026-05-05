"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2.25l7.5 4.125V12c0 5.25-3.75 9.75-7.5 9.75S4.5 17.25 4.5 12V6.375L12 2.25Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12l1.5 1.5L15.75 9" />
    </svg>
  );
}

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
    emphasis: "Pilotage global, suivi des chantiers et performance.",
    accent: "blue",
    path: "/connexion/gerante",
    Icon: IconBriefcase,
  },
  {
    slug: "agents",
    badge: "Connexion agent",
    title: "Espace Agents",
    description: "Accès pour les agents opérationnels.",
    emphasis: "Traitement des missions, coordination et suivi opérationnel.",
    accent: "violet",
    path: "/connexion/agents",
    Icon: IconUser,
  },
  {
    slug: "clients",
    badge: "Connexion client",
    title: "Espace Clients",
    description: "Accès pour les clients de l'agence.",
    emphasis: "Suivi de vos demandes, échanges et avancement en temps réel.",
    accent: "green",
    path: "/connexion/clients",
    Icon: IconBuilding,
  },
] as const;

type Accent = (typeof ACCES)[number]["accent"];

function getAccent(acc: Accent) {
  if (acc === "violet") {
    return {
      badge: "bg-[color:var(--agent-50)] text-[color:var(--agent-700)] border-[#e9d5ff]",
      iconWrap: "bg-[color:var(--agent-50)] text-[color:var(--agent-700)] border-[#e9d5ff]",
      emphasis: "text-[color:var(--agent-700)]",
      link: "text-[color:var(--agent-700)]",
    } as const;
  }
  if (acc === "green") {
    return {
      badge: "bg-[color:var(--client-50)] text-[color:var(--client-700)] border-[#bbf7d0]",
      iconWrap: "bg-[color:var(--client-50)] text-[color:var(--client-700)] border-[#bbf7d0]",
      emphasis: "text-[color:var(--client-700)]",
      link: "text-[color:var(--client-700)]",
    } as const;
  }
  return {
    badge: "bg-[color:var(--primary-50)] text-[color:var(--accent-600)] border-[#bfdbfe]",
    iconWrap: "bg-[color:var(--primary-50)] text-[color:var(--accent-600)] border-[#bfdbfe]",
    emphasis: "text-[color:var(--accent-600)]",
    link: "text-[color:var(--accent-600)]",
  } as const;
}

function ConnexionChoice() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const query = useMemo(() => (callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""), [callbackUrl]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] px-4 py-10 md:py-14">
      {/* Fond métallisé incliné à droite (style accueil) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-6%] top-[-12rem] -bottom-[56rem] z-0 w-[46%] skew-x-[-12deg] opacity-[0.78] md:top-[-14rem] md:-bottom-[68rem]"
        style={{
          background: "linear-gradient(135deg, #F8FAFC 0%, #D7E0EA 45%, #EEF3F8 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-6%] top-[-12rem] -bottom-[56rem] z-0 w-[46%] skew-x-[-12deg] opacity-30 md:top-[-14rem] md:-bottom-[68rem]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(120deg, rgba(15,23,42,0.14) 0px, rgba(15,23,42,0.14) 1px, transparent 1px, transparent 7px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/60 via-transparent to-transparent"
        aria-hidden
      />

      <div className="container-site relative z-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-[0_18px_55px_-28px_rgba(15,23,42,0.18)] ring-1 ring-slate-100/80 backdrop-blur-[2px] md:p-10">
            <header className="mb-8 border-b border-[#c8d0dc]/60 pb-6 text-center">
              <h1 className="font-sans text-[1.9rem] font-extrabold leading-tight tracking-tight text-slate-950 md:text-[2.4rem]">
                Accédez à votre espace <span className="text-[#2F5BFF]">BeWork</span>
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 md:text-base">
                Un accès sécurisé à votre espace de travail, adapté à votre rôle.
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              {ACCES.map((acc) => {
                const { Icon } = acc;
                const a = getAccent(acc.accent);
                return (
                  <Link
                    key={acc.slug}
                    href={`${acc.path}${query}`}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#93c5fd]/80 hover:shadow-[0_34px_90px_-44px_rgba(15,23,42,0.42)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:p-6"
                    aria-label={`${acc.title} — ${acc.description}`}
                  >
                    <span
                      className={`mb-4 w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm ${a.badge}`}
                    >
                      {acc.badge}
                    </span>
                    <span
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition group-hover:brightness-[0.98] ${a.iconWrap}`}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                    <h2 className="mb-2 font-sans text-lg font-semibold leading-snug tracking-tight text-black md:text-xl">
                      {acc.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-700">{acc.description}</p>
                    <p className={`mt-3 text-sm font-semibold leading-relaxed ${a.emphasis}`}>{acc.emphasis}</p>
                    <span className={`mt-4 text-xs font-semibold transition group-hover:opacity-90 ${a.link}`}>
                      Se connecter →
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-[#c8d0dc]/50 pt-8 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
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

            <p className="mt-4 text-center text-xs text-slate-700 md:text-sm">
              Besoin d&apos;aide ?{" "}
              <Link href="/contact" className="font-semibold text-[#1d4ed8] hover:text-[#1e40af]">
                Contactez-nous
              </Link>
              .
            </p>
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white via-[#fdfefe] to-[#F8FAFC] px-4">
          <p className="text-sm font-medium text-black">Chargement…</p>
        </div>
      }
    >
      <ConnexionChoice />
    </Suspense>
  );
}
