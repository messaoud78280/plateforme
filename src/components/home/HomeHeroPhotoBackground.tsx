import Image from "next/image";

/**
 * Fond photo chantier / plans — visible dans le premier viewport, adouci pour le texte.
 */
export function HomeHeroPhotoBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(100svh,880px)] overflow-hidden md:h-[min(100svh,960px)]"
      aria-hidden
    >
      <Image
        src="/images/home/hero-chantier-plans.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_30%] saturate-[0.78] brightness-[1.03]"
        quality={85}
      />
      {/* Atténuation légère — casques / plans encore bien lisibles */}
      <div className="absolute inset-0 bg-white/20" />
      {/* Texte à gauche plus lisible, photo plus nette à droite */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/20 to-transparent lg:from-white/68 lg:via-white/10" />
      {/* Fondu vers le contenu suivant */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/80 to-transparent md:h-52" />
    </div>
  );
}
