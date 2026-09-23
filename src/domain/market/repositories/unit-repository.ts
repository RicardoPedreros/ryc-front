import type { Unit, CreateUnit, UpdateUnit } from '../entities/unit';

export interface IUnitRepository {
  findAll(): Promise<readonly Unit[]>;
  findById(id: string): Promise<Unit | null>;
  findManyWithVisibility(userId: string | null, roleCode: string | null): Promise<readonly Unit[]>;
  create(unit: CreateUnit): Promise<Unit>;
  update(id: string, unit: UpdateUnit): Promise<Unit | null>;
}
