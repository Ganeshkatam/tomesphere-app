/**
 * In-memory cache for API responses
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class Cache {
    private store = new Map<string, CacheEntry<any>>();

    set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
        this.store.set(key, { data, timestamp: Date.now(), ttl });
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.store.delete(key);
            return null;
        }

        return entry.data as T;
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }
}

export const cache = new Cache();

export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 5 * 60 * 1000
): Promise<T> {
    const cached = cache.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    cache.set(key, data, ttl);
    return data;
}
