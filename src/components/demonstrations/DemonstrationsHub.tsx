"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DEMO_INTERACTIVE_SLUGS, DEMO_PROJECTS } from "@/lib/bework-formation";
import styles from "./DemonstrationsHub.module.css";

const INTERACTIVE = new Set<string>(DEMO_INTERACTIVE_SLUGS);

const NOTES = [
  { text: "Des outils concrets pour vos idées", pos: "tl" as const },
  { text: "Testez. Explorez. Projetez-vous.", pos: "tr" as const },
  { text: "Des démonstrations interactives pour vous projeter", pos: "bl" as const },
  { text: "Même technologie. Vos futurs projets.", pos: "br" as const },
] as const;

function PreviewMessagerie() {
  return (
    <div className={`${styles.preview} ${styles.previewChat}`} aria-hidden>
      <div className={styles.chatRow}>
        <span className={`${styles.avatar} ${styles.avatarViolet}`}>JM</span>
        <div>
          <p className={styles.chatName}>Julie Martin</p>
          <p className={styles.bubbleIn}>Le devis est prêt pour demain ?</p>
        </div>
      </div>
      <div className={`${styles.chatRow} ${styles.chatRowRight}`}>
        <div>
          <p className={`${styles.chatName} ${styles.chatNameRight}`}>Thomas Dubois</p>
          <p className={styles.bubbleOut}>Oui, je l’envoie ce soir.</p>
        </div>
        <span className={`${styles.avatar} ${styles.avatarBlue}`}>TD</span>
      </div>
      <div className={styles.chatCompose}>
        <span>Écrire un message…</span>
        <span className={styles.chatSend}>↑</span>
      </div>
    </div>
  );
}

function PreviewAgenda() {
  return (
    <div className={`${styles.preview} ${styles.previewAgenda}`} aria-hidden>
      <div className={styles.agendaHead}>
        <span>Aujourd’hui</span>
        <span className={styles.agendaFab}>+</span>
      </div>
      <ul className={styles.agendaList}>
        <li>
          <span>09:00</span>
          <em>Réunion d’équipe</em>
        </li>
        <li>
          <span>10:30</span>
          <em>Appel client</em>
        </li>
        <li>
          <span>11:30</span>
          <em>Point chantier</em>
        </li>
      </ul>
    </div>
  );
}

function PreviewReservation() {
  return (
    <div className={`${styles.preview} ${styles.previewBooking}`} aria-hidden>
      <div className={styles.days}>
        {[14, 15, 16, 17, 18].map((d) => (
          <span key={d} className={d === 16 ? styles.dayActive : styles.day}>
            {d}
          </span>
        ))}
      </div>
      <div className={styles.bookBtn}>Réserver</div>
    </div>
  );
}

function PreviewCrm() {
  return (
    <div className={`${styles.preview} ${styles.previewCrm}`} aria-hidden>
      <div className={styles.crmTabs}>
        <span className={styles.crmTabOn}>Prospects</span>
        <span>Opportunités</span>
        <span>Clients</span>
      </div>
      <ul className={styles.crmList}>
        <li>
          <strong>Entreprise Dupont</strong>
          <em className={styles.tagNew}>Nouveau</em>
        </li>
        <li>
          <strong>Atelier Martin</strong>
          <em className={styles.tagProgress}>En cours</em>
        </li>
        <li>
          <strong>Villa Horizon</strong>
          <em className={styles.tagTalk}>En discussion</em>
        </li>
      </ul>
    </div>
  );
}

function PreviewDashboard() {
  return (
    <div className={`${styles.preview} ${styles.previewDash}`} aria-hidden>
      <div className={styles.metrics}>
        <div>
          <strong>24 560 €</strong>
          <span className={styles.up}>+12%</span>
        </div>
        <div>
          <strong>124</strong>
          <span className={styles.up}>+8%</span>
        </div>
        <div>
          <strong>18</strong>
          <span className={styles.up}>+3</span>
        </div>
      </div>
      <svg className={styles.chart} viewBox="0 0 160 48" fill="none">
        <path
          className={styles.chartLine}
          d="M4 36 C28 34 36 28 52 22 C68 16 78 20 96 14 C114 8 128 10 156 6"
          stroke="#275be8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M4 36 C28 34 36 28 52 22 C68 16 78 20 96 14 C114 8 128 10 156 6 V48 H4 Z"
          fill="url(#dashFill)"
          opacity="0.2"
        />
        <defs>
          <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#275be8" />
            <stop offset="100%" stopColor="#275be8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function PreviewEspace() {
  return (
    <div className={`${styles.preview} ${styles.previewEspace}`} aria-hidden>
      <div className={styles.espaceSide}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.espaceMain}>
        <div className={styles.espaceCard}>
          <b>Documents</b>
          <small>12 fichiers</small>
        </div>
        <div className={styles.espaceCard}>
          <b>Demandes</b>
          <small>3 en cours</small>
        </div>
      </div>
    </div>
  );
}

function PreviewDocuments() {
  return (
    <div className={`${styles.preview} ${styles.previewDocs}`} aria-hidden>
      <div className={styles.docRow}>
        <span className={styles.docPdf}>PDF</span>
        <div>
          <strong>Contrat_2026.pdf</strong>
          <small>128 Ko</small>
        </div>
      </div>
      <div className={styles.docRow}>
        <span className={styles.docPpt}>PPT</span>
        <div>
          <strong>Presentation.pptx</strong>
          <small>2.1 Mo</small>
        </div>
      </div>
      <div className={styles.docRow}>
        <span className={styles.docDoc}>DOC</span>
        <div>
          <strong>Guide_utilisateur.docx</strong>
          <small>84 Ko</small>
        </div>
      </div>
    </div>
  );
}

function PreviewSite() {
  return (
    <div className={`${styles.preview} ${styles.previewSite}`} aria-hidden>
      <div className={styles.siteNav}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.siteHero}>
        <div className={styles.siteCopy}>
          <b>Votre activité</b>
          <i />
          <i />
        </div>
        <div className={styles.sitePhoto} />
      </div>
    </div>
  );
}

const PREVIEWS: Record<string, ReactNode> = {
  messagerie: <PreviewMessagerie />,
  agenda: <PreviewAgenda />,
  reservation: <PreviewReservation />,
  crm: <PreviewCrm />,
  dashboard: <PreviewDashboard />,
  "espace-client": <PreviewEspace />,
  documents: <PreviewDocuments />,
  site: <PreviewSite />,
};

const NOTE_POS = {
  tl: styles.note_tl,
  tr: styles.note_tr,
  bl: styles.note_bl,
  br: styles.note_br,
} as const;

/** Hub /demonstrations — grille premium avec aperçus UI + animations. */
export function DemonstrationsHub() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);
    const el = rootRef.current;
    if (!el) return;

    if (prefersReduced) {
      setReady(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const rootClass = [
    styles.section,
    ready ? styles.ready : "",
    reduced ? styles.reduced : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={rootRef} className={rootClass} aria-labelledby="demos-title">
      <div className={styles.shell}>
        <header className={`${styles.head} ${styles.reveal}`} style={{ ["--d" as string]: "0ms" }}>
          <p className={styles.eyebrow}>Démonstrations</p>
          <h1 id="demos-title" className={styles.title}>
            Ce n&apos;est pas une image.
            <br />
            <span className={styles.titleAccent}>Essayez.</span>
          </h1>
          <p className={styles.lead}>
            Essayez messagerie, agenda, CRM, réservation, dashboard… Démos BeWork
            interactives, données fictives. Voyez ce qu’il est possible de créer.
          </p>
        </header>

        <div className={styles.stage}>
          {NOTES.map((note) => (
            <p
              key={note.pos}
              className={`${styles.note} ${NOTE_POS[note.pos]} ${styles.reveal}`}
              style={{ ["--d" as string]: "520ms" }}
              aria-hidden
            >
              {note.text}
            </p>
          ))}

          <ul className={styles.grid}>
            {DEMO_PROJECTS.map((demo, i) => (
              <li
                key={demo.slug}
                className={`${styles.cardWrap} ${styles.reveal}`}
                style={{ ["--d" as string]: `${120 + i * 55}ms` }}
              >
                <Link
                  href={`/demonstrations/${demo.slug}`}
                  className={styles.card}
                  style={{ ["--accent" as string]: demo.accent }}
                >
                  <span className={styles.accentBar} aria-hidden />
                  <span className={styles.menuDots} aria-hidden>
                    ···
                  </span>
                  <h2 className={styles.cardTitle}>{demo.title}</h2>
                  <p className={styles.cardDesc}>{demo.description}</p>
                  {PREVIEWS[demo.slug]}
                  <span className={styles.cardCta}>
                    {INTERACTIVE.has(demo.slug) ? "Explorer →" : "Voir l’aperçu →"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`${styles.actions} ${styles.reveal}`}
          style={{ ["--d" as string]: "640ms" }}
        >
          <Link href="/formation" className={styles.ctaPrimary}>
            Découvrir la formation →
          </Link>
          <Link href="/contact#participer" className={styles.ctaSecondary}>
            Participer
          </Link>
        </div>
      </div>
    </section>
  );
}
