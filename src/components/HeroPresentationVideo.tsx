"use client";

import { useEffect, useRef, useState } from "react";

const DESKTOP_SHADOW =
  "0px 60px 120px rgba(0, 0, 0, 0.20), 0px 25px 50px rgba(0, 0, 0, 0.12)";

/** Hero vidéo support : 290×520, translate 50 px ; ombre et halo léger (texte dominant). */
export function HeroPresentationVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPaused = () => setPaused(v.paused);
    v.addEventListener("play", syncPaused);
    v.addEventListener("pause", syncPaused);
    v.addEventListener("ended", syncPaused);

    const apply = () => {
      if (mq.matches) {
        v.pause();
      } else {
        v.play().catch(() => {
          syncPaused();
        });
      }
      syncPaused();
    };

    apply();
    mq.addEventListener("change", apply);
    const t = window.setTimeout(syncPaused, 400);
    return () => {
      window.clearTimeout(t);
      mq.removeEventListener("change", apply);
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
      className={`relative isolate mx-auto flex w-full max-w-full shrink-0 justify-center translate-y-[50px] before:pointer-events-none before:absolute before:left-1/2 before:top-1/2 before:-z-10 before:size-[min(380px,92vw)] before:-translate-x-1/2 before:-translate-y-1/2 before:bg-[radial-gradient(circle,rgba(37,99,235,0.10),transparent_70%)] before:content-[''] lg:mx-0 ${className}`}
    >
      <div className="group mx-auto w-full max-w-[290px] transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100 lg:mx-0 lg:max-h-[524px] lg:max-w-[300px]">
        <div
          className="aspect-[290/520] w-full rounded-[28px] bg-black lg:aspect-auto lg:h-[520px] lg:w-[290px]"
          style={{ boxShadow: DESKTOP_SHADOW }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-black">
            <video
              ref={ref}
              className="absolute inset-0 z-[1] block h-full w-full rounded-[28px] object-cover object-center [-webkit-transform:translateZ(0)]"
              autoPlay
              loop
              muted
              playsInline
              controls
              controlsList="nodownload"
              preload="metadata"
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
                className="absolute inset-0 z-[2] flex items-center justify-center bg-black/15 transition hover:bg-black/25"
                onClick={() => {
                  void ref.current?.play();
                }}
              >
                <span className="flex h-[4.75rem] w-[4.75rem] cursor-pointer items-center justify-center rounded-full bg-white shadow-lg shadow-slate-900/12 ring-[0.5px] ring-black/[0.04] transition hover:scale-[1.03] hover:shadow-xl">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-[#1d4ed8]" aria-hidden>
                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.82l8.06-5.17a.98.98 0 0 0 0-1.67L9.54 5.98A1 1 0 0 0 8 6.82Z" />
                  </svg>
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
