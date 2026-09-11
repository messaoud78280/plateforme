"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./HomeHeroCollage.module.css";

const HOURS = ["09:00", "10:30", "11:30", "14:00", "15:30"] as const;
const DAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;
const DATES = [21, 22, 23, 24, 25, 26, 27] as const;
const BARS = [40, 55, 48, 70, 62, 85, 78] as const;

const PILLS = [
  { label: "Sites web", accent: "#275BE8", key: "sites" },
  { label: "Applications", accent: "#7c3aed", key: "apps" },
  { label: "Automatisations", accent: "#0891b2", key: "auto" },
  { label: "CRM", accent: "#ea580c", key: "crm" },
] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Collage hero interactif — composition visuelle inchangée, micro-interactions premium. */
export function HomeHeroCollage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const reduceMotion = useRef(false);
  const pointerFine = useRef(false);

  const [slot, setSlot] = useState<(typeof HOURS)[number]>("10:30");
  const [day, setDay] = useState(24);
  const [entered, setEntered] = useState(false);
  const [activityPlayed, setActivityPlayed] = useState(false);
  const [activePill, setActivePill] = useState<string | null>(null);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pointerFine.current = window.matchMedia("(pointer: fine)").matches;

    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setEntered(true);
      },
      { threshold: 0.28 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion.current || !pointerFine.current) return;

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      const root = rootRef.current;
      if (root) {
        root.style.setProperty("--mx", current.current.x.toFixed(4));
        root.style.setProperty("--my", current.current.y.toFixed(4));
      }
      raf.current = window.requestAnimationFrame(tick);
    };
    raf.current = window.requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) window.cancelAnimationFrame(raf.current);
    };
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion.current || !pointerFine.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    target.current = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  };

  const onLeave = () => {
    target.current = { x: 0, y: 0 };
    setActivePill(null);
  };

  return (
    <div
      ref={rootRef}
      className={cx(
        styles.scene,
        "relative mx-auto min-h-[28rem] w-full max-w-[36rem] sm:min-h-[32rem] lg:mx-0 lg:max-w-none",
        entered && styles.entered,
      )}
      aria-hidden
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Quote */}
      <div
        className={cx(
          styles.layerFront,
          styles.reveal,
          "absolute left-0 top-0 z-30 max-w-[14rem] rounded-2xl border border-white/80 bg-white/95 px-3.5 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.1)] backdrop-blur-sm sm:left-2 sm:max-w-[15.5rem] sm:px-4",
        )}
        style={{ ["--delay" as string]: "80ms" }}
      >
        <p className="text-[11px] font-semibold leading-snug text-[#0B0D12] sm:text-xs">
          De l’idée à la réalité — plus vite que vous ne le pensez.
        </p>
      </div>

      {/* Fenêtre site MonProjet */}
      <div
        className={cx(
          styles.layerBack,
          styles.window,
          styles.reveal,
          activePill && styles.windowLit,
          "absolute left-[4%] top-12 z-[1] w-[78%] max-w-[22rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_55px_rgba(15,23,42,0.12)] sm:left-[6%] sm:top-14 sm:w-[72%]",
        )}
        style={{ ["--delay" as string]: "0ms" }}
      >
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-[#f87171]" />
          <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
          <span className="h-2 w-2 rounded-full bg-[#34d399]" />
          <span className="ml-2 text-[10px] font-semibold text-slate-500">MonProjet</span>
        </div>
        <div className="relative h-36 bg-gradient-to-br from-[#1e3a5f] via-[#275BE8] to-[#7c3aed] sm:h-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.22),transparent_55%)]" />
          <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 p-3 shadow-sm">
            <p className="text-xs font-bold tracking-tight text-[#0B0D12]">
              Des idées en grands projets
            </p>
            <span className="mt-2 inline-flex rounded-full bg-[#275BE8] px-2.5 py-1 text-[10px] font-semibold text-white">
              Commencer maintenant
            </span>
          </div>
        </div>
      </div>

      {/* Pills catégories */}
      <ul
        className={cx(
          styles.layerFront,
          "absolute right-0 top-10 z-20 flex flex-col gap-2 sm:right-1 sm:top-12",
        )}
      >
        {PILLS.map((pill, i) => (
          <li
            key={pill.label}
            className={cx(styles.pill, styles.reveal)}
            style={
              {
                color: pill.accent,
                ["--pill-glow" as string]: pill.accent,
                ["--delay" as string]: `${220 + i * 70}ms`,
              } as CSSProperties
            }
            onMouseEnter={() => setActivePill(pill.key)}
            onMouseLeave={() => setActivePill(null)}
          >
            {pill.label}
          </li>
        ))}
      </ul>

      {/* Réservation */}
      <div
        className={cx(
          styles.layerMid,
          styles.card,
          styles.booking,
          styles.reveal,
          "absolute bottom-[7.5rem] left-0 z-20 w-[11.5rem] rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:bottom-32 sm:left-1 sm:w-[13rem] sm:p-3.5",
        )}
        style={{ ["--delay" as string]: "120ms" }}
      >
        <p className="text-[11px] font-bold text-[#0B0D12]">Système de réservation</p>
        <p className="mt-0.5 text-[10px] text-slate-500">Avril 2025</p>
        <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[8px] font-semibold text-slate-400">
          {DAYS.map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {DATES.map((d) => (
            <button
              key={d}
              type="button"
              tabIndex={-1}
              onClick={() => setDay(d)}
              className={cx(
                "rounded-md py-1 text-[10px] font-semibold",
                day === d ? cx("bg-[#275BE8] text-white", styles.dayActive) : "bg-slate-50 text-slate-700",
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {HOURS.slice(0, 3).map((h) => (
            <button
              key={h}
              type="button"
              tabIndex={-1}
              onClick={() => setSlot(h)}
              className={cx(
                "rounded-md px-1.5 py-1 text-[9px] font-semibold",
                slot === h
                  ? cx("bg-[#275BE8] text-white", styles.slotActive)
                  : "bg-slate-50 text-slate-600",
              )}
            >
              {h}
            </button>
          ))}
        </div>
        <div
          className={cx(
            styles.bookBtn,
            "mt-2 rounded-lg bg-[#275BE8] py-1.5 text-center text-[10px] font-bold text-white",
          )}
        >
          Réserver mon créneau
        </div>
      </div>

      {/* Assistant IA */}
      <div
        className={cx(
          styles.layerFront,
          styles.card,
          styles.assistant,
          styles.reveal,
          "absolute bottom-[5.5rem] right-0 z-20 w-[12rem] rounded-2xl border border-violet-200/80 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:bottom-28 sm:right-2 sm:w-[13.5rem]",
        )}
        style={{ ["--delay" as string]: "200ms" }}
      >
        <div className="flex items-center gap-2">
          <span
            className={cx(
              styles.aiIcon,
              "flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#275BE8] text-[10px] text-white",
            )}
          >
            ✦
          </span>
          <p className="text-[11px] font-bold text-[#0B0D12]">Assistant IA</p>
        </div>
        <p
          className={cx(
            styles.aiMsg,
            "mt-2 rounded-xl rounded-tl-sm bg-violet-50 px-2.5 py-2 text-[10px] leading-snug text-violet-900",
          )}
        >
          Comment puis-je vous aider à créer votre projet&nbsp;?
        </p>
      </div>

      {/* Dashboard activité */}
      <div
        className={cx(
          styles.layerMid,
          styles.card,
          styles.activity,
          styles.reveal,
          activityPlayed && styles.activityPlayed,
          "absolute bottom-2 left-[18%] z-30 w-[14rem] rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_18px_44px_rgba(15,23,42,0.14)] sm:left-[22%] sm:w-[15.5rem] sm:p-3.5",
        )}
        style={{ ["--delay" as string]: "160ms" }}
        onMouseEnter={() => {
          if (!activityPlayed) setActivityPlayed(true);
        }}
      >
        <p className="text-[11px] font-bold text-[#0B0D12]">Mon activité</p>
        <ul className="mt-2 space-y-1.5">
          {[
            { label: "Visiteurs", value: "1 248", delta: "+12%" },
            { label: "Réservations", value: "89", delta: "+28%" },
            { label: "CA", value: "2 430 €", delta: "+19%" },
          ].map((row) => (
            <li key={row.label} className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">{row.label}</span>
              <span className="font-bold text-[#0B0D12]">
                {row.value}{" "}
                <span className={cx(styles.delta, "font-semibold text-emerald-600")}>
                  {row.delta}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex h-8 items-end gap-0.5">
          {BARS.map((h, i) => (
            <span
              key={i}
              className={cx(
                styles.bar,
                "flex-1 rounded-sm bg-gradient-to-t from-[#275BE8] to-[#93c5fd]",
              )}
              style={
                {
                  ["--h" as string]: `${h}%`,
                  ["--bar-delay" as string]: `${i * 45}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>

      {/* Annotation manuscrite */}
      <p
        className={cx(
          styles.note,
          styles.reveal,
          "pointer-events-none absolute -bottom-1 right-0 rotate-[-7deg] font-blueprint-note text-[13px] font-semibold text-[#ea580c] sm:right-4 sm:text-sm",
        )}
        style={{ ["--delay" as string]: "320ms" }}
      >
        Des idées qui prennent vie
      </p>
    </div>
  );
}
