"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

type TakenSlot = { date: string; time: string };

const FORMULES = [
  { id: "standard", label: "Standard (215€/mois)", value: "Standard" },
  { id: "standard-plus", label: "Standard + (415€/mois)", value: "Standard +" },
  { id: "premium", label: "Premium (630€/mois)", value: "Premium" },
  { id: "fulltime", label: "Full-time (1 230€/mois)", value: "Full-time" },
  { id: "sur-mesure", label: "Sur-mesure / À définir", value: "Sur-mesure" },
];

function getNextWorkingDays(count: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const d = new Date();
  const fmt = (date: Date) => {
    const j = date.getDate();
    const m = date.getMonth() + 1;
    const days = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
    const dayName = days[date.getDay()];
    return { value: date.toISOString().slice(0, 10), label: `${dayName} ${j}/${m}/${date.getFullYear()}` };
  };
  let added = 0;
  while (added < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      out.push(fmt(new Date(d)));
      added++;
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<TakenSlot[]>([]);
  const [selectedRdvDate, setSelectedRdvDate] = useState("");

  const dates = getNextWorkingDays(14);

  useEffect(() => {
    fetch("/api/contact/slots")
      .then((r) => r.json())
      .then((data: { slots?: TakenSlot[] }) => setTakenSlots(data.slots ?? []))
      .catch(() => setTakenSlots([]));
  }, []);

  function isSlotTaken(date: string, time: string) {
    return takenSlots.some((s) => s.date === date && s.time === time);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      structure: fd.get("structure") as string,
      denominationSociale: fd.get("denominationSociale") as string,
      contactName: fd.get("contactName") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      formule: fd.get("formule") as string,
      message: fd.get("message") as string,
      rdvDate: fd.get("rdvDate") as string,
      rdvTime: fd.get("rdvTime") as string,
      sector: (fd.get("sector") as string) || undefined,
      howKnown: (fd.get("howKnown") as string) || undefined,
    };

    if (!payload.structure?.trim() || !payload.contactName?.trim() || !payload.email?.trim()) {
      setError("Veuillez remplir au minimum le nom de la structure, le nom du contact et l’email.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue. Réessayez ou contactez-nous par email.");
        return;
      }
      setSent(true);
      form.reset();
    } catch {
      setError("Problème de connexion. Réessayez ou contactez-nous par email.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea] py-16 px-4">
        <div className="mx-auto max-w-2xl">
          <header className="mb-12 flex justify-center">
            <Link href="/">
              <BeWorkLogo size="lg" />
            </Link>
          </header>
          <div className="rounded-2xl border border-[#c8cdd6] bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 text-center text-2xl font-bold text-[#0f172a]">
              Demande envoyée
            </h1>
            <p className="mt-3 text-center text-[#334155]">
              Nous avons bien reçu votre demande et vos coordonnées. Nous vous recontacterons très prochainement à l’adresse indiquée pour confirmer votre rendez-vous en visioconférence et vous expliquer notre mode opératoire et les conditions de collaboration.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/"
                className="rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]"
              >
                Retour à l’accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea] py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/">
            <BeWorkLogo size="md" />
          </Link>
          <Link
            href="/"
            className="text-sm text-[#64748b] underline hover:text-[#0f172a]"
          >
            Retour à l’accueil
          </Link>
        </header>

        <h1 className="text-3xl font-bold text-[#0f172a] md:text-4xl">
          Demande de contact et rendez-vous
        </h1>
        <p className="mt-2 text-[#334155]">
          Renseignez vos informations et choisissez un créneau pour un premier rendez-vous en visioconférence. Nous vous recontacterons par email et vous expliquerons lors du RDV notre mode opératoire pour travailler ensemble et les conditions.
        </p>

        <div className="mt-8 rounded-2xl border border-[#c8cdd6] bg-[#f8f9fb] p-4 text-sm text-[#334155]">
          <p className="font-medium text-[#0f172a]">Premier rendez-vous (visio)</p>
          <p className="mt-1">
            Lors de ce premier échange en visioconférence, nous vous présenterons notre façon de travailler, les conditions de collaboration et répondrons à toutes vos questions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-[#c8cdd6] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a]">Votre structure</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="structure" className="block text-sm font-medium text-[#334155]">
                  Nom de la structure <span className="text-red-500">*</span>
                </label>
                <input
                  id="structure"
                  name="structure"
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Ex. Mon Entreprise SAS"
                />
              </div>
              <div>
                <label htmlFor="denominationSociale" className="block text-sm font-medium text-[#334155]">
                  Dénomination sociale
                </label>
                <input
                  id="denominationSociale"
                  name="denominationSociale"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Raison sociale officielle"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#c8cdd6] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a]">Contact et coordonnées</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-[#334155]">
                  Nom du contact <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Prénom et nom"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#334155]">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="contact@exemple.fr"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-[#334155]">
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#c8cdd6] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a]">Formule souhaitée</h2>
            <div className="mt-4">
              <label htmlFor="formule" className="block text-sm font-medium text-[#334155]">
                Choisissez une formule
              </label>
              <select
                id="formule"
                name="formule"
                className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
              >
                <option value="">— Sélectionnez —</option>
                {FORMULES.map((f) => (
                  <option key={f.id} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-[#c8cdd6] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a]">Demande de rendez-vous</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Sélectionnez une date et un créneau. Nous vous enverrons un lien de visioconférence par email après confirmation.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rdvDate" className="block text-sm font-medium text-[#334155]">
                  Date souhaitée
                </label>
                <select
                  id="rdvDate"
                  name="rdvDate"
                  value={selectedRdvDate}
                  onChange={(e) => setSelectedRdvDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                >
                  <option value="">— Choisir une date —</option>
                  {dates.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rdvTime" className="block text-sm font-medium text-[#334155]">
                  Créneau horaire
                </label>
                <select
                  id="rdvTime"
                  name="rdvTime"
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                >
                  <option value="">— Choisir un créneau —</option>
                  {TIME_SLOTS.map((t) => {
                    const taken = selectedRdvDate ? isSlotTaken(selectedRdvDate, t) : false;
                    return (
                      <option key={t} value={t} disabled={taken}>
                        {t.replace(":", "h")}{taken ? " (indisponible)" : ""}
                      </option>
                    );
                  })}
                </select>
                {selectedRdvDate && (
                  <p className="mt-1 text-xs text-[#64748b]">
                    Les créneaux déjà pris sont marqués « indisponible ».
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#c8cdd6] bg-white p-6 shadow-sm">
            <label htmlFor="message" className="block text-lg font-semibold text-[#0f172a]">
              Votre message ou demande
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="mt-2 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
              placeholder="Décrivez brièvement votre besoin ou posez vos questions..."
            />
          </div>

          <div className="rounded-2xl border border-[#c8cdd6] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0f172a]">Informations complémentaires (optionnel)</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sector" className="block text-sm font-medium text-[#334155]">
                  Secteur d’activité
                </label>
                <input
                  id="sector"
                  name="sector"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Ex. Conseil, Santé, BTP..."
                />
              </div>
              <div>
                <label htmlFor="howKnown" className="block text-sm font-medium text-[#334155]">
                  Comment nous avez-vous connu ?
                </label>
                <select
                  id="howKnown"
                  name="howKnown"
                  className="mt-1 w-full rounded-lg border border-[#c8cdd6] bg-white px-3 py-2 text-[#0f172a] focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                >
                  <option value="">— Sélectionnez —</option>
                  <option value="recherche">Recherche internet</option>
                  <option value="recommandation">Recommandation</option>
                  <option value="reseau">Réseaux sociaux</option>
                  <option value="salon">Salon / événement</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-[#1d4ed8] px-8 py-3 font-semibold text-white shadow-md hover:bg-[#1e40af] disabled:opacity-60"
            >
              {sending ? "Envoi en cours…" : "Envoyer ma demande"}
            </button>
            <Link
              href="/"
              className="text-sm text-[#64748b] underline hover:text-[#0f172a]"
            >
              Annuler
            </Link>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-[#64748b]">
          En envoyant ce formulaire, vous acceptez d’être recontacté par BeWork dans le cadre de votre demande.
        </p>
      </div>
    </div>
  );
}
