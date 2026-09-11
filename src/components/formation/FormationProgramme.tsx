"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { PROGRAM_STEPS, type ProgramStep } from "./programme/data";
import styles from "./FormationProgramme.module.css";

type Rect = { left: number; top: number; width: number; height: number };

const STEP_COUNT = PROGRAM_STEPS.length;

/**
 * Hotspots timeline — positions explicites (% du stage), calibrées sur l’image.
 * Chaque index correspond 1:1 à PROGRAM_STEPS[index] (pas de formule index±1).
 */
const STEP_HOTSPOTS: readonly Rect[] = [
  { left: 2.0, top: 22.87, width: 28.2, height: 5.5 }, // 09:00 Découvrir
  { left: 2.0, top: 28.37, width: 28.2, height: 5.5 }, // 09:45 Comprendre
  { left: 2.0, top: 33.87, width: 28.2, height: 5.5 }, // 10:15 Préparer
  { left: 2.0, top: 39.37, width: 28.2, height: 5.5 }, // 10:45 Première création
  { left: 2.0, top: 44.87, width: 28.2, height: 5.5 }, // 11:30 Modifier
  { left: 2.0, top: 50.37, width: 28.2, height: 5.5 }, // 12:30 Pause
  { left: 2.0, top: 55.87, width: 28.2, height: 5.5 }, // 13:30 Construire
  { left: 2.0, top: 61.37, width: 28.2, height: 5.5 }, // 14:30 Comprendre construction
  { left: 2.0, top: 66.87, width: 28.2, height: 5.5 }, // 15:15 Tester
  { left: 2.0, top: 72.37, width: 28.2, height: 5.5 }, // 16:00 Votre idée
  { left: 2.0, top: 77.87, width: 28.2, height: 5.5 }, // 16:40 Continuer
  { left: 2.0, top: 83.37, width: 28.2, height: 5.5 }, // 17:00 Conclusion
] as const;

const PERIODS = [
  {
    id: "matin",
    label: "Matin — Découvrir, Comprendre, Préparer, Créer, Modifier",
    rect: { left: 37.2, top: 10.8, width: 29.4, height: 10.2 } satisfies Rect,
  },
  {
    id: "apres-midi",
    label: "Après-midi — Construire, Comprendre, Tester, Votre idée, Conclure",
    rect: { left: 67.2, top: 10.8, width: 29.6, height: 10.2 } satisfies Rect,
  },
] as const;

/** Zone du panneau imprimé — HTML opaque + asset blanchi (sous MATIN / APRÈS-MIDI). */
const PANEL: Rect = { left: 32.2, top: 20.0, width: 66.6, height: 66.5 };

const FOOTER = [
  {
    id: "accompagnement",
    label: "Accompagnement en direct — Posez vos questions à tout moment",
    rect: { left: 4.2, top: 88.2, width: 29.5, height: 8.6 },
  },
  {
    id: "manipulation",
    label: "Manipulation en temps réel — Vous faites, pas seulement vous regardez",
    rect: { left: 35.2, top: 88.2, width: 29.5, height: 8.6 },
  },
  {
    id: "resultats",
    label: "Des résultats concrets — À chaque étape de la journée",
    rect: { left: 66.2, top: 88.2, width: 29.5, height: 8.6 },
  },
] as const;

function rectStyle(r: Rect): CSSProperties {
  return {
    left: `${r.left}%`,
    top: `${r.top}%`,
    width: `${r.width}%`,
    height: `${r.height}%`,
  };
}

function ProgramPanel({
  step,
  direction,
  panelId,
}: {
  step: ProgramStep;
  direction: 1 | -1;
  panelId: string;
}) {
  const variant = step.variant ?? "default";

  return (
    <article
      key={step.id}
      id={panelId}
      className={[
        styles.panel,
        variant === "idea" ? styles.panelIdea : "",
        variant === "pause" ? styles.panelPause : "",
        variant === "close" ? styles.panelClose : "",
        direction > 0 ? styles.panelInDown : styles.panelInUp,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
    >
      <header className={styles.panelHead}>
        <div className={styles.panelMeta}>
          <p className={styles.panelKicker}>
            {`Module ${step.module}`}
            <span aria-hidden="true"> · </span>
            <time dateTime={`T${step.time}`}>{step.time}</time>
          </p>
          {step.badge ? <span className={styles.panelBadge}>{step.badge}</span> : null}
        </div>
        <h3 className={styles.panelTitle}>{step.title}</h3>
        <p className={styles.panelLead}>{step.subtitle}</p>
      </header>

      {variant === "idea" && step.ideaQuestions ? (
        <>
          <div className={styles.questions}>
            {step.ideaQuestions.map((q) => (
              <div key={q.label} className={styles.question}>
                <p className={styles.questionLabel}>{q.label}</p>
                <p className={styles.questionText}>{q.text}</p>
              </div>
            ))}
          </div>
          {step.ideaFlow ? (
            <div className={styles.ideaFlow} aria-label="Progression de l’idée">
              {step.ideaFlow.map((node, i) => (
                <div key={node} className={styles.ideaFlowItem}>
                  {i > 0 ? <span className={styles.ideaFlowArrow} aria-hidden /> : null}
                  <span className={styles.ideaFlowNode}>{node}</span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {variant === "pause" ? (
        <div className={styles.tracks}>
          <div className={styles.trackCard}>
            <p className={styles.trackLabel}>Matinée</p>
            <p className={styles.trackPath}>{(step.morningTrack ?? []).join(" → ")}</p>
          </div>
          <div className={styles.trackCard}>
            <p className={styles.trackLabel}>Après-midi</p>
            <p className={styles.trackPath}>{(step.afternoonTrack ?? []).join(" → ")}</p>
          </div>
        </div>
      ) : null}

      {variant === "close" && step.closingArc ? (
        <div className={styles.closingArc}>
          <p className={styles.closingFrom}>{step.closingArc.from}</p>
          <span className={styles.closingArrow} aria-hidden>
            →
          </span>
          <p className={styles.closingTo}>{step.closingArc.to}</p>
          <p className={styles.closingNote}>{step.closingArc.note}</p>
        </div>
      ) : null}

      {step.actions.length > 0 ? (
        <section className={styles.block}>
          <h4 className={styles.blockLabel}>Pendant cette étape</h4>
          <ul className={styles.actions}>
            {step.actions.map((action) => (
              <li key={action}>
                <span className={styles.check} aria-hidden>
                  <svg viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6.2 4.8 8.5 9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {action}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step.tools.length > 0 ? (
        <section className={styles.block}>
          <h4 className={styles.blockLabel}>Vous allez manipuler</h4>
          <ul className={styles.tools}>
            {step.tools.map((tool) => (
              <li key={tool} className={styles.tool}>
                {tool}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className={styles.outcome}>
        <p className={styles.outcomeLabel}>À la fin de cette étape</p>
        <p className={styles.outcomeText}>{step.result}</p>
      </footer>
    </article>
  );
}

/** Programme — image de référence + panneau HTML dynamique. */
export function FormationProgramme() {
  const rootRef = useRef<HTMLElement | null>(null);
  const panelId = useId();
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [active, setActive] = useState(2);
  const [prevActive, setPrevActive] = useState(2);
  const [hoverStep, setHoverStep] = useState<number | null>(null);
  const pointerRaf = useRef(0);

  const direction: 1 | -1 = active >= prevActive ? 1 : -1;
  const step = PROGRAM_STEPS[active]!;

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);

    const mq = window.matchMedia("(max-width: 720px)");
    const syncMobile = () => setIsMobile(mq.matches);
    syncMobile();
    mq.addEventListener("change", syncMobile);

    const el = rootRef.current;
    if (!el) {
      return () => mq.removeEventListener("change", syncMobile);
    }

    if (prefersReduced) {
      setReady(true);
      return () => mq.removeEventListener("change", syncMobile);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", syncMobile);
    };
  }, []);

  const select = useCallback((index: number) => {
    const next = Math.max(0, Math.min(STEP_COUNT - 1, index));
    setActive((current) => {
      if (current !== next) setPrevActive(current);
      return next;
    });
  }, []);

  const onPanelMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    if (pointerRaf.current) cancelAnimationFrame(pointerRaf.current);
    pointerRaf.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    });
  };

  const onStepKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      select(Math.min(STEP_COUNT - 1, index + 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      select(Math.max(0, index - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      select(0);
    } else if (e.key === "End") {
      e.preventDefault();
      select(STEP_COUNT - 1);
    }
  };

  const rootClass = [
    styles.section,
    ready ? styles.ready : "",
    reduced ? styles.reduced : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={rootRef}
      id="programme"
      className={rootClass}
      aria-labelledby="programme-title"
    >
      <div className={styles.shell}>
        <h2 id="programme-title" className={styles.srOnly}>
          Une journée. Plusieurs déclics.
        </h2>

        {!isMobile ? (
          <div className={styles.desktopBoard}>
            <div className={styles.frame}>
              <div className={styles.scroll}>
                <div className={styles.stage}>
                  <Image
                    src="/marketing/formation-programme-scene.jpg?v=12"
                    alt="Programme de la journée de formation BeWork, de la découverte à la mise en pratique avec l’IA"
                    width={2048}
                    height={1364}
                    sizes="(max-width: 1100px) 100vw, min(1560px, 96vw)"
                    className={styles.scene}
                    quality={90}
                    unoptimized
                    priority={false}
                    draggable={false}
                  />

                  <div className={styles.overlay} role="listbox" aria-label="Étapes du programme">
                    {PROGRAM_STEPS.map((item, i) => {
                      const selected = active === i;
                      const hovered = hoverStep === i;
                      const hot = STEP_HOTSPOTS[i]!;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          className={[
                            styles.hot,
                            styles.hotStep,
                            selected ? styles.hotActive : "",
                            hovered ? styles.hotHover : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={rectStyle(hot)}
                          aria-label={`${item.time} — ${item.title}`}
                          aria-selected={selected}
                          aria-controls={panelId}
                          onClick={() => select(i)}
                          onMouseEnter={() => setHoverStep(i)}
                          onMouseLeave={() => setHoverStep(null)}
                          onFocus={() => setHoverStep(i)}
                          onBlur={() => setHoverStep(null)}
                          onKeyDown={(e) => onStepKeyDown(e, i)}
                        >
                          <span className={styles.stepDot} aria-hidden />
                          <span className={styles.stepSheen} aria-hidden />
                        </button>
                      );
                    })}

                    {PERIODS.map((period) => (
                      <button
                        key={period.id}
                        type="button"
                        className={`${styles.hot} ${styles.hotPeriod}`}
                        style={rectStyle(period.rect)}
                        aria-label={period.label}
                      >
                        <span className={styles.periodArrow} aria-hidden />
                      </button>
                    ))}

                    {FOOTER.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.hot} ${styles.hotFooter}`}
                        style={rectStyle(item.rect)}
                        aria-label={item.label}
                      />
                    ))}
                  </div>

                  <div
                    className={styles.panelSlot}
                    style={rectStyle(PANEL)}
                    onMouseMove={onPanelMove}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.setProperty("--mx", "50%");
                      e.currentTarget.style.setProperty("--my", "38%");
                    }}
                  >
                    <div className={styles.panelCover} aria-hidden />
                    <ProgramPanel step={step} direction={direction} panelId={panelId} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.mobileBoard}>
            <header className={styles.mobileHead}>
              <p className={styles.mobileEyebrow}>Programme</p>
              <p className={styles.mobileTitle}>Une journée. Plusieurs déclics.</p>
            </header>

            <div className={styles.mobileTimeline} role="listbox" aria-label="Étapes du programme">
              {PROGRAM_STEPS.map((item, i) => {
                const selected = active === i;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    className={[styles.mobileStep, selected ? styles.mobileStepActive : ""]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={`${item.time} — ${item.title}`}
                    aria-selected={selected}
                    aria-controls={panelId}
                    onClick={() => select(i)}
                    onKeyDown={(e) => onStepKeyDown(e, i)}
                  >
                    <span className={styles.mobileTime}>{item.time}</span>
                    <span className={styles.mobileModule}>{item.module}</span>
                    <span className={styles.mobileStepTitle}>{item.title}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.mobilePanelWrap}>
              <ProgramPanel step={step} direction={direction} panelId={panelId} />
            </div>
          </div>
        )}

        <ol className={styles.srOnly}>
          {PROGRAM_STEPS.map((item) => (
            <li key={item.id}>
              {item.time} — {item.title}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
