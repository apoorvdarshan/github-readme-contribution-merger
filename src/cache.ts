interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_SIZE = 100;

const store = new Map<string, CacheEntry<unknown>>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiry <= now) {
      store.delete(key);
    }
  }
}

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiry <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  if (store.size >= MAX_SIZE) {
    evictExpired();
  }
  store.set(key, { data, expiry: Date.now() + ttl });
}
