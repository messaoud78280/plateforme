"use client";

import { useState, type FormEvent } from "react";
import {
  FORMATION_BTP_DOMAIN_OPTIONS,
  FORMATION_BTP_LOCATION_OPTIONS,
  FORMATION_BTP_PARTICIPANT_OPTIONS,
  labelFormationBtpDomain,
  labelFormationBtpLocation,
  labelFormationBtpParticipants,
} from "@/lib/formation-btp-interest";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20";
const LABEL_CLASS = "mb-2 block text-sm font-semibold text-slate-800";

/**
 * Formulaire d’intérêt — formation professionnelle BTP.
 * POST `/api/contact` avec source `formation_interest`.
 * Pas de parcours IA 7 h / 14 h, pas d’affirmation Qualiopi / CPF.
 */
export function FormationInterestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const prenom = String(data.get("prenom") ?? "").trim();
    const nom = String(data.get("nom") ?? "").trim();
    const contactName = [prenom, nom].filter(Boolean).join(" ");
    const companyName = String(data.get("companyName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const tradeActivity = String(data.get("tradeActivity") ?? "").trim();
    const domain = String(data.get("formationDomain") ?? "").trim();
    const participants = String(data.get("participants") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const needs = String(data.get("needs") ?? "").trim();

    const messageParts = [
      "Demande d’intérêt — formation professionnelle BTP",
      `Domaine souhaité : ${labelFormationBtpDomain(domain)}`,
      `Nombre de participants : ${labelFormationBtpParticipants(participants)}`,
      `Lieu envisagé : ${labelFormationBtpLocation(location)}`,
      tradeActivity ? `Métier / fonction : ${tradeActivity}` : null,
      needs ? `Besoins techniques : ${needs}` : null,
      "Note : aucune certification Qualiopi / CPF affirmée — à confirmer selon cadre validé.",
    ].filter(Boolean);

    setStatus("loading");
    setErrorDetail(null);
    setReference(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName || contactName,
          contactName,
          email,
          phone,
          marketType: "autre",
          tradeActivity: tradeActivity || null,
          mainNeed: "autre",
          projectStage: location || "a_definir",
          message: messageParts.join("\n"),
          consent: data.get("consent") === "on",
          source: "formation_interest",
          website: data.get("website"),
          formKind: "standard",
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        id?: string;
        emailNotificationSent?: boolean;
      };

      if (json.id && json.emailNotificationSent === false) {
        setReference(json.id);
        setStatus("error");
        setErrorDetail(
          json.error ||
            "Demande enregistrée, mais la notification e-mail a échoué. Écrivez à contact@bework.fr.",
        );
        return;
      }

      if (!res.ok || json.ok === false) {
        setStatus("error");
        setErrorDetail(
          json.error || "Envoi impossible. Écrivez-nous à contact@bework.fr.",
        );
        return;
      }

      setReference(json.id ?? null);
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorDetail("Erreur réseau. Réessayez ou écrivez à contact@bework.fr.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-6 py-8 text-center shadow-sm"
      >
        <p className="text-base font-semibold text-emerald-900">
          Votre demande a bien été envoyée. BeWork vous recontactera pour cadrer
          le besoin formation — sans engagement sur un catalogue de sessions.
        </p>
        {reference ? (
          <p className="mt-3 text-sm text-emerald-800">Référence : {reference}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative space-y-6"
      aria-busy={status === "loading"}
      noValidate
    >
      <div hidden aria-hidden>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="prenom" className={LABEL_CLASS}>
            Prénom <span className="text-red-600">*</span>
          </label>
          <input
            id="prenom"
            name="prenom"
            required
            autoComplete="given-name"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="nom" className={LABEL_CLASS}>
            Nom <span className="text-red-600">*</span>
          </label>
          <input
            id="nom"
            name="nom"
            required
            autoComplete="family-name"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label htmlFor="companyName" className={LABEL_CLASS}>
          Entreprise <span className="text-red-600">*</span>
        </label>
        <input
          id="companyName"
          name="companyName"
          required
          autoComplete="organization"
          className={INPUT_CLASS}
          placeholder="Ex. Entreprise TP Dupont"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            E-mail professionnel <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={INPUT_CLASS}
            placeholder="vous@entreprise.fr"
          />
        </div>
        <div>
          <label htmlFor="phone" className={LABEL_CLASS}>
            Téléphone <span className="text-red-600">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className={INPUT_CLASS}
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tradeActivity" className={LABEL_CLASS}>
          Métier ou fonction <span className="text-red-600">*</span>
        </label>
        <input
          id="tradeActivity"
          name="tradeActivity"
          required
          className={INPUT_CLASS}
          placeholder="Ex. conducteur de travaux, chef d’équipe TP, compagnon VRD…"
        />
      </div>

      <div>
        <label htmlFor="formationDomain" className={LABEL_CLASS}>
          Domaine de formation souhaité <span className="text-red-600">*</span>
        </label>
        <select
          id="formationDomain"
          name="formationDomain"
          required
          className={INPUT_CLASS}
          defaultValue=""
        >
          <option value="" disabled>
            Sélectionnez…
          </option>
          {FORMATION_BTP_DOMAIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="participants" className={LABEL_CLASS}>
            Nombre de participants <span className="text-red-600">*</span>
          </label>
          <select
            id="participants"
            name="participants"
            required
            className={INPUT_CLASS}
            defaultValue=""
          >
            <option value="" disabled>
              Sélectionnez…
            </option>
            {FORMATION_BTP_PARTICIPANT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="location" className={LABEL_CLASS}>
            Lieu de formation <span className="text-red-600">*</span>
          </label>
          <select
            id="location"
            name="location"
            required
            className={INPUT_CLASS}
            defaultValue=""
          >
            <option value="" disabled>
              Sélectionnez…
            </option>
            {FORMATION_BTP_LOCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="needs" className={LABEL_CLASS}>
          Description des besoins techniques{" "}
          <span className="text-red-600">*</span>
        </label>
        <textarea
          id="needs"
          name="needs"
          required
          rows={4}
          maxLength={2000}
          className={`${INPUT_CLASS} resize-y`}
          placeholder="Ouvrages concernés, niveaux des équipes, modes opératoires à renforcer, contraintes chantier…"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-700">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
        />
        <span>
          J&apos;accepte d&apos;être recontacté(e) par BeWork au sujet de cette
          demande de formation professionnelle BTP.{" "}
          <span className="text-red-600">*</span>
        </span>
      </label>

      <p className="text-xs leading-relaxed text-slate-500">
        BeWork ne présente ici aucun parcours comme certifiant, éligible CPF ou
        Qualiopi. Ces mentions ne seront ajoutées qu&apos;après validation
        explicite.
      </p>

      {status === "error" ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {errorDetail || "L’envoi a échoué."}
          {reference ? ` Référence : ${reference}.` : ""}{" "}
          <a
            href="mailto:contact@bework.fr"
            className="font-semibold underline"
          >
            contact@bework.fr
          </a>
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#1d4ed8] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1e40af] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8] disabled:opacity-60"
        >
          {status === "loading" ? "Envoi…" : "Exprimer un besoin formation"}
        </button>
        <p className="mt-3 text-center text-sm text-slate-500">
          Nous cadrons une proposition adaptée à votre chantier et à vos
          équipes.
        </p>
      </div>
    </form>
  );
}
