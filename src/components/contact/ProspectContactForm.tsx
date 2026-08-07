"use client";

import { useState, type FormEvent } from "react";
import {
  MAIN_NEED_OPTIONS,
  MARKET_TYPE_OPTIONS,
  PROJECT_STAGE_OPTIONS,
} from "@/lib/contact-form-options";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20";
const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-slate-800";

export type ProspectContactFormProps = {
  /** Valeur enregistrée en base (`ContactRequest.source`). */
  source?: string;
  /** Variante compacte pour la homepage. */
  variant?: "default" | "compact";
};

export function ProspectContactForm({
  source = "homepage_contact_form",
  variant = "default",
}: ProspectContactFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: data.get("companyName"),
          email: data.get("email"),
          phone: data.get("phone"),
          marketType: data.get("marketType"),
          tradeActivity: data.get("tradeActivity"),
          mainNeed: data.get("mainNeed"),
          projectStage: data.get("projectStage"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
          source,
          website: data.get("website"),
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-6 py-8 text-center shadow-sm"
      >
        <p className="text-base font-semibold text-emerald-900">
          Votre demande a bien été envoyée. BeWork vous recontactera rapidement.
        </p>
      </div>
    );
  }

  const gridClass = variant === "compact" ? "grid gap-5 sm:grid-cols-2" : "grid gap-5 md:grid-cols-2";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Honeypot anti-spam */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website">Site web</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={gridClass}>
        <div className={variant === "compact" ? "sm:col-span-2" : "md:col-span-2"}>
          <label htmlFor="companyName" className={LABEL_CLASS}>
            Entreprise <span className="text-red-600">*</span>
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            autoComplete="organization"
            className={INPUT_CLASS}
            placeholder="Ex. SARL Dupont — électricité"
          />
        </div>

        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            Email <span className="text-red-600">*</span>
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
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={INPUT_CLASS}
            placeholder="06 12 34 56 78"
          />
        </div>

        <div>
          <label htmlFor="marketType" className={LABEL_CLASS}>
            Nombre de collaborateurs <span className="text-red-600">*</span>
          </label>
          <select id="marketType" name="marketType" required className={INPUT_CLASS}>
            <option value="">Sélectionnez…</option>
            {MARKET_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mainNeed" className={LABEL_CLASS}>
            Besoin principal <span className="text-red-600">*</span>
          </label>
          <select id="mainNeed" name="mainNeed" required className={INPUT_CLASS}>
            <option value="">Sélectionnez…</option>
            {MAIN_NEED_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="projectStage" className={LABEL_CLASS}>
            Outils utilisés aujourd&apos;hui
          </label>
          <select id="projectStage" name="projectStage" className={INPUT_CLASS}>
            <option value="">Sélectionnez…</option>
            {PROJECT_STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={variant === "compact" ? "sm:col-span-2" : "md:col-span-2"}>
          <label htmlFor="tradeActivity" className={LABEL_CLASS}>
            Activité / corps d&apos;état
          </label>
          <input
            id="tradeActivity"
            name="tradeActivity"
            type="text"
            className={INPUT_CLASS}
            placeholder="Ex. second œuvre, CVC, gros œuvre…"
          />
        </div>

        <div className={variant === "compact" ? "sm:col-span-2" : "md:col-span-2"}>
          <label htmlFor="message" className={LABEL_CLASS}>
            Quelle est aujourd&apos;hui votre principale difficulté&nbsp;?
          </label>
          <textarea
            id="message"
            name="message"
            rows={variant === "compact" ? 3 : 4}
            maxLength={2000}
            className={`${INPUT_CLASS} resize-y`}
            placeholder="Ex. documents dispersés, suivi chantier difficile, marchés publics chronophages…"
          />
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Indiquez aussi le nombre d&apos;utilisateurs envisagés si vous le connaissez.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
        />
        <span className="text-sm leading-relaxed text-slate-700">
          J&apos;accepte d&apos;être recontacté par BeWork au sujet de ma demande.{" "}
          <span className="text-red-600">*</span>
        </span>
      </label>

      {status === "error" && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Une erreur est survenue. Vous pouvez nous écrire directement à{" "}
          <a href="mailto:contact@bework.fr" className="font-semibold underline">
            contact@bework.fr
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:w-auto sm:text-[0.9375rem] w-full"
      >
        {status === "loading" ? "Envoi en cours…" : "Demander une démonstration personnalisée"}
      </button>
    </form>
  );
}
