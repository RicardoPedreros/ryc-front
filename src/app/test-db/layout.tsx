import { requireSession } from '@/shared/auth';

export default async function TestDbLayout({ children }: { readonly children: React.ReactNode }) {
  await requireSession();

  return <>{children}</>;
}
