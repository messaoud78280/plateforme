"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_REVEAL,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const CREATE_ROTATIONS = [
  "un site pour mon activité.",
  "un système de réservation.",
  "une application pour mes clients.",
  "mon propre CRM.",
  "un outil pour organiser mon entreprise.",
  "un espace client.",
  "un tableau de bord.",
  "une plateforme adaptée à mon métier.",
  "quelque chose qui n’existe pas encore.",
] as const;

const ECO_NODES_LEFT = [
  { label: "Messagerie", color: "#7c3aed" },
  { label: "Agenda", color: "#2563eb" },
  { label: "Réservation", color: "#0d9488" },
  { label: "CRM", color: "#ea580c" },
] as const;

const ECO_NODES_RIGHT = [
  { label: "Dashboard", color: "#4f46e5" },
  { label: "Site", color: "#1d4ed8" },
  { label: "Espace client", color: "#059669" },
  { label: "Documents", color: "#6366f1" },
] as const;

const BEWORK_MODULES = [
  { label: "Idée", color: "#a78bfa" },
  { label: "Prototype", color: "#60a5fa" },
  { label: "Outil", color: "#34d399" },
  { label: "Espace client", color: "#fb923c" },
  { label: "Dashboard", color: "#818cf8" },
  { label: "Site", color: "#38bdf8" },
] as const;

/** Hero — première impression : la possibilité avant la formation. */
export function HomePlatformHero() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [rotIndex, setRotIndex] = useState(0);
  const [rotVisible, setRotVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const cycle = () => {
      timeout = setTimeout(() => {
        if (cancelled) return;
        setRotVisible(false);
        timeout = setTimeout(() => {
          if (cancelled) return;
          setRotIndex((i) => (i + 1) % CREATE_ROTATIONS.length);
          setRotVisible(true);
          cycle();
        }, 380);
      }, 2800);
    };
    cycle();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [reduceMotion]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    if (reduceMotion) {
      el.style.setProperty("--spot-x", "50%");
      el.style.setProperty("--spot-y", "42%");
      el.style.setProperty("--spot-opacity", "0.35");
      el.style.setProperty("--grid-opacity", "0.06");
      el.style.setProperty("--hero-parallax", "0px");
      return;
    }

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
      el.style.setProperty("--spot-x", `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
      el.style.setProperty("--spot-y", `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
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

    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        const t = Math.max(0, Math.min(1, window.scrollY / 900));
        el.style.setProperty("--grid-opacity", (0.03 + t * 0.08).toFixed(3));
        el.style.setProperty("--hero-parallax", `${(-t * 10).toFixed(2)}px`);
      });
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
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
    };
  }, [reduceMotion]);

  return (
    <section
      id="hero"
      className="relative overflow-x-clip bg-white pb-16 pt-10 sm:pb-20 sm:pt-14 md:pb-28 md:pt-18 lg:pb-32 lg:pt-20"
    >
      <div
        className="pointer-events-none absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(37,99,235,0.07) 0%, transparent 68%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 top-10 h-[500px] w-[500px] translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,58,237,0.06) 0%, transparent 68%)",
        }}
        aria-hidden
      />

      <div className="container-site">
        <div className="mx-auto max-w-4xl text-center">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 ${HOME_REVEAL}`}
          >
            Créer à l’ère de l’IA
          </p>

          <h1 className="mt-5 sm:mt-7">
            <span
              className={`block font-display text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-slate-400 sm:text-xl md:text-2xl ${HOME_REVEAL}`}
              style={{ animationDelay: "60ms" }}
            >
              Avant, il fallait savoir coder.
            </span>
            <span
              className={`mt-3 block font-display text-balance text-[2.05rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:mt-4 sm:text-[3.1rem] md:text-[3.55rem] lg:text-[4rem] ${HOME_REVEAL}`}
              style={{ animationDelay: "140ms" }}
            >
              Aujourd’hui, il faut savoir{" "}
              <span className="relative inline-block">
                <span className="relative z-10">quoi créer.</span>
                <span
                  className="absolute inset-x-0 bottom-1 -z-0 h-[0.28em] rounded-sm bg-[#2563eb]/12 sm:bottom-1.5"
                  aria-hidden
                />
              </span>
            </span>
          </h1>

          <p
            className={`mx-auto mt-6 max-w-2xl text-[1rem] leading-relaxed text-slate-600 sm:mt-8 sm:text-lg ${HOME_REVEAL}`}
            style={{ animationDelay: "200ms" }}
          >
            Sites, applications, outils professionnels, plateformes, systèmes de
            réservation… L’intelligence artificielle permet aujourd’hui de
            transformer une idée en projet concret, même lorsque l’on part de
            zéro.
          </p>

          <p
            className={`mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base ${HOME_REVEAL}`}
            style={{ animationDelay: "240ms" }}
          >
            BeWork vous apprend comment commencer à construire les vôtres.
          </p>

          <p
            className={`mx-auto mt-5 inline-flex items-center rounded-full border border-[#2563eb]/20 bg-[#eff6ff] px-4 py-1.5 text-[12px] font-bold tracking-wide text-[#1d4ed8] sm:mt-6 sm:text-[13px] ${HOME_REVEAL}`}
            style={{ animationDelay: "280ms" }}
          >
            Aucune connaissance en programmation requise.
          </p>

          <div
            className={`mx-auto mt-8 max-w-md sm:mt-10 sm:max-w-none ${HOME_BTN_GROUP} sm:justify-center ${HOME_REVEAL}`}
            style={{ animationDelay: "320ms" }}
          >
            <Link
              href="/demonstrations"
              className={HOME_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-creer")}
            >
              Découvrir ce que je peux créer
            </Link>
            <Link
              href="/formation"
              className={HOME_BTN_SECONDARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-journee")}
            >
              Découvrir la journée BeWork
            </Link>
          </div>
        </div>

        {/* Animation JE VOUDRAIS CRÉER… */}
        <div
          className={`mx-auto mt-12 max-w-3xl text-center sm:mt-14 ${HOME_REVEAL}`}
          style={{ animationDelay: "380ms" }}
          aria-live="polite"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Je voudrais créer…
          </p>
          <div className="relative mx-auto mt-3 flex h-[3.25rem] items-center justify-center overflow-hidden sm:h-[3.75rem]">
            <p
              key={rotIndex}
              className={`font-display text-balance text-xl font-extrabold tracking-tight text-[#0a0a0a] transition-all duration-[380ms] ease-out sm:text-2xl md:text-[1.75rem] ${
                rotVisible
                  ? "translate-y-0 opacity-100 blur-0"
                  : "translate-y-2 opacity-0 blur-[4px]"
              }`}
            >
              {CREATE_ROTATIONS[rotIndex]}
            </p>
          </div>
        </div>

        {/* Triade */}
        <div
          className={`mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:mt-12 sm:gap-3 ${HOME_REVEAL}`}
          style={{ animationDelay: "420ms" }}
        >
          {["Vous imaginez.", "Vous décrivez.", "Vous construisez."].map(
            (label, i) => (
              <span
                key={label}
                className="bework-pill-holo bework-sheen inline-flex items-center rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-[#0a0a0a] backdrop-blur-[10px] sm:text-xs"
                style={{
                  ["--pill-color" as string]:
                    i === 0 ? "#2563eb" : i === 1 ? "#7c3aed" : "#ea580c",
                  background:
                    i === 0
                      ? "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, #eff6ff 155%)"
                      : i === 1
                        ? "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, #f5f3ff 155%)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, #fff7ed 155%)",
                  boxShadow:
                    "0 10px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.62)",
                }}
              >
                {label}
              </span>
            ),
          )}
        </div>

        <p
          className={`mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-base ${HOME_REVEAL}`}
          style={{ animationDelay: "460ms" }}
        >
          BeWork vous apprend à transformer vos idées en projets numériques grâce
          à l’intelligence artificielle, même si vous n’avez jamais écrit une
          ligne de code.
        </p>

        {/* Stage écosystème — coque visuelle conservée */}
        <div
          ref={stageRef}
          className={`relative mx-auto mt-14 max-w-5xl overflow-hidden rounded-3xl sm:mt-18 md:mt-22 ${HOME_REVEAL}`}
          style={{ animationDelay: "520ms" }}
          aria-hidden
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#0b1526] via-[#0f1e3a] to-[#111827]" />
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(37,99,235,0.18) 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              opacity: "var(--spot-opacity)",
              mixBlendMode: "screen",
              background:
                "radial-gradient(520px circle at var(--spot-x) var(--spot-y), rgba(37,99,235,0.35) 0%, transparent 60%)",
              transform: "translate3d(0,var(--hero-parallax),0)",
            }}
          />
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
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              opacity: "0.08",
              mixBlendMode: "overlay",
              transform: "translate3d(0,var(--hero-parallax),0)",
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 4px), radial-gradient(rgba(255,255,255,0.12) 0.55px, transparent 0.65px)",
              backgroundSize: "100% 6px, 3px 3px",
            }}
          />

          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-center justify-center gap-0">
              <div className="hidden flex-col gap-3 sm:flex">
                {ECO_NODES_LEFT.map((node, i) => (
                  <EcoNode
                    key={node.label}
                    label={node.label}
                    color={node.color}
                    side="left"
                    delayMs={400 + i * 60}
                  />
                ))}
              </div>
              <div className="hidden sm:block">
                <ConnectorLines nodes={ECO_NODES_LEFT} side="left" />
              </div>

              <div className="relative z-10 flex-shrink-0">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a2e52] to-[#0f1e3a] px-7 py-6 text-center shadow-[0_0_40px_rgba(37,99,235,0.25),0_8px_32px_rgba(0,0,0,0.5)] sm:px-10 sm:py-8">
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(96,165,250,0.18) 0%, transparent 70%)",
                    }}
                  />
                  <div className="relative">
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-blue-300/60">
                      Votre idée
                    </p>
                    <p className="font-display mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                      BeWork
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {BEWORK_MODULES.map((mod) => (
                        <span
                          key={mod.label}
                          className="rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-all duration-200 hover:scale-105"
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

              <div className="hidden sm:block">
                <ConnectorLines nodes={ECO_NODES_RIGHT} side="right" />
              </div>
              <div className="hidden flex-col gap-3 sm:flex">
                {ECO_NODES_RIGHT.map((node, i) => (
                  <EcoNode
                    key={node.label}
                    label={node.label}
                    color={node.color}
                    side="right"
                    delayMs={420 + i * 60}
                  />
                ))}
              </div>
            </div>

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
              <span className="font-semibold text-white/80">
                Le site montre ce qui est possible.
              </span>{" "}
              La journée vous apprend comment y arriver.
            </p>
          </div>
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

function ConnectorLines({
  nodes,
  side,
}: {
  nodes: readonly { color: string }[];
  side: "left" | "right";
}) {
  const count = nodes.length;
  const width = 72;
  const itemH = 44;
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
            <path
              d={d}
              stroke={node.color}
              strokeWidth="1"
              strokeOpacity="0.2"
              strokeLinecap="round"
            />
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
