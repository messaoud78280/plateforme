"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_REVEAL,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

type Scene = {
  idea: string;
  chips: readonly string[];
  kind: "reservation" | "crm" | "client" | "dashboard";
};

const SCENES: readonly Scene[] = [
  {
    idea: "Un système permettant à mes clients de réserver directement un rendez-vous.",
    chips: ["Réservation", "Calendrier", "Clients", "Notifications"],
    kind: "reservation",
  },
  {
    idea: "Un outil pour suivre mes prospects et mes relances.",
    chips: ["Prospects", "Opportunités", "Relances", "Dashboard"],
    kind: "crm",
  },
  {
    idea: "Un espace permettant à mes clients de suivre leur projet.",
    chips: ["Espace client", "Documents", "Progression", "Notifications"],
    kind: "client",
  },
  {
    idea: "Un tableau de bord pour comprendre mon activité en un coup d’œil.",
    chips: ["Indicateurs", "Tendances", "Alertes", "Objectifs"],
    kind: "dashboard",
  },
] as const;

/** Hero V2 — composition éditoriale asymétrique + signature Idée → Outil. */
export function HomePlatformHero() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState<"idea" | "chips" | "ui">("idea");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setPhase("ui");
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const run = () => {
      setVisible(true);
      setPhase("idea");
      timeout = setTimeout(() => {
        if (cancelled) return;
        setPhase("chips");
        timeout = setTimeout(() => {
          if (cancelled) return;
          setPhase("ui");
          timeout = setTimeout(() => {
            if (cancelled) return;
            setVisible(false);
            timeout = setTimeout(() => {
              if (cancelled) return;
              setSceneIndex((i) => (i + 1) % SCENES.length);
              run();
            }, 420);
          }, 4200);
        }, 900);
      }, 700);
    };

    run();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [reduceMotion]);

  const scene = SCENES[sceneIndex];

  return (
    <section
      id="hero"
      className="relative scroll-mt-24 overflow-hidden border-b border-slate-100"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 30% 20%, #000 20%, transparent 75%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full bg-[#2563eb]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-[22rem] w-[22rem] rounded-full bg-[#7c3aed]/10 blur-3xl"
        aria-hidden
      />

      <div className="container-site relative py-14 sm:py-16 md:py-20 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-20">
          {/* Colonne éditoriale */}
          <div className="max-w-xl lg:max-w-none lg:pt-2">
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 ${HOME_REVEAL}`}
            >
              BeWork — Créer à l’ère de l’IA
            </p>

            <h1 id="hero-heading" className="mt-6 sm:mt-8">
              <span
                className={`block font-display text-[1.35rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] sm:text-2xl md:text-[1.75rem] ${HOME_REVEAL}`}
                style={{ animationDelay: "60ms" }}
              >
                Sans savoir coder.
              </span>
              <span
                className={`mt-4 block font-display text-[2.35rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#0a0a0a] sm:mt-5 sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.15rem] ${HOME_REVEAL}`}
                style={{ animationDelay: "140ms" }}
              >
                <span className="text-[#1d4ed8]">Créez</span>{" "}
                ce que
                <br className="hidden sm:block" />
                vous imaginez.
              </span>
            </h1>

            <p
              className={`mt-7 max-w-lg text-[1.02rem] leading-relaxed text-slate-600 sm:mt-8 sm:text-lg ${HOME_REVEAL}`}
              style={{ animationDelay: "200ms" }}
            >
              Sites, applications, outils professionnels, plateformes, systèmes
              de réservation… aucune connaissance en programmation requise.
            </p>

            <p
              className={`mt-4 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base ${HOME_REVEAL}`}
              style={{ animationDelay: "240ms" }}
            >
              Vous avez l’idée. BeWork vous apprend à la construire.
            </p>

            <div
              className={`mt-8 ${HOME_BTN_GROUP} sm:mt-10 ${HOME_REVEAL}`}
              style={{ animationDelay: "320ms" }}
            >
              <Link
                href="/#journee"
                className={HOME_BTN_PRIMARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-journee")}
              >
                Découvrir la journée BeWork
              </Link>
              <Link
                href="/#demonstrations"
                className={HOME_BTN_SECONDARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-voir")}
              >
                Voir jusqu’où je peux aller
              </Link>
            </div>

            <div
              className={`mt-10 flex flex-wrap gap-2 sm:mt-12 ${HOME_REVEAL}`}
              style={{ animationDelay: "380ms" }}
            >
              {["Vous imaginez.", "Vous décrivez.", "Vous construisez."].map(
                (label, i) => (
                  <span
                    key={label}
                    className="bework-pill-holo bework-sheen inline-flex items-center rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-[#0a0a0a] backdrop-blur-[10px] sm:text-[11px]"
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
          </div>

          {/* Signature visuelle Idée → Outil */}
          <div
            className={`relative ${HOME_REVEAL}`}
            style={{ animationDelay: "220ms" }}
            aria-live="polite"
          >
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white/90 p-5 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6 md:p-7">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.45]"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(ellipse 70% 50% at 80% 0%, rgba(37,99,235,0.12), transparent 60%)",
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    J’aimerais créer…
                  </p>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                    Idée → Outil
                  </span>
                </div>

                <div
                  className={`mt-4 min-h-[4.5rem] transition-all duration-[420ms] ease-out ${
                    visible
                      ? "translate-y-0 opacity-100 blur-0"
                      : "translate-y-2 opacity-0 blur-[3px]"
                  }`}
                >
                  <p className="font-display text-lg font-bold leading-snug tracking-tight text-[#0a0a0a] sm:text-xl">
                    {scene.idea}
                  </p>
                </div>

                <div
                  className={`mt-5 flex flex-wrap gap-2 transition-all duration-500 ease-out ${
                    phase === "idea" && !reduceMotion
                      ? "translate-y-1 opacity-0"
                      : "translate-y-0 opacity-100"
                  }`}
                >
                  {scene.chips.map((chip, i) => (
                    <span
                      key={`${scene.kind}-${chip}`}
                      className="rounded-full border border-[#2563eb]/15 bg-[#eff6ff]/80 px-3 py-1 text-[11px] font-semibold text-[#1d4ed8] transition-all duration-500"
                      style={{
                        transitionDelay: reduceMotion ? "0ms" : `${i * 70}ms`,
                        opacity: phase === "idea" && !reduceMotion ? 0 : 1,
                        transform:
                          phase === "idea" && !reduceMotion
                            ? "translateY(6px)"
                            : "translateY(0)",
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div
                  className={`mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white transition-all duration-500 ease-out ${
                    phase === "ui" || reduceMotion
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-40"
                  }`}
                >
                  <MiniSceneUI kind={scene.kind} />
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400 sm:text-left">
              Une idée qui prend forme — sans expliquer comment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniSceneUI({ kind }: { kind: Scene["kind"] }) {
  if (kind === "reservation") {
    return (
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-800">Réservation</p>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Disponible
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {["Lun", "Mar", "Mer", "Jeu"].map((d, i) => (
            <div
              key={d}
              className={`rounded-lg border px-1 py-2 text-center text-[10px] font-semibold ${
                i === 1
                  ? "border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {d}
              <div className="mt-1 text-[11px]">{10 + i}:30</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-[#1d4ed8] px-3 py-2 text-xs font-bold text-white"
        >
          Confirmer le créneau
        </button>
      </div>
    );
  }

  if (kind === "crm") {
    return (
      <div className="p-4 sm:p-5">
        <p className="text-xs font-bold text-slate-800">Pipeline</p>
        <div className="mt-3 space-y-2">
          {[
            { name: "Atelier Nord", stage: "Prospect", tone: "bg-orange-50 text-orange-700" },
            { name: "Studio KL", stage: "Relance", tone: "bg-violet-50 text-violet-700" },
            { name: "Maison Verte", stage: "Proposition", tone: "bg-blue-50 text-blue-700" },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <span className="text-xs font-semibold text-slate-800">{row.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.tone}`}>
                {row.stage}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "client") {
    return (
      <div className="p-4 sm:p-5">
        <p className="text-xs font-bold text-slate-800">Espace client</p>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700">Projet en cours</span>
            <span className="font-bold text-[#1d4ed8]">68 %</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[68%] rounded-full bg-[#1d4ed8]" />
          </div>
          <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
            <li>• Devis validé</li>
            <li>• Documents partagés</li>
            <li>• Prochaine étape à confirmer</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <p className="text-xs font-bold text-slate-800">Tableau de bord</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: "Demandes", v: "128" },
          { l: "Réponse", v: "94 %" },
          { l: "Délai", v: "1,8 j" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-200 bg-white p-2.5 text-center">
            <p className="text-[9px] font-medium text-slate-500">{k.l}</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{k.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-12 items-end gap-1.5">
        {[40, 65, 48, 78, 55, 70, 42].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-[#1d4ed8]/80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
