import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { getSql } from '@/infrastructure/market/neon-client';

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

let cachedAdminIds: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

export async function getAdminIds(): Promise<readonly string[]> {
  const now = Date.now();
  if (cachedAdminIds && now - cacheTimestamp < CACHE_TTL) return cachedAdminIds;

  const sql = getSql();
  const rows = await sql`
    SELECT u.id
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE LOWER(r.code) = 'admin'
  ` as { id: string }[];

  cachedAdminIds = rows.map((r) => r.id);
  cacheTimestamp = now;
  return cachedAdminIds;
}

export function canModifyRecord(
  recordCreatorId: string | null,
  userId: string | null,
  roleCode: string | null,
): boolean {
  if (roleCode === 'admin') return true;
  if (!recordCreatorId) return false;
  return recordCreatorId === userId;
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
