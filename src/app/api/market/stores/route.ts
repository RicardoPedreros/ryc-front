import { NextRequest, NextResponse } from 'next/server';
import { StoreUseCases } from '@/application/market/store-use-cases';
import { NeonStoreRepository } from '@/infrastructure/market/repositories/neon-store-repository';
import { getSessionFromRequest } from '@/infrastructure/auth/session';
import { canModifyRecord } from '@/application/auth/authorization-policies';
import { apiRoute, badRequest, forbidden, notFound } from '@/shared/route-helpers';

const storeUseCases = new StoreUseCases(new NeonStoreRepository());

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    return storeUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const store = await storeUseCases.create({ ...body, createdBy: session?.id ?? null });
    return NextResponse.json(store, { status: 201 });
  });
}

export async function PUT(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Store id is required');

    const existing = await storeUseCases.findById(id);
    if (!existing) notFound('Store not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only edit records you created');
    }

    const body = await request.json();
    return storeUseCases.update(id, body);
  });
}

export async function DELETE(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Store id is required');

    const existing = await storeUseCases.findById(id);
    if (!existing) notFound('Store not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only delete records you created');
    }

    const deleted = await storeUseCases.remove(id);
    return { success: deleted };
  });
}