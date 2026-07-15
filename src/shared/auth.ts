import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE = 'ryc-session';

export interface SessionUser {
  id: string;
  username: string;
  roleId: string;
  roleCode: string;
  firstName: string | null;
  lastName: string | null;
}

export async function requireSession(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    redirect('/login');
  }

  try {
    const session = JSON.parse(sessionCookie.value) as SessionUser;
    if (!session.id || !session.username) {
      redirect('/login');
    }
    return session;
  } catch {
    redirect('/login');
  }
}
