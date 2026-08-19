"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_REVEAL,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const PILLARS = [
  { label: "CONSTRUIRE", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { label: "CONNECTER", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { label: "AUTOMATISER", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
] as const;

const ECO_NODES_LEFT = [
  { label: "Devis / Facturation", color: "#2563eb" },
  { label: "Comptabilité", color: "#4f46e5" },
  { label: "Trésorerie", color: "#0d9488" },
  { label: "Messagerie", color: "#7c3aed" },
];

const ECO_NODES_RIGHT = [
  { label: "Planning", color: "#059669" },
  { label: "Documents", color: "#6366f1" },
  { label: "Fournisseurs", color: "#d97706" },
  { label: "Outils métier", color: "#0d9488" },
];

const BEWORK_MODULES = [
  { label: "Chantiers", color: "#60a5fa" },
  { label: "Planning", color: "#34d399" },
  { label: "GED", color: "#a78bfa" },
  { label: "Commandes", color: "#fbbf24" },
  { label: "Finance", color: "#f87171" },
  { label: "Équipes", color: "#38bdf8" },
];

export function HomePlatformHero() {
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    // Valeurs initiales (dégradés / grille / parallax)
    el.style.setProperty("--spot-x", "50%");
    el.style.setProperty("--spot-y", "50%");
    el.style.setProperty("--spot-opacity", "0.0");
    el.style.setProperty("--grid-opacity", "0.06");
    el.style.setProperty("--hero-parallax", "0px");

    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const applyPointer = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const x = ((lastX - rect.left) / rect.width) * 100;
      const y = ((lastY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      el.style.setProperty("--spot-x", `${clampedX.toFixed(2)}%`);
      el.style.setProperty("--spot-y", `${clampedY.toFixed(2)}%`);
      el.style.setProperty("--spot-opacity", "0.95");
    };

    const onPointerMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (raf) return;
      raf = window.requestAnimationFrame(applyPointer);
    };

    const onPointerLeave = () => {
      el.style.setProperty("--spot-opacity", "0.18");
    };

    const onScroll = () => {
      const t = Math.max(0, Math.min(1, window.scrollY / 900));
      el.style.setProperty("--grid-opacity", (0.03 + t * 0.08).toFixed(3));
      el.style.setProperty("--hero-parallax", `${(-t * 10).toFixed(2)}px`);
    };

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative overflow-x-clip bg-white pb-16 pt-10 sm:pb-20 sm:pt-14 md:pb-28 md:pt-18 lg:pb-32 lg:pt-20"
    >
      {/* Halos de fond — bleu + violet */}
      <div
        className="pointer-events-none absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(ellipse at center, rgba(37,99,235,0.07) 0%, transparent 68%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 top-10 h-[500px] w-[500px] translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.06) 0%, transparent 68%)" }}
        aria-hidden
      />

      <div className="container-site">
        {/* Eyebrow piliers */}
        <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${HOME_REVEAL}`}>
          {PILLARS.map((p) => (
            <span
              key={p.label}
              className="bework-pill-holo bework-sheen inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-[0.14em] backdrop-blur-[10px] shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-px"
              style={{
                ["--pill-color" as any]: p.color,
                background: `linear-gradient(180deg, rgba(255,255,255,0.78) 0%, ${p.bg} 155%)`,
                color: p.color,
                boxShadow: `0 10px 24px ${p.color}10, inset 0 1px 0 rgba(255,255,255,0.62)`,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: p.color,
                  boxShadow: `0 0 0 3px ${p.color}16, 0 0 12px ${p.color}40`,
                }}
                aria-hidden
              />
              {p.label}
            </span>
          ))}
        </div>

        {/* Titre principal */}
        <div className="mx-auto mt-6 max-w-4xl text-center sm:mt-8">
          <h1
            className={`font-display text-balance text-[2.125rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.1rem] ${HOME_REVEAL}`}
            style={{ animationDelay: "80ms" }}
          >
            <span className="block">La plateforme construite</span>
            <span className="block">autour de votre entreprise BTP.</span>
          </h1>

          <p
            className={`mx-auto mt-6 max-w-2xl text-[1rem] leading-relaxed text-slate-600 sm:mt-8 sm:text-lg ${HOME_REVEAL}`}
            style={{ animationDelay: "160ms" }}
          >
            Centralisez vos chantiers, vos équipes, vos documents et votre gestion dans un environnement
            conçu pour votre organisation. BeWork peut également connecter vos logiciels existants et
            automatiser vos processus.
          </p>

          <p
            className={`mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:mt-5 sm:text-base ${HOME_REVEAL}`}
            style={{ animationDelay: "220ms" }}
          >
            <span className="font-semibold text-[#0a0a0a]">Vous gardez ce qui fonctionne.</span>{" "}
            Nous construisons ce qui manque et faisons travailler l&apos;ensemble ensemble.
          </p>

          <div
            className={`mx-auto mt-8 max-w-md sm:mt-10 sm:max-w-none ${HOME_BTN_GROUP} sm:justify-center ${HOME_REVEAL}`}
            style={{ animationDelay: "280ms" }}
          >
            <Link
              href="#besoin"
              className={HOME_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-decouvrir")}
            >
              Découvrir BeWork
            </Link>
            <Link
              href="#plateforme"
              className={HOME_BTN_SECONDARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-plateforme")}
            >
              Voir la plateforme
            </Link>
          </div>
        </div>

        {/* ── Diagramme écosystème ── */}
        <div
          ref={stageRef}
          className={`relative mx-auto mt-14 max-w-5xl overflow-hidden rounded-3xl sm:mt-18 md:mt-22 ${HOME_REVEAL}`}
          style={{ animationDelay: "350ms" }}
          aria-hidden
        >
          {/* Fond "stage" sombre */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#0b1526] via-[#0f1e3a] to-[#111827]" />
          {/* Halo central bleu */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(37,99,235,0.18) 0%, transparent 70%)",
            }}
          />
          {/* Spotlight au curseur */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            aria-hidden
            style={{
              opacity: "var(--spot-opacity)",
              mixBlendMode: "screen",
              background:
                "radial-gradient(520px circle at var(--spot-x) var(--spot-y), rgba(37,99,235,0.35) 0%, transparent 60%)",
              transform: "translate3d(0,var(--hero-parallax),0)",
            }}
          />
          {/* Grille subtile */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              opacity: "var(--grid-opacity)",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              transform: "translate3d(0,var(--hero-parallax),0)",
            }}
          />
          {/* Scanlines + micro-noise (localisé sur le stage) */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            aria-hidden
            style={{
              opacity: "0.08",
              mixBlendMode: "overlay",
              transform: "translate3d(0,var(--hero-parallax),0)",
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 4px), radial-gradient(rgba(255,255,255,0.12) 0.55px, transparent 0.65px)",
              backgroundSize: "100% 6px, 3px 3px",
              backgroundPosition: "0 0, 0 0",
              filter: "blur(0.1px)",
            }}
          />

          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-center justify-center gap-0">
              {/* Colonne gauche */}
              <div className="hidden flex-col gap-3 sm:flex">
                {ECO_NODES_LEFT.map((node, i) => (
                  <EcoNode key={node.label} label={node.label} color={node.color} side="left" delayMs={400 + i * 60} />
                ))}
              </div>

              {/* Lignes gauche → centre */}
              <div className="hidden sm:block">
                <ConnectorLines nodes={ECO_NODES_LEFT} side="left" />
              </div>

              {/* Centre BeWork */}
              <div className="relative z-10 flex-shrink-0">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a2e52] to-[#0f1e3a] px-7 py-6 text-center shadow-[0_0_40px_rgba(37,99,235,0.25),0_8px_32px_rgba(0,0,0,0.5)] sm:px-10 sm:py-8">
                  {/* Halo intérieur */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(96,165,250,0.18) 0%, transparent 70%)",
                    }}
                  />
                  <div className="relative">
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-blue-300/60">
                      Votre plateforme
                    </p>
                    <p className="font-display mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                      BeWork
                    </p>
                    {/* Modules internes */}
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {BEWORK_MODULES.map((mod) => (
                        <span
                          key={mod.label}
                          className="group rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-all duration-200 hover:scale-105"
                          style={{
                            borderColor: `${mod.color}30`,
                            background: `${mod.color}12`,
                            color: mod.color,
                          }}
                        >
                          {mod.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Points lumineux de coin */}
                  <AnimatedPulse
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
                    color="#60a5fa"
                    delay={0}
                  />
                  <AnimatedPulse
                    className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full"
                    color="#c4b5fd"
                    delay={700}
                  />
                  <AnimatedPulse
                    className="absolute -left-1 top-1/2 h-1.5 w-1.5 rounded-full"
                    color="#fb923c"
                    delay={1400}
                  />
                  <AnimatedPulse
                    className="absolute -right-1 bottom-1/3 h-1.5 w-1.5 rounded-full"
                    color="#34d399"
                    delay={2100}
                  />
                </div>
              </div>

              {/* Lignes centre → droite */}
              <div className="hidden sm:block">
                <ConnectorLines nodes={ECO_NODES_RIGHT} side="right" />
              </div>

              {/* Colonne droite */}
              <div className="hidden flex-col gap-3 sm:flex">
                {ECO_NODES_RIGHT.map((node, i) => (
                  <EcoNode key={node.label} label={node.label} color={node.color} side="right" delayMs={420 + i * 60} />
                ))}
              </div>
            </div>

            {/* Version mobile — pills colorées */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:hidden">
              {[...ECO_NODES_LEFT, ...ECO_NODES_RIGHT].map((node, i) => (
                <span
                  key={node.label}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${HOME_REVEAL}`}
                  style={{
                    borderColor: `${node.color}50`,
                    background: `${node.color}12`,
                    color: node.color,
                    animationDelay: `${400 + i * 55}ms`,
                  }}
                >
                  <span
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: node.color }}
                    aria-hidden
                  />
                  {node.label}
                </span>
              ))}
            </div>

            <p className="mt-6 text-center text-sm font-medium text-white/50">
              <span className="font-semibold text-white/80">Une plateforme centrale.</span> Vos outils
              autour.{" "}
              <span className="font-semibold text-white/80">Des informations qui circulent.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Composants utilitaires ── */

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
      className={`flex cursor-default items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md ${
        side === "right" ? "flex-row-reverse" : ""
      } ${HOME_REVEAL}`}
      style={{
        borderColor: `${color}40`,
        background: `${color}10`,
        animationDelay: `${delayMs}ms`,
      }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
        style={{ backgroundColor: color, color }}
        aria-hidden
      />
      <span className="whitespace-nowrap text-xs font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function ConnectorLines({ nodes, side }: { nodes: { color: string }[]; side: "left" | "right" }) {
  const count = nodes.length;
  const width = 72;
  const itemH = 44; // même que gap-3 (12px) + EcoNode (32px)
  const height = count * (itemH + 12);
  const midY = height / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {nodes.map((node, i) => {
        const y = itemH / 2 + i * (itemH + 12);
        const x0 = side === "left" ? 0 : width;
        const x1 = side === "left" ? width : 0;
        const ctrl = side === "left" ? 36 : -36;
        const d = `M${x0},${y} C${x0 + ctrl},${y} ${x1 - ctrl},${midY} ${x1},${midY}`;
        return (
          <g key={i}>
            {/* Base line — très atténuée */}
            <path d={d} stroke={node.color} strokeWidth="1" strokeOpacity="0.2" strokeLinecap="round" />
            {/* Ligne animée — flux coloré */}
            <path
              d={d}
              stroke={node.color}
              strokeWidth="1.5"
              strokeOpacity="0.7"
              strokeLinecap="round"
              strokeDasharray="8 18"
              className="motion-safe:animate-[connector-flow_2.2s_linear_infinite]"
              style={{ animationDelay: `${i * 280}ms` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function AnimatedPulse({
  className,
  color,
  delay,
}: {
  className: string;
  color: string;
  delay: number;
}) {
  return (
    <span
      className={`motion-safe:animate-[hero-pulse_2.4s_ease-in-out_infinite] ${className}`}
      style={{
        backgroundColor: color,
        boxShadow: `0 0 8px 2px ${color}80`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}
