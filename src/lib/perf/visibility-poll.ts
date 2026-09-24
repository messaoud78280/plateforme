/**
 * Helpers polling client — pause quand l’onglet est masqué.
 */

export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}

/**
 * setInterval qui ignore les ticks hors écran et rafraîchit au retour.
 */
export function startVisibilityAwareInterval(
  tick: () => void,
  intervalMs: number,
  opts?: { runImmediately?: boolean },
): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: number | null = null;

  const runIfVisible = () => {
    if (!isDocumentVisible()) return;
    tick();
  };

  if (opts?.runImmediately !== false) runIfVisible();

  timer = window.setInterval(runIfVisible, intervalMs);

  const onVisibility = () => {
    if (isDocumentVisible()) tick();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    if (timer != null) window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
