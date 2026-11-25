import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateAvailableBannerProps {
  onReload: () => void;
  onDismiss: () => void;
}

export const UpdateAvailableBanner: React.FC<UpdateAvailableBannerProps> = ({
  onReload,
  onDismiss,
}) => {
  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="新しいバージョンのお知らせ"
      className="app-surface rounded-xl px-4 py-3 mb-4 border-l-4 border-l-blue-700 dark:border-l-blue-400 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <RefreshCw
            className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400"
            aria-hidden="true"
          />
          <p className="text-xs sm:text-sm font-medium">
            新しいバージョンが公開されました。再読み込みすると最新の内容が反映されます。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReload}
            className="interactive-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            今すぐ更新
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="更新通知を閉じる"
            className="interactive-btn app-surface inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            あとで
          </button>
        </div>
      </div>
    </aside>
  );
};
