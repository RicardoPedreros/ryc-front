import type { CreateStore, UpdateStore } from '@/domain/market/entities/store';
import type { IStoreRepository } from '@/domain/market/repositories/store-repository';

export class StoreUseCases {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async findAll() {
    return this.storeRepository.findAll();
  }

  async findById(id: string) {
    return this.storeRepository.findById(id);
  }

  async create(store: CreateStore) {
    if (!store.name.trim()) {
      throw new Error('Store name is required');
    }
    return this.storeRepository.create(store);
  }

  async update(id: string, store: UpdateStore) {
    const existing = await this.storeRepository.findById(id);
    if (!existing) {
      return null;
    }
    return this.storeRepository.update(id, store);
  }

  async remove(id: string) {
    return this.storeRepository.remove(id);
  }
}
