"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  /** Libellé accessibilité du carrousel (points de navigation) */
  dotListAriaLabel?: string;
  prevAriaLabel?: string;
  nextAriaLabel?: string;
  /** Nombre d’éléments visibles par « page » (défilement par paire si 2) */
  slidesPerView?: 1 | 2;
};

function chunkSlides(nodes: ReactNode[], perPage: number): ReactNode[][] {
  if (perPage <= 1) return nodes.map((s) => [s]);
  const pages: ReactNode[][] = [];
  for (let i = 0; i < nodes.length; i += perPage) {
    pages.push(nodes.slice(i, i + perPage));
  }
  return pages;
}

export function ResourceSpotlightCarousel({
  children,
  dotListAriaLabel = "Choisir un élément",
  prevAriaLabel = "Élément précédent",
  nextAriaLabel = "Élément suivant",
  slidesPerView = 1,
}: Props) {
  const slides = useMemo(() => Children.toArray(children).filter(Boolean), [children]);
  const perPage = slidesPerView === 2 ? 2 : 1;
  const pages = useMemo(() => chunkSlides(slides, perPage), [slides, perPage]);
  const n = pages.length;
  const [idx, setIdx] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [slidePx, setSlidePx] = useState(0);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSlidePx(el.clientWidth));
    ro.observe(el);
    setSlidePx(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (n === 0) return;
    if (idx >= n) setIdx(n - 1);
  }, [n, idx]);

  const goPrev = useCallback(() => setIdx((i) => (i - 1 + n) % n), [n]);
  const goNext = useCallback(() => setIdx((i) => (i + 1) % n), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (n <= 1) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, goPrev, goNext]);

  if (n === 0) return null;

  const measured = slidePx > 0;
  const offset = measured ? -(idx * slidePx) : 0;

  const navBtnClass =
    "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 self-center sm:h-9 sm:w-9";

  return (
    <div className="relative w-full pb-6 pt-2 md:pb-8 md:pt-3">
      <div className={`flex w-full items-stretch ${n > 1 ? "gap-1 sm:gap-2" : ""}`}>
        {n > 1 ? (
          <button type="button" aria-label={prevAriaLabel} className={navBtnClass} onClick={goPrev}>
            <ChevronLeft className="size-[1.125rem]" aria-hidden strokeWidth={2} />
          </button>
        ) : null}

        <div
          ref={viewportRef}
          className="min-h-0 min-w-0 flex-1 overflow-hidden"
          aria-live={n > 1 ? "polite" : undefined}
          aria-atomic="false"
        >
          {!measured ? (
            <div className="flex min-h-[7rem] w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse sm:min-h-[8rem]" />
          ) : (
            <div
              className="flex will-change-transform transition-[transform] duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none"
              style={{
                transform: `translate3d(${offset}px,0,0)`,
                width: `${n * slidePx}px`,
              }}
            >
              {pages.map((group, pageI) => (
                <div
                  key={pageI}
                  className="flex min-w-0 shrink-0 px-1 sm:px-0"
                  style={{ width: slidePx }}
                  aria-hidden={idx !== pageI}
                >
                  <div
                    className={
                      perPage >= 2
                        ? "grid w-full grid-cols-2 items-stretch gap-2 md:gap-3"
                        : "w-full min-w-0"
                    }
                  >
                    {group.map((slide, j) => (
                      <div
                        key={j}
                        className={
                          group.length === 1 && perPage >= 2
                            ? "col-span-2 max-w-md justify-self-start"
                            : "min-w-0"
                        }
                      >
                        {slide}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {n > 1 ? (
          <button type="button" aria-label={nextAriaLabel} className={navBtnClass} onClick={goNext}>
            <ChevronRight className="size-[1.125rem]" aria-hidden strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {measured && n > 1 ? (
        <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label={dotListAriaLabel}>
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={`Afficher la page ${i + 1} sur ${n}`}
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
