import { NextRequest, NextResponse } from 'next/server';
import { CategoryUseCases } from '@/application/market/category-use-cases';
import { NeonCategoryRepository } from '@/infrastructure/market/repositories/neon-category-repository';
import { getSessionFromRequest } from '@/infrastructure/auth/session';
import { canModifyRecord } from '@/application/auth/authorization-policies';
import { apiRoute, badRequest, forbidden, notFound } from '@/shared/route-helpers';

const categoryUseCases = new CategoryUseCases(new NeonCategoryRepository());

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    return categoryUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const category = await categoryUseCases.create({ ...body, createdBy: session?.id ?? null });
    return NextResponse.json(category, { status: 201 });
  });
}

export async function PUT(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Category id is required');

    const existing = await categoryUseCases.findById(id);
    if (!existing) notFound('Category not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only edit records you created');
    }

    const body = await request.json();
    return categoryUseCases.update(id, body);
  });
}

export async function DELETE(request: NextRequest) {
  return apiRoute(async () => {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) badRequest('Category id is required');

    const existing = await categoryUseCases.findById(id);
    if (!existing) notFound('Category not found');

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      forbidden('You can only delete records you created');
    }

    const deleted = await categoryUseCases.remove(id);
    return { success: deleted };
  });
}