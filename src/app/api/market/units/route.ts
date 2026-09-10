import { NextRequest, NextResponse } from 'next/server';
import { UnitUseCases } from '@/application/market/unit-use-cases';
import { NeonUnitRepository } from '@/infrastructure/market/repositories/neon-unit-repository';
import { getSessionFromRequest } from '@/shared/auth';

const unitUseCases = new UnitUseCases(new NeonUnitRepository());

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const units = await unitUseCases.findManyWithVisibility(session?.id ?? null, session?.roleCode ?? null);
    return NextResponse.json(units);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const unit = await unitUseCases.create({ ...body, createdBy: session?.id ?? null });
    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
