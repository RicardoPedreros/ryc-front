import type { Unit, CreateUnit } from '../entities/unit';

export interface IUnitRepository {
  findAll(): Promise<readonly Unit[]>;
  findById(id: string): Promise<Unit | null>;
  create(unit: CreateUnit): Promise<Unit>;
}
