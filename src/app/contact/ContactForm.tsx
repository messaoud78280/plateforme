"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

type TakenSlot = { date: string; time: string };

const FORMULES = [
  { id: "structure", label: "Structure — 290 € TTC / mois", value: "Structure" },
  { id: "suivi", label: "Suivi — 490 € TTC / mois", value: "Suivi" },
  { id: "pilotage", label: "Pilotage — 1 190 € TTC / mois", value: "Pilotage" },
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
        setError(data.error || "Une erreur est survenue. Réessayez ou écrivez-nous directement par email.");
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
          <div className="rounded-2xl surface-metallic-light p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 text-center text-2xl font-bold text-black">
              Demande envoyée
            </h1>
            <p className="mt-3 text-center text-black">
              Nous avons bien reçu votre message. Nous vous recontacterons à l’adresse indiquée pour confirmer le créneau visio
              et préciser le cadre d’un éventuel accompagnement — périmètre, forfait et modalités.
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
    <div className="px-4 py-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-metallic-black font-sans text-3xl font-semibold tracking-tight md:text-4xl">
          Échanger sur votre organisation
        </h1>
        <p className="mt-4 text-base font-medium leading-relaxed text-black md:text-lg">
          En validant ce formulaire, vous déclenchez un <span className="text-[#1d4ed8]">premier rendez-vous découverte</span> avec BeWork :{" "}
          <strong className="font-semibold text-black">nous vous proposons rapidement un rendez-vous en visioconférence</strong>{" "}
          — pas une file d’attente sans suite. C’est le moment où nous nous parlons{" "}
          <strong className="font-semibold text-black">de vive voix</strong>.
        </p>
        <ol className="mt-5 list-none space-y-3 pl-0 text-sm leading-relaxed text-black md:text-[0.9375rem]">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-xs font-bold text-[#1d4ed8]" aria-hidden>
              1
            </span>
            <span>
              Décrivez votre structure, votre secteur (de préférence <strong className="font-semibold text-black">BTP</strong>{" "}
              ou activités proches), votre charge administrative et ce que vous attendez.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-xs font-bold text-[#1d4ed8]" aria-hidden>
              2
            </span>
            <span>
              Choisissez un créneau visio dans le formulaire : nous <strong className="font-semibold text-black">confirmons par e-mail dans les meilleurs délais</strong>{" "}
              et préparons l’échange en fonction de vos réponses.
            </span>
          </li>
        </ol>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-black">
          Tous nos tarifs sont exprimés TTC, sans frais supplémentaires.
        </p>

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#c8d0dc] via-white/90 to-[#a8b4c8] p-[1px] shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
          <div className="surface-metallic-light surface-metallic-light--soft rounded-2xl p-5 text-left md:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">Après votre envoi</p>
            <p className="mt-2 font-sans text-lg font-semibold text-black md:text-xl">
              Visio découverte — échange direct avec l’équipe
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black md:text-[0.9375rem]">
              Lors de ce rendez-vous, nous vous expliquons{" "}
              <strong className="font-semibold text-black">oralement notre façon de travailler</strong> : méthode, cadre,
              forfaits et ce que nous pouvons prendre en charge concrètement pour votre entreprise.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black md:text-[0.9375rem]">
              Nous regardons ensemble comment <strong className="font-semibold text-black">mieux structurer votre organisation</strong>{" "}
              administrative (devis, facturation, relances, dossiers chantier, coordination…) afin de{" "}
              <strong className="font-semibold text-black">sécuriser votre activité et soutenir votre chiffre d’affaires</strong>
              : moins de temps perdu sur des tâches qui traînent, une trésorerie et un suivi commercial plus fluides — sans
              promesse creuse, avec des leviers réalistes pour le BTP.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black md:text-[0.9375rem]">
              L’objectif reste de vérifier si un accompagnement BeWork a du sens pour vous comme pour nous — ce n’est pas une
              démo générique imposée à toutes les structures.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="rounded-2xl surface-metallic-light p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Votre structure</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="structure" className="block text-sm font-medium text-black">
                  Nom de la structure <span className="text-red-500">*</span>
                </label>
                <input
                  id="structure"
                  name="structure"
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Ex. Mon Entreprise SAS"
                />
              </div>
              <div>
                <label htmlFor="denominationSociale" className="block text-sm font-medium text-black">
                  Dénomination sociale
                </label>
                <input
                  id="denominationSociale"
                  name="denominationSociale"
                  type="text"
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Raison sociale officielle"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl surface-metallic-light p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Contact et coordonnées</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-black">
                  Nom du contact <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Prénom et nom"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="contact@exemple.fr"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-black">
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl surface-metallic-light p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Formule souhaitée</h2>
            <div className="mt-4">
              <label htmlFor="formule" className="block text-sm font-medium text-black">
                Choisissez une formule
              </label>
              <select
                id="formule"
                name="formule"
                className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
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

          <div className="rounded-2xl surface-metallic-light p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Demande de rendez-vous</h2>
            <p className="mt-1 text-sm text-black">
              Sélectionnez une date et un créneau. Nous vous enverrons un lien de visioconférence par email après confirmation.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rdvDate" className="block text-sm font-medium text-black">
                  Date souhaitée
                </label>
                <select
                  id="rdvDate"
                  name="rdvDate"
                  value={selectedRdvDate}
                  onChange={(e) => setSelectedRdvDate(e.target.value)}
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
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
                <label htmlFor="rdvTime" className="block text-sm font-medium text-black">
                  Créneau horaire
                </label>
                <select
                  id="rdvTime"
                  name="rdvTime"
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
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
                  <p className="mt-1 text-xs text-black">
                    Les créneaux déjà pris sont marqués « indisponible ».
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl surface-metallic-light p-6 shadow-sm">
            <label htmlFor="message" className="block text-lg font-semibold text-black">
              Votre message ou demande
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="mt-2 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
              placeholder="Décrivez brièvement votre besoin ou posez vos questions..."
            />
          </div>

          <div className="rounded-2xl surface-metallic-light p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Informations complémentaires (optionnel)</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sector" className="block text-sm font-medium text-black">
                  Secteur d’activité
                </label>
                <input
                  id="sector"
                  name="sector"
                  type="text"
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  placeholder="Ex. Conseil, Santé, BTP..."
                />
              </div>
              <div>
                <label htmlFor="howKnown" className="block text-sm font-medium text-black">
                  Comment nous avez-vous connu ?
                </label>
                <select
                  id="howKnown"
                  name="howKnown"
                  className="mt-1 w-full rounded-lg surface-metallic-light px-3 py-2 text-black focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
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
              {sending ? "Envoi en cours…" : "Valider la demande d’échange"}
            </button>
            <Link
              href="/"
              className="text-sm text-black underline hover:text-black"
            >
              Annuler
            </Link>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-black">
          En envoyant ce formulaire, vous acceptez d’être recontacté par BeWork dans le cadre de votre demande.
        </p>
      </div>
    </div>
  );
}
