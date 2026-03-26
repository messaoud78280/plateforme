"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  clientName?: string | null;
  clientEmail?: string | null;
  notes?: string | null;
  recurrence?: string | null;
  status: string;
  organizer: { name: string };
  attachments: { name: string; fileUrl: string }[];
};

const RECURRENCE_OPTIONS = [
  { value: "NONE", label: "Ponctuel" },
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "BIWEEKLY", label: "Bi-hebdomadaire" },
  { value: "MONTHLY", label: "Mensuel" },
];

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function AppointmentCalendar() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [step, setStep] = useState<"calendar" | "form">("calendar");
  const [form, setForm] = useState({
    title: "",
    slot: "",
    notes: "",
    recurrence: "NONE",
    recurrenceEndAt: "",
    files: [] as { name: string; fileUrl: string; fileSize: number; mimeType?: string }[],
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const from = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const to = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59);
    fetch(`/api/appointments?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    const dateStr = selectedDate.toISOString().slice(0, 10);
    fetch(`/api/appointments/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  function handleDayClick(date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;
    setSelectedDate(date);
    setStep("form");
    setForm((f) => ({ ...f, slot: "", title: "" }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/appointments/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
          setForm((f) => ({
            ...f,
            files: [...f.files, { name: data.name, fileUrl: data.fileUrl, fileSize: data.fileSize, mimeType: data.mimeType }],
          }));
        }
      } catch {
        setError("Erreur upload " + file.name);
      }
    }
  }

  function removeFile(index: number) {
    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !selectedDate || !form.slot) {
      setError("Titre, date et créneau requis.");
      return;
    }
    setError("");
    setSending(true);
    const [h, m] = form.slot.split(":").map(Number);
    const startAt = new Date(selectedDate);
    startAt.setHours(h, m, 0, 0);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          notes: form.notes.trim() || undefined,
          recurrence: form.recurrence,
          recurrenceEndAt: form.recurrenceEndAt || undefined,
          attachmentUrls: form.files.length ? form.files : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création.");
        setSending(false);
        return;
      }
      setAppointments((prev) => [...prev, data]);
      setStep("calendar");
      setSelectedDate(null);
      setForm({ title: "", slot: "", notes: "", recurrence: "NONE", recurrenceEndAt: "", files: [] });
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setSending(false);
    }
  }

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDay = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
  }

  const appointmentsByDate = new Map<string, Appointment[]>();
  appointments.forEach((a) => {
    const key = new Date(a.startAt).toISOString().slice(0, 10);
    if (!appointmentsByDate.has(key)) appointmentsByDate.set(key, []);
    appointmentsByDate.get(key)!.push(a);
  });

  return (
    <div className="space-y-6">
      {step === "calendar" ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Calendrier des rendez-vous</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
              >
                ←
              </button>
              <span className="py-1 text-sm font-medium text-slate-700">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
              >
                →
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {DAYS.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-medium text-slate-600">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="min-h-[60px] border-b border-r border-slate-100" />;
                const today = new Date();
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const key = day.toISOString().slice(0, 10);
                const dayAppointments = appointmentsByDate.get(key) ?? [];
                const hasRdv = dayAppointments.length > 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    disabled={isPast}
                    className={`min-h-[60px] border-b border-r border-slate-100 p-1 text-left text-sm transition ${
                      isPast
                        ? "cursor-not-allowed bg-slate-50 text-slate-400"
                        : "hover:bg-blue-50 hover:border-blue-200"
                    }`}
                  >
                    <span className={hasRdv ? "font-semibold text-blue-600" : ""}>{day.getDate()}</span>
                    {hasRdv && (
                      <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" title={`${dayAppointments.length} RDV`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && <p className="text-sm text-slate-500">Chargement...</p>}
        </>
      ) : (
        <div className="rounded-xl surface-metallic-light p-6">
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setStep("calendar"); setSelectedDate(null); }}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Retour au calendrier
            </button>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            {selectedDate?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Titre du rendez-vous *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex. Visio découverte, Point projet..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Créneau *</label>
              {slotsLoading ? (
                <p className="mt-1 text-sm text-slate-500">Chargement des créneaux...</p>
              ) : slots.length === 0 ? (
                <p className="mt-1 text-sm text-amber-600">Aucun créneau disponible ce jour.</p>
              ) : (
                <select
                  value={form.slot}
                  onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Choisir un créneau</option>
                  {slots.map((s) => (
                    <option key={s} value={s}>{s.replace(":", "h")}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Notes / Commentaires</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Décrivez l'objet du rendez-vous, questions à aborder..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Récurrence</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {RECURRENCE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="recurrence"
                      value={opt.value}
                      checked={form.recurrence === opt.value}
                      onChange={(e) => setForm((f) => ({ ...f, recurrence: e.target.value }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              {form.recurrence !== "NONE" && (
                <div className="mt-2">
                  <label className="block text-xs text-slate-600">Fin de récurrence (optionnel)</label>
                  <input
                    type="date"
                    value={form.recurrenceEndAt}
                    onChange={(e) => setForm((f) => ({ ...f, recurrenceEndAt: e.target.value }))}
                    className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Pièces jointes (PDF, images)</label>
              <input
                type="file"
                accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.txt,.csv"
                multiple
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
              {form.files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-sm">
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-red-600 hover:underline">
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={sending || !form.title.trim() || !form.slot}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Création..." : "Réserver le créneau"}
            </button>
          </form>
        </div>
      )}

      {/* Liste des RDV à venir */}
      <div className="rounded-xl surface-metallic-light p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-800">Rendez-vous à venir</h4>
        {appointments.filter((a) => new Date(a.startAt) >= new Date()).length === 0 ? (
          <p className="text-sm text-slate-500">Aucun rendez-vous prévu.</p>
        ) : (
          <ul className="space-y-2">
            {appointments
              .filter((a) => new Date(a.startAt) >= new Date())
              .slice(0, 5)
              .map((a) => {
                const start = new Date(a.startAt);
                const in24h = start.getTime() - Date.now() < 24 * 60 * 60 * 1000;
                return (
                  <li key={a.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${in24h ? "border-amber-200 bg-amber-50/80" : "border-slate-100 bg-slate-50/50"}`}>
                    <span>
                      {in24h && <span className="mr-2 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white">Rappel</span>}
                      <strong>{a.title}</strong> – {start.toLocaleDateString("fr-FR")} à {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {a.clientName && <span className="text-slate-600"> ({a.clientName})</span>}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}
