"use client";

import { formatDuration } from "@/lib/messagerie/media-preview";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { MESSAGERIE_VOICE_MAX_SECONDS } from "@/lib/messagerie/media-storage";

type Props = {
  onCancel: () => void;
  onSend: (file: File, durationSec: number) => void;
  sending?: boolean;
};

export function VoiceRecorderPanel({ onCancel, onSend, sending }: Props) {
  const rec = useVoiceRecorder({ maxSeconds: MESSAGERIE_VOICE_MAX_SECONDS });

  function handleSend() {
    if (!rec.blob || sending) return;
    const ext = rec.mimeType.includes("mp4")
      ? "m4a"
      : rec.mimeType.includes("ogg")
        ? "ogg"
        : "webm";
    const file = new File([rec.blob], `vocal-${Date.now()}.${ext}`, {
      type: rec.mimeType,
      lastModified: Date.now(),
    });
    onSend(file, rec.elapsed);
  }

  return (
    <div className="rounded-2xl border border-[#d1d7db] bg-white p-3 shadow-sm">
      {rec.state === "idle" ||
      rec.state === "denied" ||
      rec.state === "unsupported" ||
      rec.state === "error" ? (
        <div className="space-y-2">
          {rec.errorMsg ? (
            <p className="text-sm font-medium text-red-600">{rec.errorMsg}</p>
          ) : (
            <p className="text-sm text-[#54656f]">
              Appuyez pour enregistrer un message vocal (max{" "}
              {MESSAGERIE_VOICE_MAX_SECONDS / 60} min).
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {rec.state === "idle" || rec.state === "error" ? (
              <button
                type="button"
                onClick={() => void rec.start()}
                className="rounded-full bg-[#00a884] px-4 py-2.5 text-sm font-bold text-white"
              >
                🎤 Enregistrer
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-[#d1d7db] px-4 py-2.5 text-sm font-semibold text-[#54656f]"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      {rec.state === "recording" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <p className="flex-1 text-lg font-bold tabular-nums text-[#111b21]">
              {formatDuration(rec.elapsed)}
              <span className="ml-2 text-xs font-medium text-[#667781]">
                / {formatDuration(MESSAGERIE_VOICE_MAX_SECONDS)}
              </span>
            </p>
            <button
              type="button"
              onClick={rec.cancel}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[#54656f] hover:bg-[#f0f2f5]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={rec.stop}
              className="rounded-full bg-[#00a884] px-4 py-2 text-sm font-bold text-white"
            >
              Terminer
            </button>
          </div>
          {rec.elapsed >= MESSAGERIE_VOICE_MAX_SECONDS - 10 ? (
            <p className="text-xs font-semibold text-amber-700">
              Limite bientôt atteinte — arrêt automatique.
            </p>
          ) : null}
        </div>
      ) : null}

      {rec.state === "preview" && rec.previewUrl ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#111b21]">
            Vocal · {formatDuration(rec.elapsed)}
          </p>
          <audio src={rec.previewUrl} controls className="w-full" preload="metadata" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={rec.cancel}
              className="rounded-full border border-[#d1d7db] px-4 py-2 text-sm font-semibold text-[#54656f]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                rec.reset();
                void rec.start();
              }}
              className="rounded-full border border-[#d1d7db] px-4 py-2 text-sm font-semibold text-[#54656f]"
            >
              Refaire
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={handleSend}
              className="rounded-full bg-[#00a884] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {sending ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
