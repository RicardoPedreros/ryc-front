import { NextRequest, NextResponse } from 'next/server';
import { UnitUseCases } from '@/application/market/unit-use-cases';
import { NeonUnitRepository } from '@/infrastructure/market/repositories/neon-unit-repository';
import { getSessionFromRequest } from '@/infrastructure/auth/session';
import { canModifyRecord } from '@/application/auth/authorization-policies';
import { apiRoute, badRequest, forbidden, notFound } from '@/shared/route-helpers';

const unitUseCases = new UnitUseCases(new NeonUnitRepository());

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    return unitUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const unit = await unitUseCases.create({ ...body, createdBy: session?.id ?? null });
    return NextResponse.json(unit, { status: 201 });
  });
}

export async function PUT(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Unit id is required');

    const existing = await unitUseCases.findById(id);
    if (!existing) notFound('Unit not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only edit records you created');
    }

    const body = await request.json();
    return unitUseCases.update(id, body);
  });
}