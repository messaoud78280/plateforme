"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrgAdminActions({
  organizationId,
  organizationName,
  status,
  ownerAccountStatus,
}: {
  organizationId: string;
  organizationName: string;
  status: string;
  ownerAccountStatus?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [supportMode, setSupportMode] = useState<"READ_ONLY" | "INTERVENTION">("READ_ONLY");
  const [reason, setReason] = useState("");
  const pendingApproval = ownerAccountStatus === "PENDING_APPROVAL";

  async function post(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, ...body }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
        email?: string;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Échec");
        return;
      }
      if (data.redirectTo) {
        window.location.assign(data.redirectTo);
        return;
      }
      router.refresh();
      setMsg(
        data.email
          ? `Essai validé — accès envoyé à ${data.email}`
          : "OK",
      );
    } catch {
      setMsg("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
      <h3 className="text-[15px] font-semibold text-bework-navy">Actions admin</h3>

      {pendingApproval ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-[13px] font-semibold text-amber-950">
            Compte owner en attente de validation
          </p>
          <p className="mt-1 text-[12px] text-amber-900/90">
            Aucun accès client tant que l’essai n’est pas validé. Cela démarre aussi
            les 14 jours.
          </p>
          <button
            type="button"
            disabled={busy}
            className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={() => {
              if (
                confirm(
                  `Valider l’essai BeWork pour ${organizationName} ?\n\nLe compte owner pourra se connecter et l’essai 14 jours démarre.`,
                )
              ) {
                void post("/api/platform-admin/orgs/approve-trial");
              }
            }}
          >
            Valider l’essai BeWork
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-full border border-bework-navy/20 px-3 py-1.5 text-[13px] font-semibold hover:bg-slate-50 disabled:opacity-50"
          onClick={() => {
            if (confirm(`Prolonger l’essai de ${organizationName} de 7 jours ?`)) {
              void post("/api/platform-admin/orgs/extend-trial", { days: 7 });
            }
          }}
        >
          Prolonger +7 j
        </button>

        {status !== "SUSPENDED" ? (
          <button
            type="button"
            disabled={busy}
            className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[13px] font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
            onClick={() => {
              if (
                confirm(
                  `Suspendre ${organizationName} ?\n\nLes données ne seront pas supprimées.\nLes utilisateurs ne pourront plus travailler normalement.`,
                )
              ) {
                void post("/api/platform-admin/orgs/suspend");
              }
            }}
          >
            Suspendre
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-900 disabled:opacity-50"
            onClick={() => {
              if (confirm(`Réactiver ${organizationName} ?`)) {
                void post("/api/platform-admin/orgs/reactivate");
              }
            }}
          >
            Réactiver
          </button>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-[13px] font-semibold text-bework-navy">Mode support</p>
        <p className="mt-1 text-[12px] text-slate-500">
          Accès temporaire journalisé — motif obligatoire. Pas d’impersonation utilisateur.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="text-[13px]">
            <input
              type="radio"
              name="mode"
              checked={supportMode === "READ_ONLY"}
              onChange={() => setSupportMode("READ_ONLY")}
              className="mr-1.5"
            />
            Lecture seule
          </label>
          <label className="text-[13px]">
            <input
              type="radio"
              name="mode"
              checked={supportMode === "INTERVENTION"}
              onChange={() => setSupportMode("INTERVENTION")}
              className="mr-1.5"
            />
            Intervention
          </label>
        </div>
        <textarea
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px]"
          rows={3}
          placeholder="Motif de l’accès (ex. client signale un problème sur devis DEV-…)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || reason.trim().length < 12}
          className="mt-2 rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          onClick={() =>
            void post("/api/platform-admin/support/start", {
              mode: supportMode,
              reason: reason.trim(),
            })
          }
        >
          Ouvrir le support → dashboard
        </button>
      </div>

      {msg ? <p className="text-[13px] text-slate-600">{msg}</p> : null}
    </div>
  );
}
