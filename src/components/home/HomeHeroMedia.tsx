"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { HomeHeroCollage } from "@/components/home/HomeHeroCollage";

const INTRO_VIDEOS = [
  {
    src: "/video/bework-hero-pub.mp4",
    poster: "/marketing/bework-hero-pub-poster.png",
    title: "Présentation BeWork — Au départ, une idée",
  },
  {
    src: "/video/bework-hero-artisan.mp4",
    poster: "/marketing/bework-hero-artisan-poster.png",
    title: "Présentation BeWork — Artisan",
  },
] as const;

const FRAME_SHADOW =
  "0 0 52px -14px rgba(37, 99, 235, 0.42), 0 28px 56px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.35)";

function subscribeReduceMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasUserActivation() {
  const ua = (
    navigator as Navigator & {
      userActivation?: { hasBeenActive?: boolean; isActive?: boolean };
    }
  ).userActivation;
  return Boolean(ua?.isActive || ua?.hasBeenActive);
}

/**
 * Intro hero : vidéo 1 → vidéo 2 → collage animé.
 * Son dès qu’un geste le permet (politique navigateur).
 */
export function HomeHeroMedia() {
  const reduceMotion = useSyncExternalStore(subscribeReduceMotion, getReduceMotion, () => false);
  const [done, setDone] = useState(false);

  if (reduceMotion || done) {
    return <HomeHeroCollage />;
  }

  return <HomeHeroIntroVideo onEnded={() => setDone(true)} />;
}

function HomeHeroIntroVideo({ onEnded }: { onEnded: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onEndedRef = useRef(onEnded);
  const indexRef = useRef(0);
  /** Conservé d’une vidéo à l’autre (ne pas re-couper le son en chaîne). */
  const soundConfirmedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const current = INTRO_VIDEOS[index] ?? INTRO_VIDEOS[0]!;

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let cancelled = false;
    let unlocking = false;
    let started = false;

    indexRef.current = index;

    v.loop = false;
    v.playsInline = true;
    v.volume = 1;

    const removeGestureListeners = () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      window.removeEventListener("touchstart", onGesture, true);
    };

    const confirmSound = () => {
      soundConfirmedRef.current = true;
      setMuted(false);
      removeGestureListeners();
    };

    const playCurrent = async (withSound: boolean) => {
      v.defaultMuted = !withSound;
      v.muted = !withSound;
      setMuted(!withSound);
      v.volume = 1;
      v.currentTime = 0;
      await v.play();
    };

    const enableSoundFromStart = async () => {
      if (cancelled || soundConfirmedRef.current || unlocking) return;
      unlocking = true;
      try {
        await playCurrent(true);
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 40);
        });
        if (!cancelled && !v.paused && !v.muted) {
          confirmSound();
        } else {
          await playCurrent(false);
        }
      } catch {
        try {
          await playCurrent(false);
        } catch {
          /* ignore */
        }
      } finally {
        unlocking = false;
      }
    };

    function onGesture() {
      void enableSoundFromStart();
    }

    const goNextOrFinish = () => {
      if (cancelled) return;
      const next = indexRef.current + 1;
      if (next < INTRO_VIDEOS.length) {
        setIndex(next);
        return;
      }
      v.pause();
      onEndedRef.current();
    };

    const start = async () => {
      if (cancelled || started) return;
      started = true;

      const wantSound = soundConfirmedRef.current || hasUserActivation();
      try {
        await playCurrent(wantSound);
        if (wantSound) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 40);
          });
          if (!cancelled && !v.paused && !v.muted) {
            confirmSound();
          } else if (!soundConfirmedRef.current) {
            await playCurrent(false);
          }
        }
      } catch {
        try {
          await playCurrent(false);
        } catch {
          /* ignore */
        }
      }

      if (!soundConfirmedRef.current) {
        window.addEventListener("pointerdown", onGesture, true);
        window.addEventListener("keydown", onGesture, true);
        window.addEventListener("touchstart", onGesture, true);
      }
    };

    v.addEventListener("ended", goNextOrFinish);
    v.src = current.src;
    v.load();
    if (v.readyState >= 2) {
      void start();
    } else {
      v.addEventListener("loadeddata", () => void start(), { once: true });
    }

    return () => {
      cancelled = true;
      v.pause();
      v.removeEventListener("ended", goNextOrFinish);
      removeGestureListeners();
    };
  }, [index, current.src]);

  return (
    <div
      id="presentation"
      role="region"
      aria-label="Vidéos de présentation BeWork"
      className="relative isolate mx-auto flex w-full max-w-full shrink-0 justify-center"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(420px,95vw)] w-[min(420px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14)_0%,transparent_68%)] motion-reduce:hidden"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[290px] lg:mx-0 lg:max-h-[524px] lg:max-w-[300px]">
        <div
          className="rounded-[32px] bg-gradient-to-br from-slate-200 via-white to-slate-300 p-[3px]"
          style={{ boxShadow: FRAME_SHADOW }}
        >
          <div className="rounded-[29px] bg-gradient-to-b from-slate-800 via-slate-950 to-black p-[2px] ring-1 ring-[#2563eb]/25">
            <div className="relative aspect-[290/520] w-full overflow-hidden rounded-[26px] bg-black lg:aspect-auto lg:h-[520px] lg:w-[290px]">
              <video
                ref={videoRef}
                className="absolute inset-0 z-[1] block h-full w-full rounded-[26px] object-cover object-center"
                playsInline
                preload="auto"
                poster={current.poster}
                title={current.title}
                muted={muted}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
