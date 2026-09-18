import { NextRequest, NextResponse } from 'next/server';
import { BrandUseCases } from '@/application/market/brand-use-cases';
import { NeonBrandRepository } from '@/infrastructure/market/repositories/neon-brand-repository';
import { getSessionFromRequest } from '@/infrastructure/auth/session';
import { canModifyRecord } from '@/application/auth/authorization-policies';
import { apiRoute, badRequest, forbidden, notFound } from '@/shared/route-helpers';

const brandUseCases = new BrandUseCases(new NeonBrandRepository());

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505';
}

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const hierarchy = searchParams.get('hierarchy');

    if (hierarchy === 'true') {
      return brandUseCases.findHierarchyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
    }

    return brandUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(
    async () => {
      const session = getSessionFromRequest(request);
      const body = await request.json();
      const brand = await brandUseCases.create({ ...body, createdBy: session?.id ?? null });
      return NextResponse.json(brand, { status: 201 });
    },
    {
      conflictMessage: (error) =>
        isUniqueViolation(error) ? 'A brand with that name already exists' : null,
    },
  );
}

export async function PUT(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Brand id is required');

    const existing = await brandUseCases.findById(id);
    if (!existing) notFound('Brand not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only edit records you created');
    }

    const body = await request.json();
    return brandUseCases.update(id, body);
  });
}

export async function DELETE(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Brand id is required');

    const existing = await brandUseCases.findById(id);
    if (!existing) notFound('Brand not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only delete records you created');
    }

    const deleted = await brandUseCases.remove(id);
    return { success: deleted };
  });
}