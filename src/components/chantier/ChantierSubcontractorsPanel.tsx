"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { roundMoney } from "@/lib/commercial/money";
import {
  SUBCONTRACT_STATUS_LABELS,
  type SubcontractDto,
  type SubcontractStatus,
} from "@/lib/commercial/subcontract-types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20";

function fmtEur(n: number) {
  return `${roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`;
}

function statusTone(status: string): "info" | "ok" | "neutral" {
  if (status === "IN_PROGRESS") return "info";
  if (status === "COMPLETED") return "ok";
  return "neutral";
}

type ExtOrg = {
  id: string;
  name: string;
  tradeName: string | null;
  activity?: string | null;
  city?: string | null;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    isPrimary: boolean;
  }>;
};

type FormState = {
  externalOrganizationId: string;
  companyLabel: string;
  scope: string;
  contractAmountHt: string;
  status: SubcontractStatus;
  contractRef: string;
  contractDate: string;
  startDate: string;
  endDate: string;
  contactId: string;
  notes: string;
  progressPercent: string;
};

const emptyForm = (): FormState => ({
  externalOrganizationId: "",
  companyLabel: "",
  scope: "",
  contractAmountHt: "",
  status: "PREPARATION",
  contractRef: "",
  contractDate: "",
  startDate: "",
  endDate: "",
  contactId: "",
  notes: "",
  progressPercent: "",
});

function fromItem(item: SubcontractDto): FormState {
  return {
    externalOrganizationId: item.externalOrganizationId,
    companyLabel: item.companyName,
    scope: item.scope,
    contractAmountHt: String(item.contractAmountHt).replace(".", ","),
    status: item.status,
    contractRef: item.contractRef ?? "",
    contractDate: item.contractDate ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    contactId: item.contactId ?? "",
    notes: item.notes ?? "",
    progressPercent:
      item.progressPercent == null ? "" : String(item.progressPercent).replace(".", ","),
  };
}

export function ChantierSubcontractorsPanel({
  projectId,
  canEdit,
}: {
  projectId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<SubcontractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubcontractDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ExtOrg[]>([]);
  const [searching, setSearching] = useState(false);
  const [contacts, setContacts] = useState<ExtOrg["contacts"]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/projects/${projectId}/subcontracts`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/commercial/external-orgs?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        setResults(data.items ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q, open]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setMore(false);
    setQ("");
    setContacts([]);
    setOpen(true);
  }

  async function openEdit(item: SubcontractDto) {
    setEditing(item);
    setForm(fromItem(item));
    setMore(
      Boolean(
        item.contractRef ||
          item.contractDate ||
          item.startDate ||
          item.endDate ||
          item.contactId ||
          item.notes ||
          item.progressPercent != null,
      ),
    );
    setQ("");
    setOpen(true);
    try {
      const res = await fetch(
        `/api/commercial/external-orgs?id=${encodeURIComponent(item.externalOrganizationId)}`,
      );
      const data = await res.json();
      if (res.ok && data.item) setContacts(data.item.contacts ?? []);
    } catch {
      setContacts([]);
    }
  }

  function pickOrg(org: ExtOrg) {
    setForm((f) => ({
      ...f,
      externalOrganizationId: org.id,
      companyLabel: org.tradeName || org.name,
      contactId: org.contacts.find((c) => c.isPrimary)?.id ?? f.contactId,
    }));
    setContacts(org.contacts);
    setQ("");
  }

  async function createCompany() {
    const name = q.trim() || form.companyLabel.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/external-orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      pickOrg({
        id: data.item.id,
        name: data.item.name,
        tradeName: data.item.tradeName,
        contacts: [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        externalOrganizationId: form.externalOrganizationId,
        scope: form.scope,
        contractAmountHt: form.contractAmountHt.replace(/\s/g, "").replace(",", "."),
        status: form.status,
        contractRef: form.contractRef || null,
        contractDate: form.contractDate || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        contactId: form.contactId || null,
        notes: form.notes || null,
        progressPercent: form.progressPercent.replace(",", ".") || null,
      };
      const res = editing
        ? await fetch(`/api/commercial/subcontracts/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/commercial/projects/${projectId}/subcontracts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOpen(false);
      await load();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: SubcontractDto) {
    if (!item.canDelete) {
      if (!confirm("Passer ce contrat en Terminé ? L’entreprise reste dans l’historique.")) {
        return;
      }
      setBusy(true);
      try {
        const res = await fetch(`/api/commercial/subcontracts/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        setOpen(false);
        await load();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!confirm("Retirer ce sous-traitant du chantier ? L’entreprise n’est pas supprimée.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/commercial/subcontracts/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOpen(false);
      await load();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const previewRealized = (() => {
    const amt = Number(form.contractAmountHt.replace(/\s/g, "").replace(",", "."));
    const pct = Number(form.progressPercent.replace(",", "."));
    if (!Number.isFinite(amt) || !Number.isFinite(pct) || form.progressPercent === "") {
      return null;
    }
    return roundMoney((amt * pct) / 100, 2);
  })();

  return (
    <div className="rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Chantier
          </p>
          <h2 className="mt-1 text-lg font-semibold text-bework-ink">Sous-traitants</h2>
          <p className="mt-1 max-w-xl text-sm text-bework-muted">
            Qui intervient, sur quel lot, pour quel montant, où en est le contrat.
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={openCreate}
            className="btn-cc-primary shrink-0"
          >
            + Ajouter un sous-traitant
          </button>
        ) : null}
      </div>

      {error && !open ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
            Aucun sous-traitant sur ce chantier.
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void openEdit(item)}
              className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3.5 text-left transition hover:border-[#1e3a5f]/30 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.companyName}</p>
                <p className="mt-0.5 text-sm text-slate-500">{item.scope}</p>
                {item.progressPercent != null ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Avancement {String(item.progressPercent).replace(".", ",")} %
                    {item.realizedHt != null
                      ? ` · ${fmtEur(item.realizedHt)} / ${fmtEur(item.contractAmountHt)}`
                      : ""}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="text-base font-bold tabular-nums text-[#1e3a5f]">
                  {fmtEur(item.contractAmountHt)} HT
                </p>
                <Badge tone={statusTone(item.status)}>{item.statusLabel}</Badge>
              </div>
            </button>
          ))
        )}
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? editing.companyName : "Ajouter un sous-traitant"}
        description={
          editing
            ? editing.scope
            : "Entreprise, lot, montant, statut. Le reste est facultatif."
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            {editing && canEdit ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(editing)}
                className="text-xs font-semibold text-slate-500 hover:text-red-700"
              >
                {editing.canDelete ? "Retirer du chantier" : "Terminer"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
              >
                Fermer
              </button>
              {canEdit ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save()}
                  className="btn-cc-primary disabled:opacity-60"
                >
                  {busy
                    ? "Enregistrement…"
                    : editing
                      ? "Enregistrer"
                      : "Ajouter le sous-traitant"}
                </button>
              ) : null}
            </div>
          </div>
        }
      >
        <div className="space-y-4 px-5 py-4">
          {error && open ? <p className="text-sm text-red-600">{error}</p> : null}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Entreprise
            </label>
            {form.externalOrganizationId ? (
              <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{form.companyLabel}</p>
                {canEdit ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#1e3a5f]"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        externalOrganizationId: "",
                        companyLabel: "",
                        contactId: "",
                      }))
                    }
                  >
                    Changer
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher une entreprise…"
                  className={inputClass}
                  disabled={!canEdit}
                />
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-100">
                  {searching ? (
                    <p className="px-3 py-2 text-xs text-slate-500">Recherche…</p>
                  ) : results.length === 0 ? (
                    q.trim() && canEdit ? (
                      <button
                        type="button"
                        onClick={() => void createCompany()}
                        className="block w-full px-3 py-2 text-left text-sm text-[#1e3a5f]"
                      >
                        Créer « {q.trim()} »
                      </button>
                    ) : (
                      <p className="px-3 py-2 text-xs text-slate-400">
                        Tapez un nom pour rechercher ou créer.
                      </p>
                    )
                  ) : (
                    results.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => pickOrg(org)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium">{org.tradeName || org.name}</span>
                        {org.city ? (
                          <span className="text-slate-400"> · {org.city}</span>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lot / objet
            </label>
            <input
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
              placeholder="Étanchéité toiture terrasse"
              className={inputClass}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Montant du contrat HT
            </label>
            <input
              value={form.contractAmountHt}
              onChange={(e) =>
                setForm((f) => ({ ...f, contractAmountHt: e.target.value }))
              }
              placeholder="42 000"
              inputMode="decimal"
              className={inputClass}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Statut
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as SubcontractStatus,
                }))
              }
              className={inputClass}
              disabled={!canEdit}
            >
              {(Object.keys(SUBCONTRACT_STATUS_LABELS) as SubcontractStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {SUBCONTRACT_STATUS_LABELS[s]}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Avancement
            </label>
            <input
              value={form.progressPercent}
              onChange={(e) =>
                setForm((f) => ({ ...f, progressPercent: e.target.value }))
              }
              placeholder="45"
              inputMode="decimal"
              className={inputClass}
              disabled={!canEdit}
            />
            {previewRealized != null ? (
              <p className="mt-1 text-xs text-slate-500">
                {fmtEur(previewRealized)} réalisés (informatif, sans impact facturation)
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">Facultatif — en %.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            className="text-xs font-semibold text-[#1e3a5f]"
          >
            {more ? "Masquer les options" : "Plus d’options"}
          </button>

          {more ? (
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Référence contrat
                </label>
                <input
                  value={form.contractRef}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contractRef: e.target.value }))
                  }
                  className={inputClass}
                  disabled={!canEdit}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Date du contrat
                  </label>
                  <input
                    type="date"
                    value={form.contractDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contractDate: e.target.value }))
                    }
                    className={inputClass}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Début</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                    className={inputClass}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Fin prévue
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    className={inputClass}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              {contacts.length > 0 ? (
                <div>
                  <label className="text-xs font-semibold text-slate-500">Contact</label>
                  <select
                    value={form.contactId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contactId: e.target.value }))
                    }
                    className={inputClass}
                    disabled={!canEdit}
                  >
                    <option value="">—</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {`${c.firstName} ${c.lastName}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Notes internes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className={inputClass}
                  disabled={!canEdit}
                />
              </div>
            </div>
          ) : null}
        </div>
      </Drawer>
    </div>
  );
}
