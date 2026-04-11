"use client";

import { useEffect, useRef } from "react";

/**
 * Vidéo portrait en hero : lecture auto en boucle, muette par défaut (politique navigateurs).
 * object-contain = image entière ; bandes latérales sur fond marine (#0f172a). Respecte prefers-reduced-motion.
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
      className="mx-auto max-w-2xl rounded-xl border border-[#dce3ec]/90 surface-metallic-light surface-metallic-light--soft p-1.5 shadow-sm md:mx-0 md:p-2 lg:max-w-none"
      role="region"
      aria-label="Vidéo de présentation BeWork — lecture automatique, son désactivé par défaut"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#0f172a] ring-1 ring-inset ring-white/5">
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-contain object-center"
          autoPlay
          loop
          muted
          playsInline
          controls
          preload="auto"
          title="Présentation BeWork"
        >
          <source src="/video/presentation.mp4" type="video/mp4" />
          Votre navigateur ne prend pas en charge la lecture de cette vidéo.
        </video>
      </div>
    </div>
  );
}
