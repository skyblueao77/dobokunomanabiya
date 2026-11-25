import { describe, expect, it, vi } from 'vitest';
import {
  attemptChunkRecoveryReload,
  isChunkLoadError,
  refreshAppAndClearCaches,
} from './pwaUpdater';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('pwaUpdater', () => {
  it('detects dynamic import and chunk loading errors', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module: /assets/x.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError({ name: 'ChunkLoadError', message: 'Loading chunk 12 failed' })).toBe(true);
    expect(isChunkLoadError(new Error('Regular runtime error'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });

  it('prevents infinite reload loops within the 30s cooldown window', () => {
    const storage = createMemoryStorage();
    const reload = vi.fn();

    expect(attemptChunkRecoveryReload(storage, 100_000, reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);

    // 10秒後はクールダウン中なので再リロードしない
    expect(attemptChunkRecoveryReload(storage, 110_000, reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);

    // 31秒後は再試行できる
    expect(attemptChunkRecoveryReload(storage, 131_000, reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('does not delete caches or reload when offline', async () => {
    const reload = vi.fn();
    const result = await refreshAppAndClearCaches({ isOnline: false, reload });
    expect(result).toEqual({ status: 'offline' });
    expect(reload).not.toHaveBeenCalled();
  });

  it('clears Cache Storage and reloads when online', async () => {
    const reload = vi.fn();
    const deleted: string[] = [];
    const originalCaches = globalThis.caches;
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: {
        keys: vi.fn(async () => ['workbox-precache-v2', 'html-pages-cache']),
        delete: vi.fn(async (key: string) => {
          deleted.push(key);
          return true;
        }),
      },
    });

    try {
      const result = await refreshAppAndClearCaches({ isOnline: true, reload });
      expect(result).toEqual({ status: 'reloading' });
      expect(deleted).toEqual(['workbox-precache-v2', 'html-pages-cache']);
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      if (originalCaches === undefined) {
        delete (globalThis as { caches?: CacheStorage }).caches;
      } else {
        Object.defineProperty(globalThis, 'caches', {
          configurable: true,
          value: originalCaches,
        });
      }
    }
  });
});
