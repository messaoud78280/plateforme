"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/messagerie/media-preview";

/** Un seul audio en lecture à la fois dans la Messagerie. */
let activeAudio: HTMLAudioElement | null = null;

type Props = {
  src: string;
  durationSec?: number;
  compact?: boolean;
};

export function AudioMessagePlayer({ src, durationSec, compact }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(durationSec ?? 0);

  useEffect(() => {
    const a = new Audio(src);
    audioRef.current = a;
    a.preload = "metadata";
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDur(a.duration);
    };
    const onTime = () => {
      if (a.duration > 0) setProgress(a.currentTime / a.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      if (activeAudio === a) activeAudio = null;
    };
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.pause();
      if (activeAudio === a) activeAudio = null;
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [src]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
      if (activeAudio === a) activeAudio = null;
      return;
    }
    if (activeAudio && activeAudio !== a) {
      activeAudio.pause();
    }
    activeAudio = a;
    void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  return (
    <div
      className={`flex items-center gap-2 ${compact ? "min-w-[140px]" : "min-w-[180px]"} py-0.5`}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white"
        aria-label={playing ? "Pause" : "Lecture"}
      >
        {playing ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="h-1 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-[#00a884] transition-[width]"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <p className="mt-0.5 text-[11px] tabular-nums text-[#667781]">
          {formatDuration(playing && audioRef.current ? audioRef.current.currentTime : dur || 0)}
          {dur > 0 && !playing ? ` / ${formatDuration(dur)}` : ""}
        </p>
      </div>
    </div>
  );
}
