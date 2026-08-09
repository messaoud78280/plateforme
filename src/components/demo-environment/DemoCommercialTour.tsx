"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clearTourState,
  readTourState,
  resolveStepHref,
  stepAvailable,
  stepBodyWithContext,
  stepsForMode,
  writeTourState,
  type DemoCommercialContext,
  type DemoTourMode,
  type DemoTourPersistedState,
  type DemoTourSide,
  type DemoTourStepDef,
} from "@/lib/demo-environment/commercial-tour";
import {
  fetchCurrentDemoPersona,
  switchDemoPersona,
} from "@/lib/demo-environment/switch-persona-client";
import type { DemoPersonaKey } from "@/lib/demo-environment/personas";

type Phase = "idle" | "choose" | "tour" | "busy";

function openGlobalSearch() {
  window.dispatchEvent(new CustomEvent("bework:open-global-search"));
}

function applyHighlight(target: string | undefined) {
  document.querySelectorAll(".demo-tour-highlight").forEach((el) => {
    el.classList.remove("demo-tour-highlight");
  });
  if (!target) return;
  const el = document.querySelector(`[data-demo-target="${CSS.escape(target)}"]`);
  if (el) el.classList.add("demo-tour-highlight");
}

export function DemoCommercialTour() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<DemoTourMode | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [side, setSide] = useState<DemoTourSide>("right");
  const [ctx, setCtx] = useState<DemoCommercialContext | null>(null);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [desktop, setDesktop] = useState(true);

  const persist = useCallback((next: DemoTourPersistedState) => {
    writeTourState(next);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const saved = readTourState();
    if (saved.active && saved.mode) {
      setMode(saved.mode);
      setStepIndex(saved.stepIndex);
      setSide(saved.side);
      setPhase("tour");
    }
  }, []);

  useEffect(() => {
    if (phase !== "tour" && phase !== "choose") return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/demo/commercial-context", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { context?: DemoCommercialContext };
        if (data.context && !cancelled) setCtx(data.context);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const activeSteps = useMemo(() => {
    if (!mode) return [] as DemoTourStepDef[];
    return stepsForMode(mode).filter((s) => stepAvailable(s, ctx));
  }, [mode, ctx]);

  // Quand le contexte live arrive, les étapes require* apparaissent — clamp l’index
  useEffect(() => {
    if (!activeSteps.length) return;
    if (stepIndex > activeSteps.length - 1) {
      setStepIndex(activeSteps.length - 1);
    }
  }, [activeSteps, stepIndex]);

  const step = activeSteps[Math.min(stepIndex, Math.max(activeSteps.length - 1, 0))] ?? null;

  useEffect(() => {
    if (phase !== "tour" || !step) {
      applyHighlight(undefined);
      return;
    }
    const t = window.setTimeout(() => applyHighlight(step.highlight), 350);
    return () => {
      window.clearTimeout(t);
      applyHighlight(undefined);
    };
  }, [phase, step]);

  useEffect(() => {
    if (phase !== "tour" || !mode) return;
    persist({
      active: true,
      mode,
      stepIndex,
      side,
    });
  }, [phase, mode, stepIndex, side, persist]);

  const exitTour = useCallback(() => {
    clearTourState();
    applyHighlight(undefined);
    setPhase("idle");
    setMode(null);
    setStepIndex(0);
    setBusyMsg(null);
    setResetConfirm(false);
  }, []);

  const goNavigate = useCallback(
    async (target: DemoTourStepDef) => {
      setBusyMsg(null);
      const needPersona = target.persona;
      if (needPersona) {
        const current = await fetchCurrentDemoPersona();
        if (current !== needPersona) {
          setPhase("busy");
          const labels: Record<string, string> = {
            direction: "Direction — Marc",
            conducteur: "Conducteur — Karim",
            administratif: "Administratif — Julie",
            client: "Client — Sophie",
            fournisseur: "Fournisseur — Thomas",
          };
          setBusyMsg(`Basculement vers ${labels[needPersona] ?? needPersona}…`);
          const sw = await switchDemoPersona(needPersona);
          if (!sw.ok) {
            setBusyMsg(sw.error ?? "Impossible de changer de persona");
            setPhase("tour");
            return;
          }
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (target.promptSearch) {
        setPhase("tour");
        openGlobalSearch();
        startTransition(() => router.refresh());
        return;
      }

      const href = resolveStepHref(target, ctx);
      setPhase("tour");
      if (href) {
        startTransition(() => {
          router.push(href);
          router.refresh();
        });
      } else {
        startTransition(() => router.refresh());
      }
    },
    [ctx, router, startTransition],
  );

  const startMode = useCallback(
    async (m: DemoTourMode) => {
      setMode(m);
      setStepIndex(0);
      setPhase("tour");
      const first = stepsForMode(m).find((s) => stepAvailable(s, ctx)) ?? stepsForMode(m)[0];
      if (first) await goNavigate(first);
    },
    [ctx, goNavigate],
  );

  const goNext = useCallback(async () => {
    if (!activeSteps.length) return;
    const next = Math.min(stepIndex + 1, activeSteps.length - 1);
    setStepIndex(next);
    const target = activeSteps[next];
    if (target && !target.finale) await goNavigate(target);
    else if (target?.finale && target.persona) {
      const current = await fetchCurrentDemoPersona();
      if (current !== target.persona) {
        await switchDemoPersona(target.persona as DemoPersonaKey);
        startTransition(() => router.refresh());
      }
    }
  }, [activeSteps, stepIndex, goNavigate, router, startTransition]);

  const goPrev = useCallback(async () => {
    if (stepIndex <= 0) return;
    const prev = stepIndex - 1;
    setStepIndex(prev);
    const target = activeSteps[prev];
    if (target) await goNavigate(target);
  }, [activeSteps, stepIndex, goNavigate]);

  const skipOptional = useCallback(async () => {
    if (!step?.optional) return;
    await goNext();
  }, [step, goNext]);

  const restart = useCallback(async () => {
    if (!mode) {
      setPhase("choose");
      return;
    }
    setStepIndex(0);
    const first = activeSteps[0] ?? stepsForMode(mode)[0];
    if (first) await goNavigate(first);
  }, [mode, activeSteps, goNavigate]);

  const runReset = useCallback(async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset-scenario", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setBusyMsg(data.error ?? "Échec de la réinitialisation");
        return;
      }
      setResetConfirm(false);
      setBusyMsg("Scénario réinitialisé (v4-demo-cleanup).");
      // Recharger le contexte après reset
      const ctxRes = await fetch("/api/demo/commercial-context", { cache: "no-store" });
      if (ctxRes.ok) {
        const payload = (await ctxRes.json()) as { context?: DemoCommercialContext };
        if (payload.context) setCtx(payload.context);
      }
      startTransition(() => router.refresh());
    } finally {
      setResetting(false);
    }
  }, [router, startTransition]);

  // Styles surbrillance (injectés une fois)
  useEffect(() => {
    const id = "demo-commercial-tour-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .demo-tour-highlight {
        outline: 2px solid #1e3a5f !important;
        outline-offset: 3px;
        box-shadow: 0 0 0 4px rgba(30, 58, 95, 0.12) !important;
        border-radius: 12px;
        transition: outline 0.2s ease, box-shadow 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (!desktop && phase === "idle") {
    return null;
  }

  return (
    <>
      {phase === "idle" ? (
        <button
          type="button"
          onClick={() => setPhase("choose")}
          className="fixed bottom-20 right-4 z-40 hidden items-center gap-1.5 rounded-full border border-[#1e3a5f]/25 bg-white/95 px-3 py-2 text-xs font-semibold text-[#1e3a5f] shadow-md backdrop-blur hover:bg-[#1e3a5f] hover:text-white md:bottom-6 md:flex"
          title="Parcours de démonstration commerciale"
        >
          <span aria-hidden>▶</span>
          Présenter BeWork
        </button>
      ) : null}

      {phase === "choose" ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/20 p-4 sm:items-center">
          <div
            role="dialog"
            aria-labelledby="demo-tour-choose-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="demo-tour-choose-title" className="text-lg font-extrabold text-[#1e3a5f]">
              Présenter BeWork
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Raconter une situation réelle — pas une visite module par module.
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => void startMode("express")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#1e3a5f]/40 hover:bg-white"
              >
                <span className="block text-sm font-bold text-slate-900">Démo express</span>
                <span className="text-xs text-slate-500">~5 min · Marc → problème → Point.P → Thomas</span>
              </button>
              <button
                type="button"
                onClick={() => void startMode("complete")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#1e3a5f]/40 hover:bg-white"
              >
                <span className="block text-sm font-bold text-slate-900">Démo complète</span>
                <span className="text-xs text-slate-500">~15 min · fil complet + portails</span>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setResetConfirm((v) => !v)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Réinitialiser le scénario
              </button>
              <button
                type="button"
                onClick={exitTour}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>
            {resetConfirm ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                <p className="font-semibold">Confirmer la réinitialisation ?</p>
                <p className="mt-1">
                  Recrée le seed v4 (personas + BC-2026-043). Ne change pas le persona courant.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={resetting}
                    onClick={() => void runReset()}
                    className="rounded-md bg-amber-800 px-2.5 py-1 font-semibold text-white disabled:opacity-60"
                  >
                    {resetting ? "…" : "Confirmer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirm(false)}
                    className="rounded-md px-2.5 py-1 font-semibold text-amber-900"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : null}
            {busyMsg ? <p className="mt-2 text-xs text-slate-600">{busyMsg}</p> : null}
          </div>
        </div>
      ) : null}

      {(phase === "tour" || phase === "busy") && step && desktop ? (
        <aside
          className={`fixed top-20 z-40 flex max-h-[calc(100vh-6rem)] w-[min(100vw-1.5rem,340px)] flex-col rounded-2xl border border-slate-200/90 bg-white/95 shadow-lg backdrop-blur-sm ${
            side === "right" ? "right-3" : "left-3"
          }`}
          aria-label="Guide démo BeWork"
        >
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1e3a5f]/70">
                Démo BeWork
              </p>
              <p className="text-[11px] tabular-nums text-slate-500">
                Étape {Math.min(stepIndex + 1, activeSteps.length)} / {activeSteps.length}
                {mode === "express" ? " · Express" : " · Complète"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSide((s) => (s === "right" ? "left" : "right"))}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100"
              title="Déplacer le panneau"
            >
              {side === "right" ? "← Gauche" : "Droite →"}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
            <h3 className="text-base font-extrabold leading-snug text-[#1e3a5f]">{step.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {stepBodyWithContext(step, ctx)}
            </p>
            {step.tip ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  À expliquer
                </p>
                <p className="mt-0.5 text-xs text-slate-700">{step.tip}</p>
              </div>
            ) : null}
            {busyMsg ? <p className="mt-2 text-xs text-amber-800">{busyMsg}</p> : null}

            {step.finale ? (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={exitTour}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-sm font-semibold text-white"
                >
                  Continuer à explorer
                </button>
                <button
                  type="button"
                  onClick={() => void restart()}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Recommencer
                </button>
              </div>
            ) : (
              <div className="mt-3">
                {resolveStepHref(step, ctx) || step.promptSearch || step.actionLabel ? (
                  <button
                    type="button"
                    disabled={phase === "busy"}
                    onClick={() => void goNavigate(step)}
                    className="w-full rounded-lg border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 px-3 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/10 disabled:opacity-60"
                  >
                    {step.actionLabel ?? "Ouvrir"}
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {!step.finale ? (
            <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 px-2.5 py-2">
              <button
                type="button"
                disabled={stepIndex <= 0 || phase === "busy"}
                onClick={() => void goPrev()}
                className="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                ← Précédent
              </button>
              {step.optional ? (
                <button
                  type="button"
                  disabled={phase === "busy"}
                  onClick={() => void skipOptional()}
                  className="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Passer
                </button>
              ) : null}
              <button
                type="button"
                disabled={phase === "busy"}
                onClick={() => void goNext()}
                className="ml-auto rounded-md bg-[#1e3a5f] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                Suivant →
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-2.5 py-1.5">
            <button
              type="button"
              onClick={exitTour}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              Quitter la démo
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase("choose");
                setResetConfirm(false);
              }}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-700"
            >
              Menu
            </button>
          </div>
        </aside>
      ) : null}

      {/* Mobile : barre compacte si tour déjà actif */}
      {(phase === "tour" || phase === "busy") && step && !desktop ? (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur md:hidden">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#1e3a5f]/70">
            Démo · {stepIndex + 1}/{activeSteps.length}
          </p>
          <p className="truncate text-sm font-bold text-slate-900">{step.title}</p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => void goPrev()}
              disabled={stepIndex <= 0}
              className="rounded-md border px-2 py-1 text-xs font-semibold disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => void goNext()}
              className="rounded-md bg-[#1e3a5f] px-2 py-1 text-xs font-semibold text-white"
            >
              →
            </button>
            <button type="button" onClick={exitTour} className="ml-auto text-xs text-slate-500">
              Quitter
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
