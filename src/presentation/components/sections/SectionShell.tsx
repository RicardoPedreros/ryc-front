import { requireSession } from '@/infrastructure/auth/session';
import { SectionNavbar } from '@/presentation/components/sections/SectionNavbar';
import { SectionTabs, type SectionTab } from '@/presentation/components/sections/SectionTabs';

export interface SectionShellProps {
  readonly title: string;
  readonly tabs?: readonly SectionTab[];
  readonly children: React.ReactNode;
}

export default async function SectionShell({ title, tabs = [], children }: SectionShellProps) {
  await requireSession();

  return (
    <>
      <SectionNavbar title={title} />
      {tabs.length > 0 && <SectionTabs tabs={tabs} />}
      <main className="mkt-page">{children}</main>
    </>
  );
}