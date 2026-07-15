import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'ryc-session';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value) as {
      id: string;
      username: string;
      roleId: string;
      roleCode: string;
      firstName: string | null;
      lastName: string | null;
    };

    return NextResponse.json({
      id: session.id,
      username: session.username,
      roleCode: session.roleCode,
      firstName: session.firstName,
      lastName: session.lastName,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
