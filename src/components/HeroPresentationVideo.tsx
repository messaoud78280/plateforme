"use client";

import { useEffect, useRef, useState } from "react";

/** Halo + ombre portée — sensation métal / premium autour du flux vidéo */
const FRAME_SHADOW =
  "0 0 52px -14px rgba(37, 99, 235, 0.42), 0 28px 56px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.35)";

type HeroPresentationVideoProps = {
  className?: string;
  /** Par défaut léger décalage vertical ; désactiver quand la vidéo est empilée sous un autre bloc hero */
  verticalShift?: boolean;
};

/** Hero vidéo — cadre type smartphone pro, contour métallique léger + ligne bleue */
export function HeroPresentationVideo({ className = "", verticalShift = true }: HeroPresentationVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.defaultMuted = true;
    v.muted = true;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPaused = () => setPaused(v.paused);
    v.addEventListener("play", syncPaused);
    v.addEventListener("pause", syncPaused);
    v.addEventListener("ended", syncPaused);

    const tryPlay = () => {
      if (mq.matches) {
        v.pause();
      } else {
        void v.play().catch(() => {
          syncPaused();
        });
      }
      syncPaused();
    };

    tryPlay();
    const onLoadedData = () => tryPlay();
    v.addEventListener("loadeddata", onLoadedData);

    mq.addEventListener("change", tryPlay);
    const t = window.setTimeout(syncPaused, 400);
    return () => {
      window.clearTimeout(t);
      mq.removeEventListener("change", tryPlay);
      v.removeEventListener("loadeddata", onLoadedData);
      v.removeEventListener("play", syncPaused);
      v.removeEventListener("pause", syncPaused);
      v.removeEventListener("ended", syncPaused);
    };
  }, []);

  return (
    <div
      id="presentation"
      role="region"
      aria-label="Vidéo de présentation BeWork — lecture automatique, son désactivé par défaut"
      className={`relative isolate mx-auto flex w-full max-w-full shrink-0 justify-center ${verticalShift ? "translate-y-[36px] lg:translate-y-[44px]" : ""} ${className}`}
    >
      {/* Halo radial */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(420px,95vw)] w-[min(420px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14)_0%,transparent_68%)] motion-reduce:hidden"
        aria-hidden
      />

      {/* Traits techniques discrets */}
      <div className="pointer-events-none absolute -left-6 top-[28%] hidden lg:block" aria-hidden>
        <svg width="72" height="48" viewBox="0 0 72 48" fill="none" className="text-slate-400/70">
          <path d="M0 24h48M48 12v24" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
          <circle cx="48" cy="24" r="3" stroke="#2563eb" strokeOpacity="0.45" strokeWidth="1" />
          <text x="52" y="28" fill="currentColor" fontSize="8" opacity="0.85">
            IA
          </text>
        </svg>
      </div>
      <div className="pointer-events-none absolute -right-4 bottom-[22%] hidden lg:block" aria-hidden>
        <svg width="56" height="40" viewBox="0 0 56 40" fill="none" className="text-slate-400/65">
          <path d="M8 32h40M32 8v18" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
          <rect x="28" y="4" width="16" height="6" rx="1" stroke="#2563eb" strokeOpacity="0.35" strokeWidth="0.75" fill="none" />
        </svg>
      </div>

      <div className="group relative mx-auto w-full max-w-[290px] transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100 lg:mx-0 lg:max-h-[524px] lg:max-w-[300px]">
        {/* Anneau métallique simulé + filet bleu */}
        <div
          className="rounded-[32px] bg-gradient-to-br from-slate-200 via-white to-slate-300 p-[3px]"
          style={{ boxShadow: FRAME_SHADOW }}
        >
          <div className="rounded-[29px] bg-gradient-to-b from-slate-800 via-slate-950 to-black p-[2px] ring-1 ring-[#2563eb]/25">
            <div className="relative aspect-[290/520] w-full overflow-hidden rounded-[26px] bg-black lg:aspect-auto lg:h-[520px] lg:w-[290px]">
              <video
                ref={ref}
                className="absolute inset-0 z-[1] block h-full w-full rounded-[26px] object-cover object-center [-webkit-transform:translateZ(0)]"
                autoPlay
                loop
                muted
                playsInline
                controls
                controlsList="nodownload"
                preload="auto"
                poster="/opengraph-image"
                title="Présentation BeWork"
                src="/video/presentation.mp4"
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
              >
                <source src="/video/presentation.mp4" type="video/mp4" />
                Votre navigateur ne prend pas en charge la lecture de cette vidéo.
              </video>

              {paused ? (
                <button
                  type="button"
                  aria-label="Lancer la vidéo"
                  className="absolute inset-0 z-[25] flex items-center justify-center bg-black/20 transition hover:bg-black/28"
                  onClick={() => {
                    void ref.current?.play();
                  }}
                >
                  <span className="flex h-[4.5rem] w-[4.5rem] cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-[0_12px_40px_rgba(37,99,235,0.28)] ring-[0.5px] ring-[#2563eb]/35 transition hover:scale-[1.04] hover:shadow-[0_14px_44px_rgba(37,99,235,0.34)]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-[#1d4ed8]" aria-hidden>
                      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.82l8.06-5.17a.98.98 0 0 0 0-1.67L9.54 5.98A1 1 0 0 0 8 6.82Z" />
                    </svg>
                  </span>
                </button>
              ) : null}

              {/* Barre de progression décorative (maquette) */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-[2.75rem] z-[3] flex justify-center px-4 sm:bottom-[2.85rem]"
                aria-hidden
              >
                <div className="h-[3px] w-full max-w-[200px] rounded-full bg-black/45">
                  <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] shadow-[0_0_12px_rgba(37,99,235,0.55)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
