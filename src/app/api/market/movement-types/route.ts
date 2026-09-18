import { MovementTypeUseCases } from '@/application/market/movement-type-use-cases';
import { NeonMovementTypeRepository } from '@/infrastructure/market/repositories/neon-movement-type-repository';
import { apiRoute } from '@/shared/route-helpers';

const movementTypeUseCases = new MovementTypeUseCases(new NeonMovementTypeRepository());

export async function GET() {
  return apiRoute(async () => movementTypeUseCases.findAll());
}