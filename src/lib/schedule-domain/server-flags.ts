/**
 * Feature flags serveur Planning V2 — JAMAIS exposés au client.
 *
 * FF_PLANNING_V2_ENABLED — context + preview (+ prérequis commit)
 *   Défaut ON. Kill-switch : FF_PLANNING_V2_ENABLED=false.
 * FF_PLANNING_V2_COMMIT_ENABLED — commit CREATE
 *   Défaut ON. Kill-switch : FF_PLANNING_V2_COMMIT_ENABLED=false.
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

function envEnabledDefaultOn(name: string): boolean {
  if (envFalse(name)) return false;
  if (envTrue(name)) return true;
  return true;
}

/** Preview / context : ON sauf kill-switch explicite false. */
export function isPlanningV2ServerEnabled(): boolean {
  return envEnabledDefaultOn("FF_PLANNING_V2_ENABLED");
}

/** Commit : ON sauf kill-switch explicite false (et preview actif). */
export function isPlanningV2CommitEnabled(): boolean {
  return isPlanningV2ServerEnabled() && envEnabledDefaultOn("FF_PLANNING_V2_COMMIT_ENABLED");
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
      error:
        "La création du planning V2 est temporairement désactivée sur ce serveur (FF_PLANNING_V2_COMMIT_ENABLED=false). La prévisualisation reste disponible.",
      code: "FEATURE_COMMIT_DISABLED",
    },
    { status: 403 },
  );
}
