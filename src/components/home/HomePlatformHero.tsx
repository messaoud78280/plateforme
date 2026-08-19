"use client";

import Link from "next/link";
import {
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_REVEAL,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const PILLARS = [
  { label: "CONSTRUIRE", color: "text-[#2563eb]", bg: "bg-[#eff6ff] border-[#bfdbfe]", dot: "bg-[#2563eb]" },
  { label: "CONNECTER", color: "text-[#7c3aed]", bg: "bg-[#f5f3ff] border-[#ddd6fe]", dot: "bg-[#7c3aed]" },
  { label: "AUTOMATISER", color: "text-[#ea580c]", bg: "bg-[#fff7ed] border-[#fed7aa]", dot: "bg-[#ea580c]" },
] as const;

const ECO_NODES_LEFT = [
  { label: "Devis / Facturation", color: "#2563eb" },
  { label: "Comptabilité", color: "#4f46e5" },
  { label: "Trésorerie", color: "#0d9488" },
  { label: "Messagerie", color: "#7c3aed" },
];

const ECO_NODES_RIGHT = [
  { label: "Planning", color: "#059669" },
  { label: "Documents", color: "#4f46e5" },
  { label: "Fournisseurs", color: "#d97706" },
  { label: "Outils métier", color: "#0d9488" },
];

const BEWORK_MODULES = ["Chantiers", "Planning", "GED", "Commandes", "Finance", "Équipes"];

export function HomePlatformHero() {
  return (
    <section
      id="hero"
      className="relative overflow-x-clip bg-white pb-16 pt-10 sm:pb-20 sm:pt-14 md:pb-24 md:pt-16 lg:pb-28 lg:pt-20"
    >
      {/* Halos de fond */}
      <div
        className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.06)_0%,transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 top-20 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.05)_0%,transparent_70%)]"
        aria-hidden
      />

      <div className="container-site">
        {/* Eyebrow piliers */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {PILLARS.map((p) => (
            <span
              key={p.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.14em] ${p.bg} ${p.color}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} aria-hidden />
              {p.label}
            </span>
          ))}
        </div>

        {/* Titre principal */}
        <div className="mx-auto mt-6 max-w-4xl text-center sm:mt-8">
          <h1 className="font-display text-balance text-[2.125rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.1rem]">
            <span className="block">La plateforme construite</span>
            <span className="block">autour de votre entreprise BTP.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[1rem] leading-relaxed text-slate-600 sm:mt-8 sm:text-lg">
            Centralisez vos chantiers, vos équipes, vos documents et votre gestion dans un environnement
            conçu pour votre organisation. BeWork peut également connecter vos logiciels existants et automatiser vos
            processus.
          </p>

          <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 sm:mt-6 sm:text-base">
            <span className="font-semibold text-[#0a0a0a]">Vous gardez ce qui fonctionne.</span>{" "}
            Nous construisons ce qui manque et faisons travailler l&apos;ensemble ensemble.
          </p>

          <div className={`mx-auto mt-8 max-w-md sm:mt-10 sm:max-w-none ${HOME_BTN_GROUP} sm:justify-center`}>
            <Link
              href="#besoin"
              className={HOME_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-decouvrir")}
            >
              Découvrir BeWork
            </Link>
            <Link
              href="#besoin"
              className={HOME_BTN_SECONDARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-parler")}
            >
              Parler de mon entreprise
            </Link>
          </div>
        </div>

        {/* Diagramme écosystème */}
        <div className="mx-auto mt-16 max-w-5xl sm:mt-20 md:mt-24" aria-hidden>
          <div className="relative flex items-center justify-center gap-0">
            {/* Colonne gauche */}
            <div className="hidden flex-col gap-3 sm:flex">
              {ECO_NODES_LEFT.map((node, i) => (
                <EcoNode
                  key={node.label}
                  label={node.label}
                  color={node.color}
                  side="left"
                  delayMs={180 + i * 70}
                />
              ))}
            </div>

            {/* Lignes gauche → centre */}
            <div className="hidden sm:block">
              <ConnectorLines count={ECO_NODES_LEFT.length} side="left" />
            </div>

            {/* Centre BeWork */}
            <div className="relative z-10 flex-shrink-0">
              <div className="relative rounded-2xl border border-[#1e3a5f]/20 bg-gradient-to-b from-[#0f1e3a] to-[#1e3a5f] px-8 py-7 text-center shadow-[0_8px_32px_rgba(30,58,95,0.35)] sm:px-12 sm:py-9">
                {/* Halo glow */}
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.2)_0%,transparent_60%)]" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/70">Votre plateforme</p>
                  <p className="font-display mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    BeWork
                  </p>
                  {/* Modules internes */}
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {BEWORK_MODULES.map((mod) => (
                      <span
                        key={mod}
                        className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Points lumineux animés */}
                <AnimatedPulse className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-400" delay={0} />
                <AnimatedPulse className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-purple-400" delay={600} />
                <AnimatedPulse className="absolute -left-1 top-1/2 h-1.5 w-1.5 rounded-full bg-orange-400" delay={1200} />
              </div>
            </div>

            {/* Lignes centre → droite */}
            <div className="hidden sm:block">
              <ConnectorLines count={ECO_NODES_RIGHT.length} side="right" />
            </div>

            {/* Colonne droite */}
            <div className="hidden flex-col gap-3 sm:flex">
              {ECO_NODES_RIGHT.map((node, i) => (
                <EcoNode
                  key={node.label}
                  label={node.label}
                  color={node.color}
                  side="right"
                  delayMs={230 + i * 70}
                />
              ))}
            </div>
          </div>

          {/* Version mobile simplifiée */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:hidden">
            {[...ECO_NODES_LEFT, ...ECO_NODES_RIGHT].map((node, i) => (
              <span
                key={node.label}
                className={`rounded-full border bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${HOME_REVEAL}`}
                style={{
                  borderColor: `${node.color}40`,
                  color: node.color,
                  animationDelay: `${100 + i * 70}ms`,
                }}
              >
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: node.color }} aria-hidden />
                {node.label}
              </span>
            ))}
          </div>

          <p className="mt-6 text-center text-sm font-medium text-slate-500">
            <span className="font-semibold text-[#0a0a0a]">Une plateforme centrale.</span> Vos outils autour.{" "}
            <span className="font-semibold text-[#0a0a0a]">Des informations qui circulent.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function EcoNode({
  label,
  color,
  side,
  delayMs,
}: {
  label: string;
  color: string;
  side: "left" | "right";
  delayMs: number;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_2px_8px_rgba(15,23,42,0.1)] ${
        side === "right" ? "flex-row-reverse" : ""
      } ${HOME_REVEAL}`}
      style={{
        borderColor: `${color}30`,
        animationDelay: `${delayMs}ms`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="whitespace-nowrap text-xs font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function ConnectorLines({ count, side }: { count: number; side: "left" | "right" }) {
  const width = 64;
  const height = count * 52;
  const cx = side === "left" ? width : 0;
  const midY = height / 2;
  const stroke = side === "left" ? "#93c5fd" : "#c4b5fd";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {Array.from({ length: count }).map((_, i) => {
        const y = 26 + i * 52;
        const x0 = side === "left" ? 0 : width;
        const x1 = side === "left" ? width : 0;
        return (
          <path
            key={i}
            d={`M${x0},${y} C${x0 + (side === "left" ? 32 : -32)},${y} ${x1 + (side === "left" ? -32 : 32)},${midY} ${x1},${midY}`}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="6 5"
            strokeDashoffset="0"
            className="motion-safe:animate-[connector-flow_1.9s_linear_infinite]"
          />
        );
      })}
    </svg>
  );
}

function AnimatedPulse({ className, delay }: { className: string; delay: number }) {
  return (
    <span
      className={`motion-safe:animate-[hero-pulse_2s_ease-in-out_infinite] ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
