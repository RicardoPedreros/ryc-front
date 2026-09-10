import { NextRequest, NextResponse } from 'next/server';
import { CategoryUseCases } from '@/application/market/category-use-cases';
import { NeonCategoryRepository } from '@/infrastructure/market/repositories/neon-category-repository';
import { getSessionFromRequest, canModifyRecord } from '@/shared/auth';

const categoryUseCases = new CategoryUseCases(new NeonCategoryRepository());

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const categories = await categoryUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
    return NextResponse.json(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const category = await categoryUseCases.create({ ...body, createdBy: session?.id ?? null });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    const existing = await categoryUseCases.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      return NextResponse.json({ error: 'You can only edit records you created' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await categoryUseCases.update(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    const existing = await categoryUseCases.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      return NextResponse.json({ error: 'You can only delete records you created' }, { status: 403 });
    }

    const deleted = await categoryUseCases.remove(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
