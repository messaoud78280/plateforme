"use client";

import { useEffect, useState } from "react";
import {
  AGENDA_EVENT_TYPES,
  AGENDA_RECURRENCE_OPTIONS,
  AGENDA_REMINDER_OPTIONS,
} from "@/lib/agenda/types";
import { parseFrenchAgendaQuick } from "@/lib/agenda/quick-parse";
import { findAgendaConflicts } from "@/lib/agenda/conflicts";
import type { AgendaEventDTO, AgendaProjectOption, AgendaQuickCreateDraft, AgendaUserOption } from "./agenda-types";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  event?: AgendaEventDTO | null;
  draft?: AgendaQuickCreateDraft | null;
  projects: AgendaProjectOption[];
  teamUsers: AgendaUserOption[];
  existingEvents?: AgendaEventDTO[];
  onClose: () => void;
  onSaved: (event: AgendaEventDTO) => void;
};

function toLocalInput(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  if (allDay) return `${y}-${m}-${day}`;
  return `${y}-${m}-${day}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string, allDay: boolean, endOfDay = false): string {
  if (allDay) {
    const d = new Date(`${value}T${endOfDay ? "23:59:00" : "00:00:00"}`);
    return d.toISOString();
  }
  return new Date(value).toISOString();
}

export function AgendaEventModal({
  open,
  mode,
  event,
  draft,
  projects,
  teamUsers,
  existingEvents = [],
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState("REUNION_CHANTIER");
  const [projectId, setProjectId] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState<number | "">("");
  const [recurrence, setRecurrence] = useState("NONE");
  const [followUpSheetId, setFollowUpSheetId] = useState("");
  const [followUpOptions, setFollowUpOptions] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void fetch("/api/follow-up/options")
      .then((r) => r.json())
      .then((d) => setFollowUpOptions(Array.isArray(d.sheets) ? d.sheets : []))
      .catch(() => setFollowUpOptions([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (event && (mode === "edit" || event.id === "")) {
      setTitle(event.title);
      setAllDay(event.allDay);
      setStart(toLocalInput(event.startAt, event.allDay));
      setEnd(toLocalInput(event.endAt, event.allDay));
      setType(event.type);
      setProjectId(event.projectId ?? "");
      setResponsibleId(event.responsibleId ?? "");
      setAttendeeIds(event.attendees.map((a) => a.user.id));
      setLocation(event.location ?? "");
      setDescription(event.description ?? "");
      setReminderMinutes(event.reminderMinutes ?? "");
      setRecurrence(event.recurrence ?? "NONE");
      setFollowUpSheetId(event.followUpSheetId ?? event.followUpSheet?.id ?? "");
      return;
    }
    const startIso = draft?.startAt ?? new Date().toISOString();
    const endIso =
      draft?.endAt ??
      new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();
    const isAllDay = Boolean(draft?.allDay);
    setTitle("");
    setAllDay(isAllDay);
    setStart(toLocalInput(startIso, isAllDay));
    setEnd(toLocalInput(endIso, isAllDay));
    setType("REUNION_CHANTIER");
    setProjectId("");
    setResponsibleId("");
    setAttendeeIds([]);
    setLocation("");
    setDescription("");
    setReminderMinutes(15);
    setRecurrence("NONE");
    setFollowUpSheetId("");
  }, [open, mode, event, draft]);

  if (!open) return null;

  const conflictPreview =
    start && end
      ? findAgendaConflicts(
          {
            id: mode === "edit" ? event?.id : null,
            startAt: fromLocalInput(start, allDay, false),
            endAt: fromLocalInput(end, allDay, true),
            responsibleId: responsibleId || null,
            projectId: projectId || null,
          },
          existingEvents,
        )
      : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (!start || !end) {
      setError("Horaires obligatoires.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        allDay,
        startAt: fromLocalInput(start, allDay, false),
        endAt: fromLocalInput(end, allDay, true),
        type,
        projectId: projectId || null,
        responsibleId: responsibleId || null,
        attendeeIds,
        location: location.trim() || null,
        description: description.trim() || null,
        reminderMinutes: reminderMinutes === "" ? null : Number(reminderMinutes),
        recurrence,
        followUpSheetId: followUpSheetId || null,
      };

      const url =
        mode === "edit" && event ? `/api/agenda/events/${event.id}` : "/api/agenda/events";
      const method = mode === "edit" && event ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        setSaving(false);
        return;
      }
      onSaved(data.event as AgendaEventDTO);
      onClose();
    } catch {
      setError("Erreur de connexion.");
    }
    setSaving(false);
  }

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/30 p-4 pt-[8vh]">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fermer" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">
            {mode === "edit" ? "Modifier l’événement" : "Nouvel événement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Titre *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (mode !== "create" || !title.trim()) return;
                const parsed = parseFrenchAgendaQuick(title);
                if (!parsed) return;
                setTitle(parsed.title);
                setAllDay(parsed.allDay);
                setStart(toLocalInput(parsed.startAt.toISOString(), parsed.allDay));
                setEnd(toLocalInput(parsed.endAt.toISOString(), parsed.allDay));
                if (parsed.type) setType(parsed.type);
              }}
              placeholder="Ex. Réunion chantier demain 9h30"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            Journée entière
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Début</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Fin</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
              >
                {AGENDA_EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Chantier</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
              >
                <option value="">Aucun</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Fiche de suivi</label>
            <select
              value={followUpSheetId}
              onChange={(e) => setFollowUpSheetId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
            >
              <option value="">Aucune</option>
              {followUpOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            {followUpSheetId ? (
              <a
                href={`/dashboard/fiches-suivi/${followUpSheetId}`}
                className="mt-1 inline-block text-[11px] font-semibold text-[#1d4ed8] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir la fiche →
              </a>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Responsable</label>
            <select
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
            >
              <option value="">Non assigné</option>
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Participants</label>
            <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {teamUsers.length === 0 ? (
                <p className="text-xs text-slate-400">Aucun collaborateur</p>
              ) : (
                teamUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={attendeeIds.includes(u.id)}
                      onChange={() => toggleAttendee(u.id)}
                    />
                    <span className="truncate">{u.name || u.email}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {conflictPreview.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              <p className="font-bold">Chevauchement détecté (avertissement)</p>
              <ul className="mt-1 list-disc pl-4">
                {conflictPreview.slice(0, 3).map((c) => (
                  <li key={c.otherId}>
                    « {c.otherTitle} » — même {c.reason === "responsable" ? "responsable" : "chantier"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Lieu</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
              placeholder="Adresse chantier, bureau…"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Rappel</label>
              <select
                value={reminderMinutes === "" ? "" : String(reminderMinutes)}
                onChange={(e) =>
                  setReminderMinutes(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
              >
                <option value="">Aucun</option>
                {AGENDA_REMINDER_OPTIONS.map((o) => (
                  <option key={o.minutes} value={o.minutes}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Récurrence</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1d4ed8]"
              >
                {AGENDA_RECURRENCE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
