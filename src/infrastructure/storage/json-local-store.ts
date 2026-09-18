export interface JsonLocalStore<T> {
  subscribe(onStoreChange: () => void): () => void;
  getSnapshot(): T;
  getServerSnapshot(): T;
  read(): T;
  write(value: T): void;
}

export function createJsonLocalStore<T>(options: {
  readonly key: string;
  readonly fallback: T;
  readonly parse: (raw: string) => T;
}): JsonLocalStore<T> {
  const { key, fallback, parse } = options;
  let snapshot = fallback;
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const subscribe = (onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    if (!hydrated && typeof window !== "undefined") {
      hydrated = true;
      try {
        const raw = localStorage.getItem(key);
        snapshot = raw ? parse(raw) : fallback;
      } catch {
        snapshot = fallback;
      }
    }
    return () => {
      listeners.delete(onStoreChange);
    };
  };

  const getSnapshot = () => snapshot;

  const getServerSnapshot = () => fallback;

  const read = () => snapshot;

  const write = (value: T) => {
    snapshot = value;
    emit();
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or private mode — ignore
    }
  };

  return { subscribe, getSnapshot, getServerSnapshot, read, write };
}