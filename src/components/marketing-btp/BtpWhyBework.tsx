import Link from "next/link";
import { BTP_WHY_BEWORK } from "@/lib/bework-btp-services";

export function BtpWhyBework() {
  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="why-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Réassurance</p>
        <h2 id="why-title" className="mt-2 font-bold">
          Pourquoi confier une mission à BeWork ?
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BTP_WHY_BEWORK.map((item, i) => (
            <li key={item} className="bw-btp-card flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--btp-ink)] text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="font-semibold text-[var(--btp-heading)]">{item}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-base text-[var(--btp-muted)]">
          Identité juridique : voir les{" "}
          <Link href="/mentions-legales" className="font-semibold underline-offset-2 hover:underline">
            mentions légales
          </Link>
          . Aucune référence client, logo partenaire ou certification n’est
          inventée sur ce site.
        </p>
      </div>
    </section>
  );
}
