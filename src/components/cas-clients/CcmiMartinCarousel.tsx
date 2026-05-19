"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { CCMI_MARTIN_SLIDES } from "@/content/cas-clients-catalog";

type Props = {
  pdfHref: string;
};

export function CcmiMartinCarousel({ pdfHref }: Props) {
  const total = CCMI_MARTIN_SLIDES.length;
  const [idx, setIdx] = useState(0);
  const goPrev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);
  const goNext = useCallback(() => setIdx((i) => (i + 1) % total), [total]);
  const slide = CCMI_MARTIN_SLIDES[idx]!;

  const navBtn =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600" aria-live="polite">
          Visuel <span className="tabular-nums font-semibold text-slate-900">{idx + 1}</span> / {total}
        </p>
        <a href={pdfHref} download className="text-sm font-semibold text-[#1d4ed8] hover:underline">
          Télécharger le PDF complet
        </a>
      </div>

      <div className="flex items-center gap-2">
        {total > 1 ? (
          <button type="button" className={navBtn} aria-label="Visuel précédent" onClick={goPrev}>
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        ) : null}

        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
          <Image
            src={slide.src}
            alt={slide.alt}
            width={1080}
            height={1350}
            className="mx-auto h-auto w-full max-w-md object-contain"
            sizes="(max-width: 768px) 100vw, 420px"
            priority={idx === 0}
          />
        </div>

        {total > 1 ? (
          <button type="button" className={navBtn} aria-label="Visuel suivant" onClick={goNext}>
            <ChevronRight className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="flex justify-center gap-1.5" role="tablist" aria-label="Choisir un visuel">
          {CCMI_MARTIN_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={`Afficher le visuel ${i + 1} sur ${total}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-[#1d4ed8]" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
