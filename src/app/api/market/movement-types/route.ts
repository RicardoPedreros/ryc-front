import { NextResponse } from 'next/server';
import { MovementTypeUseCases } from '@/application/market/movement-type-use-cases';
import { NeonMovementTypeRepository } from '@/infrastructure/market/repositories/neon-movement-type-repository';

const movementTypeUseCases = new MovementTypeUseCases(new NeonMovementTypeRepository());

export async function GET() {
  try {
    const movementTypes = await movementTypeUseCases.findAll();
    return NextResponse.json(movementTypes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
