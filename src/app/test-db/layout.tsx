import { requireSession } from '@/infrastructure/auth/session';

export default async function TestDbLayout({ children }: { readonly children: React.ReactNode }) {
  await requireSession();

  return <>{children}</>;
}
