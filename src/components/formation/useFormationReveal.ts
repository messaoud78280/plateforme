"use client";

import { useEffect, useRef, useState } from "react";

type RevealOptions = {
  threshold?: number;
  rootMargin?: string;
  ambientDelayMs?: number;
};

/** Déclenche une seule fois les entrées de section et, si demandé, son animation ambiante. */
export function useFormationReveal({
  threshold = 0.12,
  rootMargin = "0px",
  ambientDelayMs,
}: RevealOptions = {}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [ambient, setAmbient] = useState(false);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (!ready || ambientDelayMs == null) return;
    const timer = window.setTimeout(() => setAmbient(true), ambientDelayMs);
    return () => window.clearTimeout(timer);
  }, [ambientDelayMs, ready]);

  return { rootRef, ready, ambient };
}
