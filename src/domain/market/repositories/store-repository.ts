import type { Store, CreateStore, UpdateStore } from '../entities/store';

export interface IStoreRepository {
  findAll(): Promise<readonly Store[]>;
  findById(id: string): Promise<Store | null>;
  create(store: CreateStore): Promise<Store>;
  update(id: string, store: UpdateStore): Promise<Store | null>;
  remove(id: string): Promise<boolean>;
}
