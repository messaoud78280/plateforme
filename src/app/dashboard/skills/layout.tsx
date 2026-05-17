import { SkillsSubNav } from "@/components/skills/SkillsSubNav";
import { requireBeWorkSkillsSession } from "@/lib/be-work-skills-access";

export default async function SkillsModuleLayout({ children }: { children: React.ReactNode }) {
  await requireBeWorkSkillsSession();

  return (
    <div className="space-y-6">
      <SkillsSubNav />
      {children}
    </div>
  );
}
