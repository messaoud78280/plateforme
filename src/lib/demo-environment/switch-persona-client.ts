/** Client helper — switch persona démo via l’API existante (pas de second moteur). */

import { resetMessagerieUnreadForPersonaSwitch } from "@/lib/perf/messagerie-unread-bus";
import type { DemoPersonaKey } from "@/lib/demo-environment/personas";

export const DEMO_PERSONA_CHANGED = "bework:persona-changed";

export async function switchDemoPersona(persona: DemoPersonaKey): Promise<{
  ok: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/demo/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error ?? "Échec du switch" };
    }
    const data = (await res.json()) as { user?: { id?: string } };
    resetMessagerieUnreadForPersonaSwitch();
    window.dispatchEvent(
      new CustomEvent(DEMO_PERSONA_CHANGED, {
        detail: { persona, userId: data.user?.id },
      }),
    );
    return { ok: true, userId: data.user?.id };
  } catch {
    return { ok: false, error: "Réseau indisponible" };
  }
}

export async function fetchCurrentDemoPersona(): Promise<string | null> {
  try {
    const res = await fetch("/api/demo/view-as", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { current?: string | null };
    return data.current ?? null;
  } catch {
    return null;
  }
}
