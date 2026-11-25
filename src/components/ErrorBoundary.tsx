import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { attemptChunkRecoveryReload, isChunkLoadError } from '../utils/pwaUpdater';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isChunkError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '', isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || '予期しない表示エラーが発生しました。',
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error): void {
    if (isChunkLoadError(error)) {
      attemptChunkRecoveryReload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="app-surface rounded-xl p-6 max-w-xl mx-auto my-8 space-y-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-base font-bold">
                {this.state.isChunkError
                  ? 'サイトが新しいバージョンに更新されました'
                  : '学習モジュールの表示に失敗しました'}
              </h2>
              <p className="text-sm app-text-muted">
                {this.state.isChunkError
                  ? '古いバージョンの画面が開いていたため、ページの再読み込みが必要です。'
                  : this.state.message}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {this.state.isChunkError ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="interactive-btn inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                ページを再読み込みする
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, message: '', isChunkError: false });
                  this.props.onReset?.();
                }}
                className="interactive-btn inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                再読み込みする
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
