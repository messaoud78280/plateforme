"use client";

import { useState, type FormEvent } from "react";
import {
  IT_LEVEL_OPTIONS,
  LEARN_INTENT_OPTIONS,
} from "@/lib/bework-formation";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20";
const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-slate-800";

/** Formulaire d’intérêt formation — POST `/api/contact` avec source `formation_interest`. */
export function FormationInterestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [intents, setIntents] = useState<string[]>([]);

  function toggleIntent(value: string) {
    setIntents((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const prenom = String(data.get("prenom") ?? "").trim();
    const nom = String(data.get("nom") ?? "").trim();
    const contactName = [prenom, nom].filter(Boolean).join(" ");
    const itLevel = String(data.get("itLevel") ?? "");
    const hasIdea = String(data.get("hasIdea") ?? "");
    const projectDesc = String(data.get("projectDesc") ?? "").trim();
    const intentLabels = LEARN_INTENT_OPTIONS.filter((o) => intents.includes(o.value)).map((o) => o.label);
    const itLabel = IT_LEVEL_OPTIONS.find((o) => o.value === itLevel)?.label ?? itLevel;

    const messageParts = [
      "Demande d’intérêt — formation BeWork",
      `Niveau informatique : ${itLabel || "—"}`,
      `A une idée de projet : ${hasIdea === "oui" ? "Oui" : hasIdea === "non" ? "Non" : "—"}`,
      intentLabels.length ? `Souhaite apprendre à créer : ${intentLabels.join(", ")}` : null,
      projectDesc ? `Description projet : ${projectDesc}` : null,
    ].filter(Boolean);

    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: String(data.get("activite") ?? "").trim() || contactName,
          contactName,
          email: data.get("email"),
          phone: data.get("phone"),
          marketType: "autre",
          tradeActivity: data.get("activite"),
          mainNeed: "ne_sais_pas_encore",
          projectStage: hasIdea === "oui" ? "idee_claire" : "exploration",
          message: messageParts.join("\n"),
          consent: data.get("consent") === "on",
          source: "formation_interest",
          website: data.get("website"),
          formKind: "standard",
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      form.reset();
      setIntents([]);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-6 py-8 text-center shadow-sm">
        <p className="text-base font-semibold text-emerald-900">
          Votre demande a bien été envoyée. BeWork vous recontactera rapidement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website">Site web</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="prenom" className={LABEL_CLASS}>
            Prénom <span className="text-red-600">*</span>
          </label>
          <input id="prenom" name="prenom" required autoComplete="given-name" className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="nom" className={LABEL_CLASS}>
            Nom <span className="text-red-600">*</span>
          </label>
          <input id="nom" name="nom" required autoComplete="family-name" className={INPUT_CLASS} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            E-mail <span className="text-red-600">*</span>
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="phone" className={LABEL_CLASS}>
            Téléphone
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={INPUT_CLASS} />
        </div>
      </div>

      <div>
        <label htmlFor="activite" className={LABEL_CLASS}>
          Activité <span className="text-red-600">*</span>
        </label>
        <input
          id="activite"
          name="activite"
          required
          className={INPUT_CLASS}
          placeholder="Ex. artisan, indépendant, dirigeant TPE…"
        />
      </div>

      <fieldset>
        <legend className={`${LABEL_CLASS} mb-2`}>
          Niveau informatique <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {IT_LEVEL_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="radio"
                name="itLevel"
                value={o.value}
                required
                className="h-4 w-4 border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={`${LABEL_CLASS} mb-2`}>
          Avez-vous déjà une idée de projet&nbsp;? <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          {[
            { value: "oui", label: "Oui" },
            { value: "non", label: "Non" },
          ].map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="radio"
                name="hasIdea"
                value={o.value}
                required
                className="h-4 w-4 border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="projectDesc" className={LABEL_CLASS}>
          Description du projet <span className="font-normal text-slate-500">(optionnel)</span>
        </label>
        <textarea
          id="projectDesc"
          name="projectDesc"
          rows={3}
          maxLength={2000}
          className={`${INPUT_CLASS} resize-y`}
          placeholder="En quelques phrases…"
        />
      </div>

      <fieldset>
        <legend className={`${LABEL_CLASS} mb-2`}>Je souhaite apprendre à créer</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEARN_INTENT_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={intents.includes(o.value)}
                onChange={() => toggleIntent(o.value)}
                className="h-4 w-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
        />
        <span>
          J&apos;accepte d&apos;être recontacté(e) au sujet de la formation BeWork.{" "}
          <span className="text-red-600">*</span>
        </span>
      </label>

      {status === "error" ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          L&apos;envoi a échoué. Réessayez dans un instant ou écrivez-nous directement.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[#1d4ed8] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1e40af] disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
