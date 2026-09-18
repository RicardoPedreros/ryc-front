import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'ryc-session';

export interface SessionUser {
  id: string;
  username: string;
  roleId: string;
  roleCode: string;
  firstName: string | null;
  lastName: string | null;
}

export function getSessionFromRequest(request: NextRequest): SessionUser | null {
  try {
    const raw = request.cookies.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionUser;
    if (!session.id) return null;
    return {
      ...session,
      roleCode: session.roleCode.toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function getUserIdFromSession(request: NextRequest): string | null {
  return getSessionFromRequest(request)?.id ?? null;
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
    return {
      ...session,
      roleCode: session.roleCode.toLowerCase(),
    };
  } catch {
    redirect('/login');
  }
}