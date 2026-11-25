const CHUNK_RELOAD_KEY = 'dobokunomanabiya-chunk-reload-ts';
const CHUNK_RELOAD_COOLDOWN_MS = 30_000;
const UPDATE_CHECK_MIN_INTERVAL_MS = 60_000;

const CHUNK_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'importing a module script failed',
  'error loading dynamically imported module',
  'chunkloaderror',
  'loading chunk',
  'loading css chunk',
];

/**
 * 動的インポート（チャンク）の読み込み失敗エラーかどうかを判定する。
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  let text = '';
  if (typeof error === 'string') {
    text = error;
  } else if (typeof error === 'object') {
    const errObj = error as { name?: unknown; message?: unknown };
    const name = typeof errObj.name === 'string' ? errObj.name : '';
    const message = typeof errObj.message === 'string' ? errObj.message : '';
    text = `${name} ${message}`;
  }
  const normalized = text.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * チャンク読み込み失敗時に無限リロードを防ぎつつ 1 回だけページを再読み込みする。
 */
export function attemptChunkRecoveryReload(
  storage?: Storage,
  now = Date.now(),
  reload?: () => void
): boolean {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.sessionStorage : undefined);
  const doReload =
    reload ?? (typeof window !== 'undefined' ? () => window.location.reload() : undefined);

  if (!doReload) return false;

  if (targetStorage) {
    try {
      const prevRaw = targetStorage.getItem(CHUNK_RELOAD_KEY);
      if (prevRaw) {
        const prevTs = Number(prevRaw);
        if (Number.isFinite(prevTs) && now - prevTs < CHUNK_RELOAD_COOLDOWN_MS) {
          return false;
        }
      }
      targetStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    } catch {
      // sessionStorage が使えない場合はリロード試行のみ行う
    }
  }

  doReload();
  return true;
}

/**
 * Vite のプリロードエラーおよび動的インポート拒否を監視し自動復旧を試みる。
 */
export function initChunkErrorRecovery(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onPreloadError = (event: Event) => {
    event.preventDefault();
    attemptChunkRecoveryReload();
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isChunkLoadError(event.reason)) {
      attemptChunkRecoveryReload();
    }
  };

  window.addEventListener('vite:preloadError', onPreloadError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('vite:preloadError', onPreloadError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}

/**
 * Service Worker の新バージョン切り替えを監視し、更新時にコールバックを呼ぶ。
 */
export function initPwaUpdateWatcher(onUpdateAvailable: () => void): () => void {
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return () => {};
  }

  const swContainer = navigator.serviceWorker;
  const hadController = Boolean(swContainer.controller);
  let notified = false;
  let lastCheckAt = 0;

  const notifyOnce = () => {
    if (notified) return;
    notified = true;
    onUpdateAvailable();
  };

  const onControllerChange = () => {
    if (hadController) {
      notifyOnce();
    }
  };

  const checkForUpdate = (force = false) => {
    const now = Date.now();
    if (!force && now - lastCheckAt < UPDATE_CHECK_MIN_INTERVAL_MS) {
      return;
    }
    lastCheckAt = now;
    void swContainer
      .getRegistration()
      .then((registration) => {
        if (!registration) return;
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        return registration.update().catch(() => {});
      })
      .catch(() => {});
  };

  const onVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      checkForUpdate(false);
    }
  };

  const onOnline = () => {
    checkForUpdate(true);
  };

  swContainer.addEventListener('controllerchange', onControllerChange);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
  window.addEventListener('online', onOnline);

  checkForUpdate(true);

  return () => {
    swContainer.removeEventListener('controllerchange', onControllerChange);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    window.removeEventListener('online', onOnline);
  };
}

/**
 * オンライン時に SW キャッシュ（Cache Storage）をクリアして最新ページを再読み込みする。
 * localStorage（学習進捗・テーマ設定）には一切触れない。
 */
export async function refreshAppAndClearCaches(options?: {
  isOnline?: boolean;
  reload?: () => void;
}): Promise<{ status: 'reloading' | 'offline' }> {
  const isOnline =
    options?.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine !== false : true);
  if (!isOnline) {
    return { status: 'offline' };
  }

  if (typeof caches !== 'undefined' && typeof caches.keys === 'function') {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {
      // Cache Storage の削除失敗は無視して続行
    }
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        await registration.update().catch(() => {});
      }
    } catch {
      // SW 更新失敗は無視してリロードへ進む
    }
  }

  const doReload =
    options?.reload ?? (typeof window !== 'undefined' ? () => window.location.reload() : undefined);
  doReload?.();
  return { status: 'reloading' };
}
