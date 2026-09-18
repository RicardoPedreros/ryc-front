import { NextResponse } from 'next/server';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors';

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function badRequest(message: string): never {
  throw new HttpError(400, message);
}

export function notFound(message: string): never {
  throw new HttpError(404, message);
}

export function forbidden(message: string): never {
  throw new HttpError(403, message);
}

export function unauthorized(message: string): never {
  throw new HttpError(401, message);
}

export interface ApiRouteConfig {
  readonly conflictMessage?: (error: unknown) => string | null;
}

export async function apiRoute(
  run: () => Promise<NextResponse | object | null>,
  config: ApiRouteConfig = {},
): Promise<NextResponse> {
  try {
    const result = await run();
    return result instanceof NextResponse ? result : NextResponse.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (config.conflictMessage) {
      const message = config.conflictMessage(error);
      if (message) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}