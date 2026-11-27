import React from 'react';
import { AlertTriangle, ArrowRight, ChevronDown } from 'lucide-react';
import { buildRoutePath, isPlainLeftClick } from '../utils/router';

interface WipNoticeBannerProps {
  showDisclaimerLink?: boolean;
  onOpenDisclaimer?: () => void;
}

export const WipNoticeBanner: React.FC<WipNoticeBannerProps> = ({
  showDisclaimerLink = true,
  onOpenDisclaimer,
}) => {
  return (
    <aside
      aria-label="開発中および内容の正確性に関する重要なお知らせ"
      className="app-notice-banner rounded-xl px-3.5 py-2.5 mb-4 text-xs sm:text-sm leading-relaxed"
    >
      <details className="wip-disclosure group">
        <summary className="wip-summary flex flex-wrap items-center gap-2 cursor-pointer list-none">
          <AlertTriangle
            className="h-4 w-4 shrink-0 app-notice-accent"
            aria-hidden="true"
          />
          <span className="app-notice-badge inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-wide shrink-0">
            開発中（WIP）
          </span>
          <span className="font-bold flex-1 min-w-[12rem]">
            教育・学習補助専用（実務設計への利用禁止・教科書との照合必須）
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold app-notice-accent shrink-0">
            <span>詳細</span>
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-180"
              aria-hidden="true"
            />
          </span>
        </summary>
        <div className="pt-2.5 mt-2 border-t border-[var(--notice-border)]/30 space-y-1.5 text-xs sm:text-sm">
          <p>
            本サイトは制作途上であり、解説文・数式・計算ロジック・図解・演習問題の解答に誤りや未検証の記述が含まれる可能性があります。学習の補助参考としてのみご利用いただき、必ず大学・高専の教科書や公的基準と照合してください（実務設計・施工・試験解答等への利用は厳禁です）。
          </p>
          {showDisclaimerLink && onOpenDisclaimer && (
            <div>
              <a
                href={buildRoutePath('legal')}
                onClick={(e) => {
                  if (isPlainLeftClick(e)) {
                    e.preventDefault();
                    onOpenDisclaimer();
                  }
                }}
                className="app-notice-accent inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2 cursor-pointer py-1"
              >
                免責事項・利用規約・検証方針を確認する
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </details>
    </aside>
  );
};
