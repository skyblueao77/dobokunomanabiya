import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || '予期しない表示エラーが発生しました。',
    };
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
              <h2 className="text-base font-bold">学習モジュールの表示に失敗しました</h2>
              <p className="text-sm app-text-muted">{this.state.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: '' });
              this.props.onReset?.();
            }}
            className="interactive-btn inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            再読み込みする
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
