import type { Unit, CreateUnit } from '../entities/unit';

export interface IUnitRepository {
  findAll(): Promise<readonly Unit[]>;
  findById(id: string): Promise<Unit | null>;
  findManyWithVisibility(userId: string | null, roleCode: string | null): Promise<readonly Unit[]>;
  create(unit: CreateUnit): Promise<Unit>;
}
