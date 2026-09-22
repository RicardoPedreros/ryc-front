import { requireSession } from '@/infrastructure/auth/session';
import { SectionNavbar } from '@/presentation/components/sections/SectionNavbar';
import type { SectionNavGroup } from '@/presentation/components/sections/section-nav';

export interface SectionShellProps {
  readonly title: string;
  readonly sections: readonly SectionNavGroup[];
  readonly children: React.ReactNode;
}

export default async function SectionShell({ title, sections, children }: SectionShellProps) {
  await requireSession();

  return (
    <>
      <SectionNavbar title={title} sections={sections} />
      <main className="mkt-page">{children}</main>
    </>
  );
}