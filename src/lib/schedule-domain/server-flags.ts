/**
 * Feature flags serveur Planning V2 — JAMAIS exposés au client.
 *
 * FF_PLANNING_V2_ENABLED — active context + preview (+ prérequis commit)
 *   Défaut ON (absence ou true). Kill-switch : FF_PLANNING_V2_ENABLED=false.
 * FF_PLANNING_V2_COMMIT_ENABLED — kill-switch commit (défaut false, explicite true requis)
 */
import { NextResponse } from "next/server";

function envTrue(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

function envFalse(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off";
}

/** Preview / context : ON sauf kill-switch explicite false. */
export function isPlanningV2ServerEnabled(): boolean {
  if (envFalse("FF_PLANNING_V2_ENABLED")) return false;
  if (envTrue("FF_PLANNING_V2_ENABLED")) return true;
  return true;
}

/** Commit autorisé uniquement si V2 enabled ET kill-switch commit true. */
export function isPlanningV2CommitEnabled(): boolean {
  return isPlanningV2ServerEnabled() && envTrue("FF_PLANNING_V2_COMMIT_ENABLED");
}

export function planningV2DisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: "Planning V2 désactivé",
      code: "FEATURE_DISABLED",
    },
    { status: 404 },
  );
}

export function planningV2CommitDisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: "Commit Planning V2 désactivé (validation Preview uniquement)",
      code: "FEATURE_COMMIT_DISABLED",
    },
    { status: 403 },
  );
}
