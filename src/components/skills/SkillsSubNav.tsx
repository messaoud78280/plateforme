"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BEWORK_SKILLS } from "@/content/bework-skills";

const base =
  "inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm";

export function SkillsSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm"
      aria-label="Navigation CCTP"
    >
      <Link
        href="/dashboard/skills"
        className={
          pathname === "/dashboard/skills"
            ? `${base} bg-[#1e3a5f] text-white shadow-sm`
            : `${base} bg-slate-50 text-slate-700 hover:bg-slate-100`
        }
      >
        Vue d&apos;ensemble
      </Link>
      {BEWORK_SKILLS.map((skill) => {
        const active = pathname === skill.href || pathname.startsWith(`${skill.href}/`);
        const disabled = skill.status === "coming_soon";
        if (disabled) {
          return (
            <span
              key={skill.slug}
              className={`${base} cursor-not-allowed bg-slate-50 text-slate-400`}
              title="Bientôt disponible"
            >
              {skill.title}
            </span>
          );
        }
        return (
          <Link
            key={skill.slug}
            href={skill.href}
            className={
              active
                ? `${base} bg-[#1e3a5f] text-white shadow-sm`
                : `${base} bg-slate-50 text-slate-700 hover:bg-slate-100`
            }
          >
            {skill.title}
          </Link>
        );
      })}
    </nav>
  );
}
