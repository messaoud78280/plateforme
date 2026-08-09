"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceRecorderState =
  | "idle"
  | "recording"
  | "preview"
  | "unsupported"
  | "denied"
  | "error";

type Options = {
  maxSeconds?: number;
};

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

/** Enregistrement vocal Messagerie — MediaRecorder, compatible Chrome / Safari récents. */
export function useVoiceRecorder(opts: Options = {}) {
  const maxSeconds = opts.maxSeconds ?? 120;
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("audio/webm");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      cleanupStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    setErrorMsg(null);
    clearPreview();
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setState("unsupported");
      setErrorMsg("Ce navigateur ne permet pas l’enregistrement vocal.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setErrorMsg("Microphone indisponible sur cet appareil.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      setMimeType(recorder.mimeType || mime || "audio/webm");
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        cleanupStream();
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const type = recorder.mimeType || mime || "audio/webm";
        const b = new Blob(chunksRef.current, { type });
        if (b.size < 200) {
          setState("error");
          setErrorMsg("Enregistrement trop court.");
          return;
        }
        setBlob(b);
        setPreviewUrl(URL.createObjectURL(b));
        setState("preview");
      };
      mediaRef.current = recorder;
      recorder.start(250);
      startedAtRef.current = Date.now();
      setElapsed(0);
      setState("recording");
      timerRef.current = window.setInterval(() => {
        const sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(sec);
        if (sec >= maxSeconds) {
          mediaRef.current?.state === "recording" && mediaRef.current.stop();
        }
      }, 250);
    } catch (e) {
      cleanupStream();
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setState("denied");
        setErrorMsg("BeWork n’a pas accès au microphone.");
      } else if (name === "NotFoundError") {
        setState("error");
        setErrorMsg("Aucun microphone détecté.");
      } else {
        setState("error");
        setErrorMsg("Impossible de démarrer l’enregistrement.");
      }
    }
  }, [clearPreview, cleanupStream, maxSeconds]);

  const stop = useCallback(() => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.onstop = null;
      mediaRef.current.stop();
    }
    cleanupStream();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearPreview();
    setElapsed(0);
    setState("idle");
    setErrorMsg(null);
  }, [cleanupStream, clearPreview]);

  const reset = useCallback(() => {
    clearPreview();
    setElapsed(0);
    setState("idle");
    setErrorMsg(null);
  }, [clearPreview]);

  return {
    state,
    elapsed,
    errorMsg,
    blob,
    previewUrl,
    mimeType,
    start,
    stop,
    cancel,
    reset,
  };
}
