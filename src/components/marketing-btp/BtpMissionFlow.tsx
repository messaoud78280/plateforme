import Link from "next/link";
import { BTP_COMMERCIAL_MISSION_STEPS } from "@/lib/bework-btp-services";

export function BtpMissionFlow() {
  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="mission-flow-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Parcours client</p>
        <h2 id="mission-flow-title" className="mt-2 font-bold">
          Comment se déroule une mission ?
        </h2>
        <p className="bw-btp-lead mt-4 max-w-3xl">
          Un cadre clair pour le dirigeant : besoin, étude, proposition,
          pilotage, visibilité.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {BTP_COMMERCIAL_MISSION_STEPS.map((step) => (
            <article key={step.n} className="bw-btp-card h-full">
              <p className="text-base font-bold text-[var(--btp-copper)]">{step.n}</p>
              <h3 className="mt-2 text-lg font-bold leading-snug">{step.title}</h3>
              <p className="mt-2 text-base text-[var(--btp-muted)]">{step.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/demande-de-devis" className="bw-btp-btn bw-btp-btn-primary">
            Étudions votre besoin
          </Link>
        </div>
      </div>
    </section>
  );
}
