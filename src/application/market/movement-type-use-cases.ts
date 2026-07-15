import type { IMovementTypeRepository } from '@/domain/market/repositories/movement-type-repository';

export class MovementTypeUseCases {
  constructor(private readonly movementTypeRepository: IMovementTypeRepository) {}

  async findAll() {
    return this.movementTypeRepository.findAll();
  }

  async findByCode(code: string) {
    return this.movementTypeRepository.findByCode(code);
  }
}
