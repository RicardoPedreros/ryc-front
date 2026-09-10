import { NextRequest, NextResponse } from 'next/server';
import { BrandUseCases } from '@/application/market/brand-use-cases';
import { NeonBrandRepository } from '@/infrastructure/market/repositories/neon-brand-repository';
import { getSessionFromRequest, canModifyRecord } from '@/shared/auth';

const brandUseCases = new BrandUseCases(new NeonBrandRepository());

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const hierarchy = searchParams.get('hierarchy');

    if (hierarchy === 'true') {
      const tree = await brandUseCases.findHierarchyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
      return NextResponse.json(tree);
    }

    const brands = await brandUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
    return NextResponse.json(brands);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const brand = await brandUseCases.create({ ...body, createdBy: session?.id ?? null });
    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'A brand with that name already exists' }, { status: 409 });
    }
    const status = message.includes('required') || message.includes('not found') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brand id is required' }, { status: 400 });
    }

    const existing = await brandUseCases.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      return NextResponse.json({ error: 'You can only edit records you created' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await brandUseCases.update(id, body);
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
      return NextResponse.json({ error: 'Brand id is required' }, { status: 400 });
    }

    const existing = await brandUseCases.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (!canModifyRecord(existing.createdBy, session?.id ?? null, session?.roleCode ?? null)) {
      return NextResponse.json({ error: 'You can only delete records you created' }, { status: 403 });
    }

    const deleted = await brandUseCases.remove(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
