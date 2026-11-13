import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import "@/components/marketing-btp/btp-marketing.css";
import { absoluteUrl } from "@/lib/site";

const path = "/conditions-generales-vente";
const pageUrl = absoluteUrl(path);

export const metadata: Metadata = {
  title: { absolute: "Conditions générales | BeWork" },
  description:
    "Conditions applicables aux prestations BeWork de conduite de travaux, pilotage de chantier et assistance aux marchés. Cadre général — le contrat de mission prévaut.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  robots: { index: true, follow: true },
};

export default function ConditionsGeneralesVentePage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main className="bw-btp-section bw-btp-section-alt">
        <div className="bw-btp-container max-w-3xl prose prose-slate">
          <h1 className="text-3xl font-bold text-[var(--btp-night)]">
            Conditions générales
          </h1>
          <p className="mt-4 rounded-xl border border-[var(--btp-border)] bg-white p-4 text-sm text-[var(--btp-muted)]">
            Les conditions ci-dessous décrivent le cadre général des prestations
            BTP. Elles ne remplacent pas un contrat de mission signé. Le
            périmètre, les livrables et les responsabilités sont précisés dans
            chaque devis accepté.
          </p>
          <h2 className="mt-8 text-xl font-bold">Objet</h2>
          <p className="mt-3 text-[var(--btp-muted)]">
            BeWork propose des prestations de conduite de travaux, d’encadrement
            opérationnel, de pilotage de chantier, d’assistance aux marchés et
            d’accompagnement associés, sur devis et dans le cadre d’un contrat
            de prestation de services.
          </p>
          <h2 className="mt-8 text-xl font-bold">Devis et contrat</h2>
          <p className="mt-3 text-[var(--btp-muted)]">
            Chaque mission fait l’objet d’une proposition personnalisée. Le
            périmètre, les livrables, la durée, les responsabilités, les
            assurances et les conditions financières sont définis
            contractuellement avant démarrage.
          </p>
          <h2 className="mt-8 text-xl font-bold">Responsabilités</h2>
          <p className="mt-3 text-[var(--btp-muted)]">
            Les modalités d’intervention ne constituent pas du travail
            temporaire ni une mise à disposition de personnel hors cadre
            juridique validé. Les pouvoirs de décision et l’autonomie du
            prestataire sont précisés dans le contrat.
          </p>
          <p className="mt-8 text-sm text-[var(--btp-muted)]">
            Voir aussi la{" "}
            <Link href="/politique-confidentialite" className="underline">
              politique de confidentialité
            </Link>{" "}
            et les{" "}
            <Link href="/mentions-legales" className="underline">
              mentions légales
            </Link>
            .
          </p>
        </div>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
