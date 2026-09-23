import type { CreateUnit, UpdateUnit } from '@/domain/market/entities/unit';
import type { IUnitRepository } from '@/domain/market/repositories/unit-repository';
import { ValidationError } from '@/shared/errors';

export class UnitUseCases {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async findAll() {
    return this.unitRepository.findAll();
  }

  async findManyWithVisibility(userId: string | null, roleCode: string | null) {
    return this.unitRepository.findManyWithVisibility(userId, roleCode);
  }

  async findById(id: string) {
    return this.unitRepository.findById(id);
  }

  async create(unit: CreateUnit) {
    if (!unit.name.trim()) {
      throw new ValidationError('Unit name is required');
    }
    if (!unit.symbol.trim()) {
      throw new ValidationError('Unit symbol is required');
    }
    return this.unitRepository.create(unit);
  }

  async update(id: string, unit: UpdateUnit) {
    const existing = await this.unitRepository.findById(id);
    if (!existing) {
      return null;
    }
    return this.unitRepository.update(id, unit);
  }
}
