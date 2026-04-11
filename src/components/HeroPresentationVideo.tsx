"use client";

import { useEffect, useRef } from "react";

/**
 * Vidéo portrait en hero : lecture auto en boucle, muette par défaut (politique navigateurs).
 * object-contain = image entière ; bandes latérales sur fond marine (#0f172a). Respecte prefers-reduced-motion.
 * Pas de .surface-metallic-light (overflow:hidden + isolate) : sur iOS/Safari ça peut masquer ou casser le rendu vidéo.
 */
export function HeroPresentationVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      if (mq.matches) {
        v.pause();
      } else {
        v.play().catch(() => {});
      }
    };

    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div
      id="presentation"
      className="mx-auto min-w-0 w-full max-w-2xl shrink-0 rounded-xl border border-[#c5d0e2] bg-[#e8edf5]/90 p-1.5 shadow-sm md:mx-0 md:p-2 lg:max-w-none"
      role="region"
      aria-label="Vidéo de présentation BeWork — lecture automatique, son désactivé par défaut"
    >
      {/* 16:9 via padding-bottom : meilleur support mobile que aspect-ratio seul dans certains flex / WebKit */}
      <div className="relative h-0 w-full overflow-hidden rounded-lg bg-[#0f172a] pb-[56.25%] ring-1 ring-inset ring-white/5">
        <video
          ref={ref}
          className="absolute left-0 top-0 z-[1] block h-full w-full object-contain object-center [-webkit-transform:translateZ(0)]"
          autoPlay
          loop
          muted
          playsInline
          controls
          preload="metadata"
          title="Présentation BeWork"
          src="/video/presentation.mp4"
        >
          <source src="/video/presentation.mp4" type="video/mp4" />
          Votre navigateur ne prend pas en charge la lecture de cette vidéo.
        </video>
      </div>
    </div>
  );
}
