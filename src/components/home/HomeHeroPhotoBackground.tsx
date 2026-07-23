import Image from "next/image";

const HERO_PHOTO = {
  src: "/images/home/hero-chantier-plans.jpg",
  width: 1024,
  height: 576,
  alt: "",
} as const;

/**
 * Fond photo chantier / plans — atténué pour laisser le texte au premier plan.
 * Full-bleed, décoratif uniquement (aria-hidden).
 */
export function HomeHeroPhotoBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <Image
        src={HERO_PHOTO.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_32%] scale-[1.04] brightness-[1.05] contrast-[0.94] saturate-[0.5]"
        quality={78}
      />
      {/* Voile blanc global — couleurs atténuées, photo encore lisible */}
      <div className="absolute inset-0 bg-white/42" />
      {/* Fondu vertical : lisibilité haut de page → sortie douce vers le bas */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/35 to-[#f8fafc]/88" />
      {/* Colonne texte (gauche) plus claire que la zone visuelle (droite) */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/78 via-white/30 to-transparent lg:from-white/72 lg:via-white/22" />
      {/* Teinte BeWork légère */}
      <div className="absolute inset-0 bg-[#dbeafe]/20" />
    </div>
  );
}
