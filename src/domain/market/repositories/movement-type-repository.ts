import type { MovementType } from '../entities/movement-type';

export interface IMovementTypeRepository {
  findAll(): Promise<readonly MovementType[]>;
  findByCode(code: string): Promise<MovementType | null>;
}
