import type { CreateUnit } from '@/domain/market/entities/unit';
import type { IUnitRepository } from '@/domain/market/repositories/unit-repository';

export class UnitUseCases {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async findAll() {
    return this.unitRepository.findAll();
  }

  async findById(id: string) {
    return this.unitRepository.findById(id);
  }

  async create(unit: CreateUnit) {
    if (!unit.name.trim()) {
      throw new Error('Unit name is required');
    }
    if (!unit.symbol.trim()) {
      throw new Error('Unit symbol is required');
    }
    return this.unitRepository.create(unit);
  }
}
