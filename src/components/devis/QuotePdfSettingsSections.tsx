import { updateQuoteProjectIssuer } from "@/app/dashboard/devis/quote-actions";
import type { QuotePdfPresentationSettings } from "@/lib/be-work-devis-pdf-presentation";
import type { QuoteDocument, QuoteProject } from "@prisma/client";

type IssuerProps = { project: QuoteProject; documentId: string };

type PresentationProps = {
  pdfSettings: QuotePdfPresentationSettings;
  document: Pick<QuoteDocument, "quoteObject" | "commercialConditions" | "technicalReservations" | "legalDisclaimer">;
};

export function QuotePdfPresentationFields({ pdfSettings, document }: PresentationProps) {
  return (
    <>
      <div className="rounded-xl border border-[#1e3a5f]/15 bg-slate-50/80 p-4">
        <h3 className="text-sm font-bold text-slate-900">Mode de génération PDF</h3>
        <p className="mt-1 text-xs text-slate-600">
          Le devis officiel est émis au nom de votre entreprise. BeWork n&apos;apparaît qu&apos;en mention technique en pied de page.
        </p>
        <div className="mt-4 space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <input type="radio" name="pdfMode" value="official" defaultChecked={pdfSettings.pdfMode === "official"} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Devis officiel entreprise</span>
              <span className="block text-xs text-slate-600">Document commercial prêt à envoyer au client.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <input type="radio" name="pdfMode" value="estimation" defaultChecked={pdfSettings.pdfMode === "estimation"} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Estimation indicative BeWork</span>
              <span className="block text-xs text-slate-600">Non contractuel — chiffrage interne.</span>
            </span>
          </label>
        </div>
      </div>
      <div className="rounded-xl border border-[#1e3a5f]/15 bg-slate-50/80 p-4">
        <h3 className="text-sm font-bold text-slate-900">Mise en page</h3>
        <p className="mt-1 text-xs text-slate-600">Modèle commercial : sans coordonnées société en en-tête (recommandé).</p>
        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <input type="radio" name="pdfLayoutStyle" value="commercial" defaultChecked={pdfSettings.layoutStyle !== "classic"} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Commercial (type ERP)</span>
              <span className="block text-xs text-slate-600">Titre + client, tableau simplifié.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <input type="radio" name="pdfLayoutStyle" value="classic" defaultChecked={pdfSettings.layoutStyle === "classic"} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Classique</span>
              <span className="block text-xs text-slate-600">Logo et coordonnées entreprise à gauche.</span>
            </span>
          </label>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="pdfShowIssuerOnPdf" defaultChecked={pdfSettings.showIssuerOnPdf} className="rounded border-slate-300" />
          Afficher les coordonnées société sur le PDF
        </label>
      </div>
      <div className="rounded-xl border border-[#1e3a5f]/15 bg-slate-50/80 p-4">
        <h3 className="text-sm font-bold text-slate-900">Contenu du PDF</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="quoteObject">Objet du devis</label>
            <textarea id="quoteObject" name="quoteObject" rows={2} defaultValue={document.quoteObject ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="pdfDesignationMode">Désignations</label>
            <select id="pdfDesignationMode" name="pdfDesignationMode" defaultValue={pdfSettings.designationMode} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="full">Complète</option>
              <option value="summary">Résumé</option>
            </select>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              { name: "pdfShowLineVat", label: "Colonne TVA", defaultChecked: pdfSettings.showLineVat },
              { name: "pdfShowLotSubtotals", label: "Sous-totaux par lot", defaultChecked: pdfSettings.showLotSubtotals },
              { name: "pdfShowSignatureBlock", label: "Bon pour accord", defaultChecked: pdfSettings.showSignatureBlock },
            ].map((opt) => (
              <li key={opt.name}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name={opt.name} defaultChecked={opt.defaultChecked} className="rounded border-slate-300" />
                  {opt.label}
                </label>
              </li>
            ))}
          </ul>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="commercialConditions">Conditions commerciales</label>
            <textarea id="commercialConditions" name="commercialConditions" rows={5} defaultValue={document.commercialConditions ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="technicalReservations">Réserves techniques</label>
            <textarea id="technicalReservations" name="technicalReservations" rows={3} defaultValue={document.technicalReservations ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="legalDisclaimer">Mentions légales personnalisées</label>
            <textarea id="legalDisclaimer" name="legalDisclaimer" rows={4} defaultValue={document.legalDisclaimer ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
          </div>
        </div>
      </div>
    </>
  );
}

export function QuotePdfIssuerSection({ project, documentId }: IssuerProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-bold text-slate-900">Entreprise émettrice (vos travaux)</h2>
      <p className="mt-1 text-sm text-slate-600">BeWork est uniquement l&apos;outil de génération — pas l&apos;entreprise qui réalise les travaux.</p>
      <form action={updateQuoteProjectIssuer} className="mt-6 space-y-4">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="documentId" value={documentId} />
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerCompanyName">Raison sociale *</label>
          <input id="issuerCompanyName" name="issuerCompanyName" required defaultValue={project.issuerCompanyName ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerLogoPath">Logo (/public/...)</label>
          <input id="issuerLogoPath" name="issuerLogoPath" defaultValue={project.issuerLogoPath ?? ""} placeholder="/logos/entreprise.png" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerAddressLine1">Adresse *</label>
            <input id="issuerAddressLine1" name="issuerAddressLine1" defaultValue={project.issuerAddressLine1 ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerAddressLine2">Ville / CP</label>
            <input id="issuerAddressLine2" name="issuerAddressLine2" defaultValue={project.issuerAddressLine2 ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerPhone">Téléphone</label>
            <input id="issuerPhone" name="issuerPhone" defaultValue={project.issuerPhone ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerEmail">E-mail</label>
            <input id="issuerEmail" name="issuerEmail" type="email" defaultValue={project.issuerEmail ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerSiret">SIRET *</label>
            <input id="issuerSiret" name="issuerSiret" defaultValue={project.issuerSiret ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerTvaNumber">TVA intracom.</label>
            <input id="issuerTvaNumber" name="issuerTvaNumber" defaultValue={project.issuerTvaNumber ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerApeCode">APE / NAF</label>
            <input id="issuerApeCode" name="issuerApeCode" defaultValue={project.issuerApeCode ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="clientReference">Réf. client</label>
            <input id="clientReference" name="clientReference" defaultValue={project.clientReference ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerInsuranceName">Assurance</label>
            <input id="issuerInsuranceName" name="issuerInsuranceName" defaultValue={project.issuerInsuranceName ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerInsurancePolicy">N° police</label>
            <input id="issuerInsurancePolicy" name="issuerInsurancePolicy" defaultValue={project.issuerInsurancePolicy ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issuerLegalMentions">Mentions légales additionnelles</label>
          <textarea id="issuerLegalMentions" name="issuerLegalMentions" rows={3} defaultValue={project.issuerLegalMentions ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <button type="submit" className="rounded-xl border border-[#1e3a5f] bg-white px-5 py-2.5 text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50">Enregistrer l&apos;entreprise émettrice</button>
      </form>
    </section>
  );
}
