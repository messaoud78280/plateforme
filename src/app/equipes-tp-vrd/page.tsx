import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import {
  BTP_CTA_EQUIPE_TP_VRD,
  BTP_EQUIPE_TP_VRD_DOMAINES,
  BTP_EQUIPE_TP_VRD_MODALITES,
  BTP_EQUIPE_TP_VRD_PROFILES,
  BTP_SEO_PAGES,
} from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.equipesTpVrd;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function EquipesTpVrdPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="TRAVAUX PUBLICS • VRD • ÉQUIPES OPÉRATIONNELLES"
          title="Des équipes TP/VRD expérimentées pour vos travaux."
          subtitle="BeWork propose aux entreprises du BTP des prestations opérationnelles en travaux publics et VRD, réalisées par des chefs d’équipe et des maçons spécialisés. Nos interventions sont adaptées aux besoins des chantiers, qu’il s’agisse de travaux ponctuels, d’une phase d’exécution ou d’un besoin temporaire de capacité de production."
          primaryHref={BTP_CTA_EQUIPE_TP_VRD.href}
          primaryLabel={BTP_CTA_EQUIPE_TP_VRD.label}
          secondaryHref="/demande-de-devis?besoin=equipe_tp_vrd"
          secondaryLabel="Décrire mes travaux"
          note="Prestations sur devis • Aucun effectif ni disponibilité inventés"
          imageSrc="/marketing/bework-hero-equipes-tp-vrd.jpg"
          imageAlt="Équipe TP/VRD posant des bordures sur un chantier urbain — photo d’ambiance illustrative"
        />

        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="profiles-title">
          <div className="bw-btp-container">
            <h2 id="profiles-title" className="font-bold">
              Profils mobilisables selon les compétences disponibles.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
              Les compétences listées sont des exemples de missions possibles.
              La composition exacte dépend des profils réellement mobilisables
              au moment de votre demande.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {BTP_EQUIPE_TP_VRD_PROFILES.map((profile) => (
                <article
                  key={profile.title}
                  className="bw-btp-card bw-btp-card-media flex flex-col"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--btp-soft)]">
                    <Image
                      src={profile.imageSrc}
                      alt={profile.imageAlt}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="bw-btp-card-media-body flex flex-1 flex-col">
                    <h3 className="font-bold">{profile.title}</h3>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                      Compétences possibles
                    </p>
                    <ul className="mt-2 flex-1 space-y-1.5">
                      {profile.skills.map((skill) => (
                        <li key={skill} className="flex gap-2 text-base text-[var(--btp-muted)]">
                          <span className="text-[var(--btp-accent)]" aria-hidden>
                            •
                          </span>
                          {skill}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/demande-de-devis?besoin=${profile.besoin}`}
                      className="bw-btp-btn bw-btp-btn-secondary-dark mt-6 self-start"
                    >
                      Demander ce profil
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <article className="bw-btp-card mt-5">
              <h3 className="font-bold">Équipe opérationnelle</h3>
              <p className="mt-3 text-base leading-relaxed text-[var(--btp-muted)]">
                Possibilité de constituer une équipe autour d’un chef d’équipe
                et de compagnons VRD selon les besoins du chantier et les
                compétences réellement disponibles. Aucun effectif, planning ou
                disponibilité n’est garanti avant étude et proposition
                contractuelle.
              </p>
              <Link
                href={BTP_CTA_EQUIPE_TP_VRD.href}
                className="bw-btp-btn bw-btp-btn-secondary-dark mt-6 inline-flex"
              >
                Demander une équipe TP/VRD
              </Link>
            </article>
          </div>
        </section>

        <section className="bw-btp-section" aria-labelledby="domaines-title">
          <div className="bw-btp-container">
            <h2 id="domaines-title" className="font-bold">
              Domaines de travaux possibles.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
              Domaines d’intervention envisageables selon le périmètre et les
              moyens. BeWork n’annonce pas l’exécution de travaux nécessitant
              des qualifications ou moyens non disponibles.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BTP_EQUIPE_TP_VRD_DOMAINES.map((domaine) => (
                <article key={domaine} className="bw-btp-card">
                  <h3 className="text-lg font-bold">{domaine}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="modalites-title">
          <div className="bw-btp-container">
            <h2 id="modalites-title" className="font-bold">
              Modalités commerciales.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {BTP_EQUIPE_TP_VRD_MODALITES.map((item) => (
                <article key={item.title} className="bw-btp-card">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-3 text-base text-[var(--btp-muted)]">{item.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-base text-[var(--btp-muted)]">
              La facturation peut être établie au forfait, à l’unité de travaux
              ou sur la base d’un temps d’intervention convenu, selon la
              prestation et les conditions contractuelles.{" "}
              <strong className="text-[var(--btp-heading)]">
                Aucun tarif public : toutes les interventions sont sur devis.
              </strong>
            </p>
            <p className="mt-4 max-w-3xl text-sm text-[var(--btp-muted)]">
              Cadre juridique à valider avant engagement : assurances travaux,
              sous-traitance, recours à des indépendants, contrats de régie,
              distinction maîtrise d’œuvre / entreprise exécutante, et
              prévention du prêt illicite de main-d’œuvre. BeWork n’est pas une
              agence d’intérim.
            </p>
          </div>
        </section>

        <section className="bw-btp-section">
          <div className="bw-btp-container max-w-3xl">
            <h2 className="font-bold">Outils internes au service de la mission</h2>
            <p className="mt-4 text-base text-[var(--btp-muted)]">
              Selon les fonctionnalités existantes, nos outils collaboratifs
              peuvent aider à organiser les tâches, suivre les quantités,
              documenter les travaux, préparer les approvisionnements, produire
              les rapports et communiquer les observations — sous validation
              humaine.
            </p>
            <Link href="/plateforme-ia" className="bw-btp-btn bw-btp-btn-secondary mt-6">
              Voir notre méthode &amp; outils
            </Link>
          </div>
        </section>

        <BtpCtaBand
          title="Besoin d’une capacité de production TP/VRD ?"
          subtitle="Décrivez les ouvrages, la localisation et le mode d’intervention envisagé. Nous étudions le périmètre et vous proposons une mission sur devis."
          ctaHref={BTP_CTA_EQUIPE_TP_VRD.href}
          ctaLabel={BTP_CTA_EQUIPE_TP_VRD.label}
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
