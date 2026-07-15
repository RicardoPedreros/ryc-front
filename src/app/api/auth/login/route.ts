import { NextRequest, NextResponse } from 'next/server';
import { AuthenticateUserUseCase } from '@/application/auth/authenticate-user-use-case';
import { NeonUserRepository } from '@/infrastructure/auth/repositories/neon-user-repository';
import { NeonRoleRepository } from '@/infrastructure/auth/repositories/neon-role-repository';

const SESSION_COOKIE = 'ryc-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username: string;
      password: string;
    };

    const useCase = new AuthenticateUserUseCase(
      new NeonUserRepository(),
      new NeonRoleRepository(),
    );

    const user = await useCase.execute(username, password);

    const sessionData = JSON.stringify({
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      roleCode: user.roleCode,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const response = NextResponse.json({
      id: user.id,
      username: user.username,
      roleCode: user.roleCode,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    response.cookies.set(SESSION_COOKIE, sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Login failed';

    if (message === 'Invalid credentials' || message === 'Account is disabled') {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
